import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  AccessAuthorityDto,
  AccessCredentialDto,
  AccessCredentialUserDto,
  AccessUserCredentialDto,
  AccessUserDto,
  AuthorityAccessDto,
  CredentialAccessDto,
  UserAccessDto,
} from './dto/access-info.dto';
import { LinkUserAuthorityDto } from './dto/link-user-authority.dto';
import { LinkUserCredentialAuthorityDto } from './dto/link-user-credential-authority.dto';
import { LinkUserCredentialDto } from './dto/link-user-credential.dto';
import { UpdateUserCredentialDto } from './dto/update-user-credential.dto';
import { Authority } from '../authority/entities/authority.entity';
import { UserAuthority } from '../authority/entities/user-authority.entity';
import { Credential } from '../credential/entities/credential.entity';
import { UserCredential } from '../credential/entities/user-credential.entity';
import { UserCredentialAuthority } from '../credential/entities/user-credential-authority.entity';
import { I18nService } from '../shared/i18n/i18n.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(Authority)
    private readonly authorityRepository: Repository<Authority>,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserAuthority)
    private readonly userAuthorityRepository: Repository<UserAuthority>,
    @InjectRepository(UserCredential)
    private readonly userCredentialRepository: Repository<UserCredential>,
    @InjectRepository(UserCredentialAuthority)
    private readonly userCredentialAuthorityRepository: Repository<UserCredentialAuthority>,
    private readonly i18n: I18nService,
  ) {}

  async getUserAccess(userId: string): Promise<UserAccessDto> {
    await this.findUserOrFail(userId);

    const [systemAuthorityLinks, userCredentials] = await Promise.all([
      this.userAuthorityRepository
        .createQueryBuilder('userAuthority')
        .innerJoinAndSelect('userAuthority.authority', 'authority')
        .where('userAuthority.userId = :userId', { userId })
        .orderBy('authority.name', 'ASC')
        .getMany(),
      this.userCredentialRepository
        .createQueryBuilder('userCredential')
        .innerJoinAndSelect('userCredential.credential', 'credential')
        .leftJoinAndSelect('userCredential.authorities', 'credentialAuthority')
        .leftJoinAndSelect('credentialAuthority.authority', 'authority')
        .where('userCredential.userId = :userId', { userId })
        .orderBy('credential.name', 'ASC')
        .addOrderBy('authority.name', 'ASC')
        .getMany(),
    ]);

    return {
      userId,
      systemAuthorities: systemAuthorityLinks.map((link) =>
        this.toAuthorityDto(link.authority),
      ),
      credentials: userCredentials.map((userCredential) =>
        this.toUserCredentialDto(userCredential),
      ),
    };
  }

  async getCredentialAccess(
    credentialId: string,
  ): Promise<CredentialAccessDto> {
    await this.findCredentialOrFail(credentialId);

    const userCredentials = await this.userCredentialRepository
      .createQueryBuilder('userCredential')
      .innerJoinAndSelect('userCredential.user', 'user')
      .leftJoinAndSelect('user.person', 'person')
      .leftJoinAndSelect('userCredential.authorities', 'credentialAuthority')
      .leftJoinAndSelect('credentialAuthority.authority', 'authority')
      .where('userCredential.credentialId = :credentialId', { credentialId })
      .orderBy('person.name', 'ASC')
      .addOrderBy('user.login', 'ASC')
      .addOrderBy('authority.name', 'ASC')
      .getMany();

    return {
      credentialId,
      users: userCredentials.map((userCredential) =>
        this.toCredentialUserDto(userCredential),
      ),
    };
  }

  async getAuthorityAccess(authorityId: string): Promise<AuthorityAccessDto> {
    const authority = await this.findAuthorityOrFail(authorityId);

    if (authority.scope === 'SYSTEM') {
      const userAuthorityLinks = await this.userAuthorityRepository
        .createQueryBuilder('userAuthority')
        .innerJoinAndSelect('userAuthority.user', 'user')
        .leftJoinAndSelect('user.person', 'person')
        .where('userAuthority.authorityId = :authorityId', { authorityId })
        .orderBy('person.name', 'ASC')
        .addOrderBy('user.login', 'ASC')
        .getMany();

      return {
        authority: this.toAuthorityDto(authority),
        users: userAuthorityLinks.map((link) => this.toUserDto(link.user)),
        userCredentials: [],
      };
    }

    const credentialAuthorityLinks =
      await this.userCredentialAuthorityRepository
        .createQueryBuilder('credentialAuthority')
        .innerJoinAndSelect(
          'credentialAuthority.userCredential',
          'userCredential',
        )
        .innerJoinAndSelect('userCredential.user', 'user')
        .leftJoinAndSelect('user.person', 'person')
        .innerJoinAndSelect('userCredential.credential', 'credential')
        .where('credentialAuthority.authorityId = :authorityId', {
          authorityId,
        })
        .orderBy('credential.name', 'ASC')
        .addOrderBy('person.name', 'ASC')
        .addOrderBy('user.login', 'ASC')
        .getMany();

    return {
      authority: this.toAuthorityDto(authority),
      users: [],
      userCredentials: credentialAuthorityLinks.map((link) => ({
        userCredentialId: link.userCredentialId,
        active: link.userCredential.active,
        user: this.toUserDto(link.userCredential.user),
        credential: this.toCredentialDto(link.userCredential.credential),
      })),
    };
  }

  async linkUserAuthority(
    linkUserAuthorityDto: LinkUserAuthorityDto,
  ): Promise<AccessAuthorityDto> {
    const [authority] = await Promise.all([
      this.findAuthorityOrFail(linkUserAuthorityDto.authorityId),
      this.findUserOrFail(linkUserAuthorityDto.userId),
    ]);

    this.assertSystemAuthority(authority);

    const existingLink = await this.userAuthorityRepository.findOne({
      where: {
        userId: linkUserAuthorityDto.userId,
        authorityId: linkUserAuthorityDto.authorityId,
      },
    });

    if (!existingLink) {
      await this.userAuthorityRepository.save(
        this.userAuthorityRepository.create({
          userId: linkUserAuthorityDto.userId,
          authorityId: linkUserAuthorityDto.authorityId,
        }),
      );
    }

    return this.toAuthorityDto(authority);
  }

  async unlinkUserAuthority(
    userId: string,
    authorityId: string,
  ): Promise<void> {
    await this.userAuthorityRepository.delete({
      userId,
      authorityId,
    });
  }

  async linkUserCredential(
    linkUserCredentialDto: LinkUserCredentialDto,
  ): Promise<AccessUserCredentialDto> {
    await Promise.all([
      this.findUserOrFail(linkUserCredentialDto.userId),
      this.findCredentialOrFail(linkUserCredentialDto.credentialId),
    ]);

    let userCredential = await this.userCredentialRepository.findOne({
      where: {
        userId: linkUserCredentialDto.userId,
        credentialId: linkUserCredentialDto.credentialId,
      },
    });

    if (!userCredential) {
      userCredential = await this.userCredentialRepository.save(
        this.userCredentialRepository.create({
          userId: linkUserCredentialDto.userId,
          credentialId: linkUserCredentialDto.credentialId,
          active: linkUserCredentialDto.active ?? true,
        }),
      );
    } else if (linkUserCredentialDto.active !== undefined) {
      await this.userCredentialRepository.update(userCredential.id, {
        active: linkUserCredentialDto.active,
      });
    }

    return this.getUserCredentialOrFail(userCredential.id);
  }

  async updateUserCredential(
    userCredentialId: string,
    updateUserCredentialDto: UpdateUserCredentialDto,
  ): Promise<AccessUserCredentialDto> {
    await this.findUserCredentialOrFail(userCredentialId);

    await this.userCredentialRepository.update(userCredentialId, {
      active: updateUserCredentialDto.active,
    });

    return this.getUserCredentialOrFail(userCredentialId);
  }

  async unlinkUserCredential(userCredentialId: string): Promise<void> {
    await this.findUserCredentialOrFail(userCredentialId);
    await this.userCredentialRepository.delete(userCredentialId);
  }

  async linkUserCredentialAuthority(
    linkUserCredentialAuthorityDto: LinkUserCredentialAuthorityDto,
  ): Promise<AccessAuthorityDto> {
    const [authority] = await Promise.all([
      this.findAuthorityOrFail(linkUserCredentialAuthorityDto.authorityId),
      this.findUserCredentialOrFail(
        linkUserCredentialAuthorityDto.userCredentialId,
      ),
    ]);

    this.assertCredentialAuthority(authority);

    const existingLink = await this.userCredentialAuthorityRepository.findOne({
      where: {
        userCredentialId: linkUserCredentialAuthorityDto.userCredentialId,
        authorityId: linkUserCredentialAuthorityDto.authorityId,
      },
    });

    if (!existingLink) {
      await this.userCredentialAuthorityRepository.save(
        this.userCredentialAuthorityRepository.create({
          userCredentialId: linkUserCredentialAuthorityDto.userCredentialId,
          authorityId: linkUserCredentialAuthorityDto.authorityId,
        }),
      );
    }

    return this.toAuthorityDto(authority);
  }

  async unlinkUserCredentialAuthority(
    userCredentialId: string,
    authorityId: string,
  ): Promise<void> {
    await this.userCredentialAuthorityRepository.delete({
      userCredentialId,
      authorityId,
    });
  }

  private async getUserCredentialOrFail(
    userCredentialId: string,
  ): Promise<AccessUserCredentialDto> {
    const userCredential = await this.userCredentialRepository
      .createQueryBuilder('userCredential')
      .innerJoinAndSelect('userCredential.credential', 'credential')
      .leftJoinAndSelect('userCredential.authorities', 'credentialAuthority')
      .leftJoinAndSelect('credentialAuthority.authority', 'authority')
      .where('userCredential.id = :userCredentialId', { userCredentialId })
      .orderBy('authority.name', 'ASC')
      .getOne();

    if (!userCredential) {
      throw new BadRequestException({
        code: 'USER_CREDENTIAL_NOT_FOUND',
        message: this.i18n.translate('access.userCredentialNotFound'),
      });
    }

    return this.toUserCredentialDto(userCredential);
  }

  private async findUserOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        person: true,
      },
      select: {
        id: true,
        login: true,
        active: true,
        person: {
          id: true,
          name: true,
          email: true,
        },
      },
    });

    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: this.i18n.translate('user.notFound'),
      });
    }

    return user;
  }

  private async findAuthorityOrFail(id: string): Promise<Authority> {
    const authority = await this.authorityRepository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        code: true,
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

  private async findCredentialOrFail(id: string): Promise<Credential> {
    const credential = await this.credentialRepository.findOne({
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

  private async findUserCredentialOrFail(id: string): Promise<UserCredential> {
    const userCredential = await this.userCredentialRepository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        active: true,
        userId: true,
        credentialId: true,
      },
    });

    if (!userCredential) {
      throw new BadRequestException({
        code: 'USER_CREDENTIAL_NOT_FOUND',
        message: this.i18n.translate('access.userCredentialNotFound'),
      });
    }

    return userCredential;
  }

  private assertSystemAuthority(authority: Authority): void {
    if (authority.scope !== 'SYSTEM') {
      throw new BadRequestException({
        code: 'ACCESS_SYSTEM_AUTHORITY_REQUIRED',
        message: this.i18n.translate('access.systemAuthorityRequired'),
      });
    }
  }

  private assertCredentialAuthority(authority: Authority): void {
    if (authority.scope !== 'CREDENTIAL') {
      throw new BadRequestException({
        code: 'ACCESS_CREDENTIAL_AUTHORITY_REQUIRED',
        message: this.i18n.translate('access.credentialAuthorityRequired'),
      });
    }
  }

  private toAuthorityDto(authority: Authority): AccessAuthorityDto {
    return {
      id: authority.id,
      code: authority.code,
      name: authority.name,
      description: authority.description,
      scope: authority.scope,
    };
  }

  private toCredentialDto(credential: Credential): AccessCredentialDto {
    return {
      id: credential.id,
      name: credential.name,
      active: credential.active,
    };
  }

  private toUserDto(user: User): AccessUserDto {
    return {
      id: user.id,
      name: user.person?.name ?? user.login,
      email: user.person?.email ?? user.login,
      active: user.active,
    };
  }

  private toUserCredentialDto(
    userCredential: UserCredential,
  ): AccessUserCredentialDto {
    return {
      id: userCredential.id,
      userCredentialId: userCredential.id,
      active: userCredential.active,
      credential: this.toCredentialDto(userCredential.credential),
      authorities: this.toCredentialAuthorityDtos(userCredential),
    };
  }

  private toCredentialUserDto(
    userCredential: UserCredential,
  ): AccessCredentialUserDto {
    return {
      userCredentialId: userCredential.id,
      active: userCredential.active,
      user: this.toUserDto(userCredential.user),
      authorities: this.toCredentialAuthorityDtos(userCredential),
    };
  }

  private toCredentialAuthorityDtos(
    userCredential: UserCredential,
  ): AccessAuthorityDto[] {
    return (userCredential.authorities ?? [])
      .filter((link) => link.authority)
      .map((link) => this.toAuthorityDto(link.authority));
  }
}
