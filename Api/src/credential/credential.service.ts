import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from './entities/credential.entity';
import { Brackets, Repository } from 'typeorm';
import { CredentialEncryptionService } from './credential-encryption.service';
import { CredentialInfoDto } from './dto/credential-info.dto';
import {
  CredentialListPageDto,
  CredentialListItemDto,
} from './dto/credential-list-item.dto';
import {
  ListCredentialsQueryDto,
  ListCredentialsStatusFilter,
} from './dto/list-credentials-query.dto';
import { CredentialViewDto } from './dto/credential-view.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';
import { I18nService } from '../shared/i18n/i18n.service';
import { UserCredential } from './entities/user-credential.entity';
import { User } from '../user/entities/user.entity';

interface CredentialUsage {
  userCredentials: Array<{
    userCredentialId: string;
    userId: string;
    userName: string;
    active: boolean;
  }>;
}

@Injectable()
export class CredentialService {
  constructor(
    @InjectRepository(Credential)
    private readonly repository: Repository<Credential>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserCredential)
    private readonly userCredentialRepository: Repository<UserCredential>,
    private readonly encryptionService: CredentialEncryptionService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    createCredentialDto: CreateCredentialDto,
    createdByUserId: string,
  ): Promise<CredentialInfoDto> {
    const credential = this.repository.create({
      name: createCredentialDto.name.trim(),
      description: this.toNullableString(createCredentialDto.description),
      encryptedFile: this.encryptionService.encrypt({
        accessKeyId: createCredentialDto.accessKeyId.trim(),
        secretKeyId: createCredentialDto.secretKeyId.trim(),
      }),
      active: true,
      createdByUserId,
    });

    const savedCredential = await this.repository.save(credential);

    return {
      id: savedCredential.id,
      name: savedCredential.name,
      description: savedCredential.description,
      active: savedCredential.active,
      createdByUserId: savedCredential.createdByUserId,
      createdAt: savedCredential.createdAt,
      updatedAt: savedCredential.updatedAt,
    };
  }

  async list(
    query: ListCredentialsQueryDto,
    authenticatedUserId: string,
  ): Promise<CredentialListPageDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const authenticatedUser =
      await this.findAuthenticatedUserOrFail(authenticatedUserId);
    const queryBuilder = this.repository
      .createQueryBuilder('credential')
      .orderBy('credential.createdAt', 'DESC')
      .addOrderBy('credential.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (!authenticatedUser.isRoot) {
      queryBuilder.innerJoin(
        UserCredential,
        'userCredential',
        [
          'userCredential.credentialId = credential.id',
          'userCredential.userId = :authenticatedUserId',
          'userCredential.active = true',
        ].join(' AND '),
        {
          authenticatedUserId,
        },
      );
    }

    this.applyListSearchFilter(queryBuilder, query.search);
    this.applyListStatusFilter(queryBuilder, query.status ?? 'all');

    const [credentials, total] = await queryBuilder.getManyAndCount();

    return {
      items: credentials.map((credential) => this.toListItem(credential)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private async findAuthenticatedUserOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        type: true,
        active: true,
      },
    });

    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: this.i18n.translate('user.notFound'),
      });
    }

    if (!user.active) {
      throw new ForbiddenException({
        code: 'AUTH_USER_DISABLED',
        message: this.i18n.translate('auth.userDisabled'),
      });
    }

    return user;
  }

  async view(id: string): Promise<CredentialViewDto> {
    const credential = await this.findViewCredentialOrFail(id);

    return this.toView(credential);
  }

  async update(
    id: string,
    updateCredentialDto: UpdateCredentialDto,
  ): Promise<CredentialViewDto> {
    const credential = await this.findViewCredentialOrFail(id);
    const active =
      updateCredentialDto.active ??
      (updateCredentialDto.status
        ? updateCredentialDto.status === 'active'
        : credential.active);

    await this.repository.update(id, {
      name: updateCredentialDto.name.trim(),
      active,
    });

    return this.view(id);
  }

  async delete(id: string): Promise<void> {
    await this.findViewCredentialOrFail(id);

    const usage = await this.getUsage(id);

    if (usage.userCredentials.length) {
      throw new ConflictException({
        code: 'CREDENTIAL_IN_USE',
        message: this.i18n.translate('credential.inUse'),
        usage,
      });
    }

    await this.repository.delete(id);
  }

  private async getUsage(id: string): Promise<CredentialUsage> {
    const userCredentials = await this.userCredentialRepository
      .createQueryBuilder('userCredential')
      .innerJoinAndSelect('userCredential.user', 'user')
      .leftJoinAndSelect('user.person', 'person')
      .where('userCredential.credentialId = :id', { id })
      .orderBy('person.name', 'ASC')
      .addOrderBy('user.login', 'ASC')
      .take(10)
      .getMany();

    return {
      userCredentials: userCredentials.map((userCredential) => ({
        userCredentialId: userCredential.id,
        userId: userCredential.userId,
        userName: userCredential.user.person?.name ?? userCredential.user.login,
        active: userCredential.active,
      })),
    };
  }

  private async findViewCredentialOrFail(id: string): Promise<Credential> {
    const credential = await this.repository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

    if (!credential) {
      throw new BadRequestException({
        code: 'CREDENTIAL_NOT_FOUND',
        message: this.i18n.translate('credential.notFound'),
      });
    }

    return credential;
  }

  private applyListSearchFilter(
    queryBuilder: ReturnType<Repository<Credential>['createQueryBuilder']>,
    search?: string,
  ): void {
    if (!search) {
      return;
    }

    const searchValue = `%${search.toLowerCase()}%`;

    queryBuilder.andWhere(
      new Brackets((where) => {
        where.where('LOWER(credential.name) LIKE :search', {
          search: searchValue,
        });
      }),
    );
  }

  private applyListStatusFilter(
    queryBuilder: ReturnType<Repository<Credential>['createQueryBuilder']>,
    status: ListCredentialsStatusFilter,
  ): void {
    if (status === 'active') {
      queryBuilder.andWhere('credential.active = true');
      return;
    }

    if (status === 'inactive') {
      queryBuilder.andWhere('credential.active = false');
    }
  }

  private toListItem(credential: Credential): CredentialListItemDto {
    return {
      id: credential.id,
      name: credential.name,
      active: credential.active,
      status: credential.active ? 'active' : 'inactive',
      createdAt: this.formatDateTime(credential.createdAt),
    };
  }

  private toView(credential: Credential): CredentialViewDto {
    return {
      id: credential.id,
      name: credential.name,
      active: credential.active,
      status: credential.active ? 'active' : 'inactive',
    };
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  private toNullableString(value?: string): string | null {
    const normalizedValue = value?.trim();

    return normalizedValue ? normalizedValue : null;
  }
}
