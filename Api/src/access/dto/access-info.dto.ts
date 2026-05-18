import type { AuthorityScope } from '../../authority/entities/authority.entity';

export class AccessAuthorityDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope: AuthorityScope;
}

export class AccessUserDto {
  id: string;
  name: string;
  email: string | null;
  active: boolean;
}

export class AccessCredentialDto {
  id: string;
  name: string;
  active: boolean;
}

export class AccessUserCredentialDto {
  id: string;
  userCredentialId: string;
  active: boolean;
  credential: AccessCredentialDto;
  authorities: AccessAuthorityDto[];
}

export class AccessCredentialUserDto {
  userCredentialId: string;
  active: boolean;
  user: AccessUserDto;
  authorities: AccessAuthorityDto[];
}

export class UserAccessDto {
  userId: string;
  systemAuthorities: AccessAuthorityDto[];
  credentials: AccessUserCredentialDto[];
}

export class CredentialAccessDto {
  credentialId: string;
  users: AccessCredentialUserDto[];
}

export class AuthorityAccessDto {
  authority: AccessAuthorityDto;
  users: AccessUserDto[];
  userCredentials: Array<{
    userCredentialId: string;
    active: boolean;
    user: AccessUserDto;
    credential: AccessCredentialDto;
  }>;
}
