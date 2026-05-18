export class UserViewPersonDto {
  id: string;
  name: string;
  phone: string | null;
}

export class UserViewDto {
  id: string;
  active: boolean;
  lastAccessAt: string | null;
  person: UserViewPersonDto | null;
}
