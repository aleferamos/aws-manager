import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateAuthorityDto } from './dto/create-authority.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Authority } from './entities/authority.entity';
import { Brackets, Repository } from 'typeorm';
import { AuthorityInfoDto } from './dto/authority-info.dto';
import { ListAuthoritiesQueryDto } from './dto/list-authorities-query.dto';
import {
  AuthorityListItemDto,
  AuthorityListPageDto,
} from './dto/authority-list-item.dto';
import { AuthorityViewDto } from './dto/authority-view.dto';
import { UpdateAuthorityDto } from './dto/update-authority.dto';
import { I18nService } from '../shared/i18n/i18n.service';
import { UserAuthority } from './entities/user-authority.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';

interface AuthorityUsage {
  userAuthorities: Array<{
    userId: string;
    userName: string;
  }>;
  userCredentialAuthorities: Array<{
    userCredentialId: string;
    userId: string;
    userName: string;
    credentialId: string;
    credentialName: string;
  }>;
}

@Injectable()
export class AuthorityService {
  constructor(
    @InjectRepository(Authority)
    private readonly repository: Repository<Authority>,
    @InjectRepository(UserAuthority)
    private readonly userAuthorityRepository: Repository<UserAuthority>,
    @InjectRepository(UserCredentialAuthority)
    private readonly userCredentialAuthorityRepository: Repository<UserCredentialAuthority>,
    private readonly i18n: I18nService,
  ) {}

  async create(
    createAuthorityDto: CreateAuthorityDto,
  ): Promise<AuthorityInfoDto> {
    const code = createAuthorityDto.code.trim();
    const authorityAlreadyExists = await this.repository.exists({
      where: {
        code,
      },
    });

    if (authorityAlreadyExists) {
      throw new ConflictException({
        code: 'AUTHORITY_CODE_ALREADY_EXISTS',
        message: this.i18n.translate('authority.codeAlreadyExists'),
      });
    }

    const authority = await this.repository.save(
      this.repository.create({
        code,
        name: createAuthorityDto.name.trim(),
        description: this.toNullableString(createAuthorityDto.description),
        scope: createAuthorityDto.scope,
      }),
    );

    return {
      id: authority.id,
      code: authority.code,
      name: authority.name,
      description: authority.description,
      scope: authority.scope,
      createdAt: authority.createdAt,
    };
  }

  async list(query: ListAuthoritiesQueryDto): Promise<AuthorityListPageDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const queryBuilder = this.repository
      .createQueryBuilder('authority')
      .orderBy('authority.createdAt', 'DESC')
      .addOrderBy('authority.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    this.applyListSearchFilter(queryBuilder, query.search);

    const [authorities, total] = await queryBuilder.getManyAndCount();

    return {
      items: authorities.map((authority) => this.toListItem(authority)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async view(id: string): Promise<AuthorityViewDto> {
    const authority = await this.findViewAuthorityOrFail(id);

    return this.toView(authority);
  }

  async update(
    id: string,
    updateAuthorityDto: UpdateAuthorityDto,
  ): Promise<AuthorityViewDto> {
    await this.findViewAuthorityOrFail(id);

    await this.repository.update(id, {
      name: updateAuthorityDto.name.trim(),
      description: this.toNullableString(updateAuthorityDto.description),
      scope: updateAuthorityDto.scope,
    });

    return this.view(id);
  }

  async delete(id: string): Promise<void> {
    await this.findViewAuthorityOrFail(id);

    const usage = await this.getUsage(id);

    if (
      usage.userAuthorities.length ||
      usage.userCredentialAuthorities.length
    ) {
      throw new ConflictException({
        code: 'AUTHORITY_IN_USE',
        message: this.i18n.translate('authority.inUse'),
        usage,
      });
    }

    await this.repository.delete(id);
  }

  private async getUsage(id: string): Promise<AuthorityUsage> {
    const [userAuthorities, userCredentialAuthorities] = await Promise.all([
      this.userAuthorityRepository
        .createQueryBuilder('userAuthority')
        .innerJoinAndSelect('userAuthority.user', 'user')
        .leftJoinAndSelect('user.person', 'person')
        .where('userAuthority.authorityId = :id', { id })
        .orderBy('person.name', 'ASC')
        .addOrderBy('user.login', 'ASC')
        .take(10)
        .getMany(),
      this.userCredentialAuthorityRepository
        .createQueryBuilder('credentialAuthority')
        .innerJoinAndSelect(
          'credentialAuthority.userCredential',
          'userCredential',
        )
        .innerJoinAndSelect('userCredential.user', 'user')
        .leftJoinAndSelect('user.person', 'person')
        .innerJoinAndSelect('userCredential.credential', 'credential')
        .where('credentialAuthority.authorityId = :id', { id })
        .orderBy('credential.name', 'ASC')
        .addOrderBy('person.name', 'ASC')
        .addOrderBy('user.login', 'ASC')
        .take(10)
        .getMany(),
    ]);

    return {
      userAuthorities: userAuthorities.map((userAuthority) => ({
        userId: userAuthority.userId,
        userName: userAuthority.user.person?.name ?? userAuthority.user.login,
      })),
      userCredentialAuthorities: userCredentialAuthorities.map(
        (credentialAuthority) => ({
          userCredentialId: credentialAuthority.userCredentialId,
          userId: credentialAuthority.userCredential.userId,
          userName:
            credentialAuthority.userCredential.user.person?.name ??
            credentialAuthority.userCredential.user.login,
          credentialId: credentialAuthority.userCredential.credentialId,
          credentialName: credentialAuthority.userCredential.credential.name,
        }),
      ),
    };
  }

  private async findViewAuthorityOrFail(id: string): Promise<Authority> {
    const authority = await this.repository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        scope: true,
      },
    });

    if (!authority) {
      throw new BadRequestException({
        code: 'AUTHORITY_NOT_FOUND',
        message: this.i18n.translate('authority.notFound'),
      });
    }

    return authority;
  }

  private applyListSearchFilter(
    queryBuilder: ReturnType<Repository<Authority>['createQueryBuilder']>,
    search?: string,
  ): void {
    if (!search) {
      return;
    }

    const searchValue = `%${search.toLowerCase()}%`;

    queryBuilder.andWhere(
      new Brackets((where) => {
        where
          .where('LOWER(authority.code) LIKE :search', {
            search: searchValue,
          })
          .orWhere('LOWER(authority.name) LIKE :search', {
            search: searchValue,
          })
          .orWhere('LOWER(authority.scope) LIKE :search', {
            search: searchValue,
          });
      }),
    );
  }

  private toListItem(authority: Authority): AuthorityListItemDto {
    return {
      id: authority.id,
      code: authority.code,
      name: authority.name,
      scope: authority.scope,
      createdAt: this.formatDateTime(authority.createdAt),
    };
  }

  private toView(authority: Authority): AuthorityViewDto {
    return {
      id: authority.id,
      name: authority.name,
      description: authority.description,
      scope: authority.scope,
    };
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  private toNullableString(value?: string): string | null {
    const normalizedValue = value?.trim();

    return normalizedValue ? normalizedValue : null;
  }
}
