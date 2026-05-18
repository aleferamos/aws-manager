import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export type ListUsersStatusFilter = 'all' | 'active' | 'inactive' | 'pending';

export class ListUsersQueryDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsIn(['all', 'active', 'inactive', 'pending'])
  @IsOptional()
  status?: ListUsersStatusFilter = 'all';

  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 10))
  pageSize?: number = 10;
}
