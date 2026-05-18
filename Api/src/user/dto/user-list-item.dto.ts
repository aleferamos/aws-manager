export type UserListRole = 'admin' | 'operator';
export type UserListStatus = 'active' | 'inactive' | 'pending';

export class UserListItemDto {
  id: string;
  name: string;
  email: string;
  role: UserListRole;
  status: UserListStatus;
  lastAccess: string | null;
}

export class UserListPageDto {
  items: UserListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
