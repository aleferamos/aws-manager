import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { UserCredential } from './user-credential.entity';

@Entity({ name: 'credential' })
export class Credential {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  description: string | null;

  @Column({
    name: 'encrypted_file',
    type: 'text',
    nullable: false,
    select: false,
  })
  encryptedFile: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  active: boolean;

  @ManyToOne(() => User, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({
    name: 'created_by_user_id',
  })
  createdByUser?: User | null;

  @Column({
    name: 'created_by_user_id',
    type: 'bigint',
    nullable: true,
  })
  createdByUserId: string | null;

  @OneToMany(
    () => UserCredential,
    (userCredential) => userCredential.credential,
  )
  userCredentials?: UserCredential[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;
}
