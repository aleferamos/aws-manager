export class CredentialListItemDto {
  id: string;
  name: string;
  active: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}

export class CredentialListPageDto {
  items: CredentialListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
