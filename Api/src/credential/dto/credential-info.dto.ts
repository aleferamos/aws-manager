export class CredentialInfoDto {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
