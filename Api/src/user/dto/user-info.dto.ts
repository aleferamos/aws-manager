import { UserType } from '../entities/user.entity';

export class UserInfoDto {
  id: string;
  personId: string | null;
  personName: string | null;
  type: UserType;
}
