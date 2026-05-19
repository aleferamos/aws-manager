import {
  ConflictException,
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { SetAdminPasswordDto } from './dto/set-admin-password.dto';
import { UserInfoDto } from './dto/user-info.dto';
import {
  UserListItemDto,
  UserListPageDto,
  UserListRole,
  UserListStatus,
} from './dto/user-list-item.dto';
import { UserViewDto } from './dto/user-view.dto';
import {
  ListUsersQueryDto,
  ListUsersStatusFilter,
} from './dto/list-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserViewDto } from './dto/update-user-view.dto';
import { DefineUserPasswordDto } from './dto/define-user-password.dto';
import { ForgotUserPasswordDto } from './dto/forgot-user-password.dto';
import { Person } from './entities/person.entity';
import { I18nService } from '../shared/i18n/i18n.service';
import { EmailService } from '../shared/email/email.service';
import { buildPasswordDefinitionEmail } from './email/password-definition-email.template';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private repository: Repository<User>,
    private readonly i18n: I18nService,
    private readonly emailService: EmailService,
    private readonly configurationService: ConfigurationService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserInfoDto> {
    const email = createUserDto.email.trim().toLowerCase();
    const passwordRedefinitionCode = this.createPasswordRedefinitionCode();
    const passwordRedefinitionCodeHash = await this.hashPassword(
      passwordRedefinitionCode,
    );
    const passwordRedefinitionExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24,
    );
    const userAlreadyExists = await this.repository.exists({
      where: {
        login: email,
      },
    });

    if (userAlreadyExists) {
      throw new ConflictException({
        code: 'USER_EMAIL_ALREADY_EXISTS',
        message: this.i18n.translate('user.emailAlreadyExists'),
      });
    }

    const createdUser = await this.repository.manager.transaction(
      async (manager) => {
        const personRepository = manager.getRepository(Person);
        const userRepository = manager.getRepository(User);

        const person = personRepository.create({
          name: createUserDto.name.trim(),
          email,
          phone: this.normalizeOptionalText(createUserDto.phone),
          document: null,
        });
        const savedPerson = await personRepository.save(person);

        const user = userRepository.create({
          personId: savedPerson.id,
          login: email,
          password: null,
          passwordRedefinitionCode: passwordRedefinitionCodeHash,
          passwordRedefinitionExpiresAt,
          type: 'NORMAL',
          active: false,
        });
        const savedUser = await userRepository.save(user);

        return {
          id: savedUser.id,
          personId: savedPerson.id,
          personName: savedPerson.name,
          type: savedUser.type,
        };
      },
    );

    await this.sendPasswordDefinitionEmail(
      createdUser.personName ?? email,
      email,
      passwordRedefinitionCode,
    );

    return createdUser;
  }

  private createPasswordRedefinitionCode(): string {
    return randomBytes(32).toString('hex');
  }

  private async buildPasswordDefinitionUrl(
    code: string,
    email: string,
  ): Promise<string> {
    const siteUrl = await this.configurationService.getPasswordDefinitionUrlBase();
    const url = new URL('/set-password', siteUrl);

    url.searchParams.set('code', code);
    url.searchParams.set('email', email);

    return url.toString();
  }

  private async sendPasswordDefinitionEmail(
    name: string,
    email: string,
    code: string,
  ): Promise<void> {
    const emailTemplate = buildPasswordDefinitionEmail({
      name,
      definePasswordUrl: await this.buildPasswordDefinitionUrl(code, email),
    });

    await this.emailService.send({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
  }

  async forgotPassword(
    forgotUserPasswordDto: ForgotUserPasswordDto,
  ): Promise<void> {
    const email = forgotUserPasswordDto.email.trim().toLowerCase();
    const user = await this.findByPersonEmailForPasswordRedefinition(email);

    if (!user) {
      return;
    }

    const passwordRedefinitionCode = this.createPasswordRedefinitionCode();

    user.passwordRedefinitionCode = await this.hashPassword(
      passwordRedefinitionCode,
    );
    user.passwordRedefinitionExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24,
    );

    await this.repository.save(user);
    await this.sendPasswordDefinitionEmail(
      user.person?.name ?? email,
      user.person?.email ?? email,
      passwordRedefinitionCode,
    );
  }

  async definePassword(
    defineUserPasswordDto: DefineUserPasswordDto,
  ): Promise<void> {
    const email = defineUserPasswordDto.email.trim().toLowerCase();
    const user = await this.findByPersonEmailForPasswordDefinition(email);

    if (!user?.passwordRedefinitionCode) {
      throw new BadRequestException({
        code: 'USER_INVALID_PASSWORD_REDEFINITION_CODE',
        message: this.i18n.translate('user.invalidPasswordRedefinitionCode'),
      });
    }

    const codeMatches = await bcrypt.compare(
      defineUserPasswordDto.code,
      user.passwordRedefinitionCode,
    );

    if (!codeMatches) {
      throw new BadRequestException({
        code: 'USER_INVALID_PASSWORD_REDEFINITION_CODE',
        message: this.i18n.translate('user.invalidPasswordRedefinitionCode'),
      });
    }

    if (
      !user.passwordRedefinitionExpiresAt ||
      user.passwordRedefinitionExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException({
        code: 'USER_EXPIRED_PASSWORD_REDEFINITION_CODE',
        message: this.i18n.translate('user.expiredPasswordRedefinitionCode'),
      });
    }

    user.password = await this.hashPassword(defineUserPasswordDto.password);
    user.passwordRedefinitionCode = null;
    user.passwordRedefinitionExpiresAt = null;
    user.active = true;

    await this.repository.save(user);
  }

  private async findByPersonEmailForPasswordRedefinition(
    email: string,
  ): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.person', 'person')
      .where('LOWER(person.email) = :email', { email })
      .orWhere('LOWER(user.login) = :email', { email })
      .select([
        'user.id',
        'user.login',
        'user.passwordRedefinitionExpiresAt',
        'person.id',
        'person.name',
        'person.email',
      ])
      .getOne();
  }

  private async findByPersonEmailForPasswordDefinition(
    email: string,
  ): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.person', 'person')
      .where('LOWER(person.email) = :email', { email })
      .orWhere('LOWER(user.login) = :email', { email })
      .select([
        'user.id',
        'user.login',
        'user.passwordRedefinitionExpiresAt',
        'user.active',
        'person.id',
        'person.email',
      ])
      .addSelect('user.password')
      .addSelect('user.passwordRedefinitionCode')
      .getOne();
  }

  async getInfo(id: string): Promise<UserInfoDto> {
    const user = await this.repository.findOne({
      where: {
        id,
      },
      relations: {
        person: true,
      },
      select: {
        id: true,
        personId: true,
        type: true,
        person: {
          id: true,
          name: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHENTICATED',
        message: this.i18n.translate('auth.unauthenticated'),
      });
    }

    return {
      id: user.id,
      personId: user.personId ?? user.person?.id ?? null,
      personName: user.person?.name ?? null,
      type: user.type,
    };
  }

  async list(query: ListUsersQueryDto): Promise<UserListPageDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.person', 'person')
      .addSelect('user.password')
      .orderBy('user.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    this.applyListSearchFilter(queryBuilder, query.search);
    this.applyListStatusFilter(queryBuilder, query.status ?? 'all');

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      items: users.map((user) => ({
        id: user.id,
        name: user.person?.name ?? user.login,
        email: user.person?.email ?? user.login,
        role: this.toListRole(user),
        status: this.toListStatus(user),
        lastAccess: this.formatLastAccess(user.lastAccessAt),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async view(id: string): Promise<UserViewDto> {
    const user = await this.repository.findOne({
      where: {
        id,
      },
      relations: {
        person: true,
      },
      select: {
        id: true,
        active: true,
        lastAccessAt: true,
        person: {
          id: true,
          name: true,
          phone: true,
        },
      },
    });

    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: this.i18n.translate('user.notFound'),
      });
    }

    return {
      id: user.id,
      active: user.active,
      lastAccessAt: user.lastAccessAt?.toISOString() ?? null,
      person: user.person
        ? {
            id: user.person.id,
            name: user.person.name,
            phone: user.person.phone,
          }
        : null,
    };
  }

  async update(
    id: string,
    updateUserViewDto: UpdateUserViewDto,
  ): Promise<UserViewDto> {
    await this.repository.manager.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const personRepository = manager.getRepository(Person);
      const user = await userRepository.findOne({
        where: {
          id,
        },
        relations: {
          person: true,
        },
        select: {
          id: true,
          personId: true,
        },
      });

      if (!user) {
        throw new BadRequestException({
          code: 'USER_NOT_FOUND',
          message: this.i18n.translate('user.notFound'),
        });
      }

      await userRepository.update(id, {
        active: updateUserViewDto.active,
      });

      if (user.personId) {
        await personRepository.update(user.personId, {
          name: updateUserViewDto.person.name.trim(),
          phone: this.normalizeOptionalText(updateUserViewDto.person.phone),
        });
      }
    });

    return this.view(id);
  }

  private normalizeOptionalText(value?: string | null): string | null {
    const normalizedValue = value?.trim();

    return normalizedValue || null;
  }

  private applyListSearchFilter(
    queryBuilder: ReturnType<Repository<User>['createQueryBuilder']>,
    search?: string,
  ): void {
    if (!search) {
      return;
    }

    const normalizedSearch = search.toLowerCase();
    const searchValue = `%${normalizedSearch}%`;
    const roleTypes = this.getRoleTypesFromSearch(normalizedSearch);

    queryBuilder.andWhere(
      new Brackets((where) => {
        where
          .where('LOWER(person.name) LIKE :search', { search: searchValue })
          .orWhere('LOWER(person.email) LIKE :search', { search: searchValue })
          .orWhere('LOWER(user.login) LIKE :search', { search: searchValue })
          .orWhere('LOWER(user.type) LIKE :search', { search: searchValue });

        if (roleTypes.length) {
          where.orWhere('user.type IN (:...roleTypes)', { roleTypes });
        }
      }),
    );
  }

  private applyListStatusFilter(
    queryBuilder: ReturnType<Repository<User>['createQueryBuilder']>,
    status: ListUsersStatusFilter,
  ): void {
    if (status === 'active') {
      queryBuilder.andWhere('user.active = true');
      return;
    }

    if (status === 'pending') {
      queryBuilder.andWhere('user.active = false');
      queryBuilder.andWhere('user.password IS NULL');
      return;
    }

    if (status === 'inactive') {
      queryBuilder.andWhere('user.active = false');
      queryBuilder.andWhere('user.password IS NOT NULL');
    }
  }

  private getRoleTypesFromSearch(search: string): string[] {
    const roleTypes: string[] = [];

    if ('administrator'.includes(search) || 'admin'.includes(search)) {
      roleTypes.push('ROOT');
    }

    if ('operator'.includes(search) || 'normal'.includes(search)) {
      roleTypes.push('NORMAL');
    }

    return roleTypes;
  }

  private formatLastAccess(lastAccessAt: Date | null): string | null {
    if (!lastAccessAt) {
      return null;
    }

    const year = lastAccessAt.getFullYear();
    const month = String(lastAccessAt.getMonth() + 1).padStart(2, '0');
    const day = String(lastAccessAt.getDate()).padStart(2, '0');
    const hour = String(lastAccessAt.getHours()).padStart(2, '0');
    const minute = String(lastAccessAt.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  private toListRole(user: User): UserListRole {
    return user.type === 'ROOT' ? 'admin' : 'operator';
  }

  private toListStatus(user: User): UserListStatus {
    if (!user.active) {
      return user.password ? 'inactive' : 'pending';
    }

    return 'active';
  }

  async adminHasPassword() {
    const admin = await this.repository.findOne({
      where: {
        type: 'ROOT',
      },
      select: {
        id: true,
        login: true,
        password: true,
        active: true,
      },
    });

    if (!admin) {
      return {
        adminHasPassword: false,
      };
    }

    return {
      adminHasPassword: !!admin.password && admin.active,
    };
  }

  async setAdminPassword(
    setAdminPasswordDto: SetAdminPasswordDto,
  ): Promise<void> {
    const email = setAdminPasswordDto.email.trim().toLowerCase();
    const adminName = 'Admin';

    if (setAdminPasswordDto.password !== setAdminPasswordDto.confirmPassword) {
      throw new BadRequestException({
        code: 'USER_PASSWORD_CONFIRMATION_MISMATCH',
        message: this.i18n.translate('user.passwordMismatch'),
      });
    }

    const passwordHash = await this.hashPassword(setAdminPasswordDto.password);

    await this.repository.manager.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const personRepository = manager.getRepository(Person);
      const admin = await userRepository.findOne({
        where: { type: 'ROOT' },
        relations: {
          person: true,
        },
      });

      const emailAlreadyInUse = await userRepository.exists({
        where: {
          login: email,
        },
      });

      if (emailAlreadyInUse && admin?.login !== email) {
        throw new ConflictException({
          code: 'USER_EMAIL_ALREADY_EXISTS',
          message: this.i18n.translate('user.emailAlreadyExists'),
        });
      }

      let person = admin?.person ?? null;

      if (!person) {
        person = personRepository.create({
          name: adminName,
          email,
          phone: null,
          document: null,
        });
      } else {
        person.email = email;

        const currentName = person.name?.trim().toLowerCase();
        const previousLogin = admin?.login?.trim().toLowerCase();

        if (
          !currentName ||
          currentName === previousLogin ||
          currentName === email
        ) {
          person.name = adminName;
        }
      }

      const savedPerson = await personRepository.save(person);

      if (!admin) {
        await userRepository.save({
          personId: savedPerson.id,
          login: email,
          password: passwordHash,
          passwordRedefinitionCode: null,
          passwordRedefinitionExpiresAt: null,
          type: 'ROOT',
          active: true,
        });

        return;
      }

      admin.personId = savedPerson.id;
      admin.login = email;
      admin.password = passwordHash;
      admin.passwordRedefinitionCode = null;
      admin.passwordRedefinitionExpiresAt = null;
      admin.type = 'ROOT';
      admin.active = true;

      await userRepository.save(admin);
    });
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.repository.findOne({
      where: { login },
      select: {
        id: true,
        login: true,
        password: true,
        active: true,
      },
    });
  }

  async registerLastAccess(id: string): Promise<void> {
    await this.repository.update(id, {
      lastAccessAt: new Date(),
    });
  }
}
