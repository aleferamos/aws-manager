import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserAuthority } from './user-authority.entity';

export type AuthorityScope = 'SYSTEM' | 'CREDENTIAL';

@Entity({ name: 'authority' })
export class Authority {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
  })
  code: string;

  @Column({
    type: 'varchar',
    length: 100,
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
    type: 'varchar',
    length: 30,
    nullable: false,
    default: 'SYSTEM',
  })
  scope: AuthorityScope;

  @OneToMany(() => UserAuthority, (userAuthority) => userAuthority.authority)
  userAuthorities?: UserAuthority[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;
}
