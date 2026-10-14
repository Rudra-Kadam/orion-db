import { IsIn, IsOptional, IsString } from 'class-validator';
import { COLUMN_TYPES } from '@orion/constants';
import type { ColumnType } from '@orion/types';

export class AddColumnDto {
  @IsString()
  name!: string;

  @IsIn(COLUMN_TYPES)
  type!: ColumnType;

  @IsOptional()
  @IsString()
  defaultValue?: string;
}
