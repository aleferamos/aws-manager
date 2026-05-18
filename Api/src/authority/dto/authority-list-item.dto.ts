import { AuthorityScope } from '../entities/authority.entity';

export class AuthorityListItemDto {
  id: string;
  code: string;
  name: string;
  scope: AuthorityScope;
  createdAt: string;
}

export class AuthorityListPageDto {
  items: AuthorityListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
