import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Person } from './person.entity';

export type UserType = 'ROOT' | 'NORMAL';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id: string;

  @OneToOne(() => Person, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({
    name: 'person_id',
  })
  person?: Person | null;

  @Column({
    name: 'person_id',
    type: 'bigint',
    nullable: true,
    unique: true,
  })
  personId?: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
  })
  login: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  password: string | null;

  @Column({
    name: 'password_redefinition_code',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordRedefinitionCode: string | null;

  @Column({
    name: 'password_redefinition_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  passwordRedefinitionExpiresAt: Date | null;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: false,
    default: 'NORMAL',
  })
  type: UserType;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  active: boolean;

  @Column({
    name: 'last_access_at',
    type: 'timestamp',
    nullable: true,
  })
  lastAccessAt: Date | null;

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

  get isRoot(): boolean {
    return this.type === 'ROOT';
  }
}
