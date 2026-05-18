import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Authority } from '../../authority/entities/authority.entity';
import { UserCredential } from './user-credential.entity';

@Entity({ name: 'user_credential_authority' })
export class UserCredentialAuthority {
  @PrimaryColumn({
    name: 'user_credential_id',
    type: 'bigint',
  })
  userCredentialId: string;

  @PrimaryColumn({
    name: 'authority_id',
    type: 'bigint',
  })
  authorityId: string;

  @ManyToOne(
    () => UserCredential,
    (userCredential) => userCredential.authorities,
    {
      nullable: false,
      eager: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'user_credential_id',
  })
  userCredential: UserCredential;

  @ManyToOne(() => Authority, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'authority_id',
  })
  authority: Authority;
}
