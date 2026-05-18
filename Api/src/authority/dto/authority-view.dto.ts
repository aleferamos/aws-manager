import { AuthorityScope } from '../entities/authority.entity';

export class AuthorityViewDto {
  id: string;
  name: string;
  description: string | null;
  scope: AuthorityScope;
}
