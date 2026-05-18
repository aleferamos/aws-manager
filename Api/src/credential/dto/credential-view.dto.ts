export type CredentialStatus = 'active' | 'inactive';

export class CredentialViewDto {
  id: string;
  name: string;
  active: boolean;
  status: CredentialStatus;
}
