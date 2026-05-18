import { AuthorityScope } from '../entities/authority.entity';

export class AuthorityInfoDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope: AuthorityScope;
  createdAt: Date;
}
