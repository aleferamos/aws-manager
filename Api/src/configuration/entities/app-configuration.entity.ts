import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'app_configuration' })
export class AppConfiguration {
  @PrimaryColumn({
    type: 'smallint',
  })
  id: number;

  @Column({
    name: 'json_config',
    type: 'jsonb',
    nullable: false,
  })
  jsonConfig: Record<string, unknown>;

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
