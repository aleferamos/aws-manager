import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Credential } from './credential.entity';
import { UserCredentialAuthority } from './user-credential-authority.entity';

@Entity({ name: 'user_credential' })
@Unique('user_credential_user_id_credential_id_unique', [
  'userId',
  'credentialId',
])
export class UserCredential {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: string;

  @ManyToOne(() => User, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user: User;

  @Column({
    name: 'user_id',
    type: 'bigint',
    nullable: false,
  })
  userId: string;

  @ManyToOne(() => Credential, (credential) => credential.userCredentials, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'credential_id',
  })
  credential: Credential;

  @Column({
    name: 'credential_id',
    type: 'bigint',
    nullable: false,
  })
  credentialId: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  active: boolean;

  @OneToMany(
    () => UserCredentialAuthority,
    (userCredentialAuthority) => userCredentialAuthority.userCredential,
  )
  authorities?: UserCredentialAuthority[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;
}
