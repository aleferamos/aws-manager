import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Authority } from './authority.entity';

@Entity({ name: 'user_authority' })
export class UserAuthority {
  @PrimaryColumn({
    name: 'user_id',
    type: 'bigint',
  })
  userId: string;

  @PrimaryColumn({
    name: 'authority_id',
    type: 'bigint',
  })
  authorityId: string;

  @ManyToOne(() => User, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user: User;

  @ManyToOne(() => Authority, (authority) => authority.userAuthorities, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'authority_id',
  })
  authority: Authority;
}
