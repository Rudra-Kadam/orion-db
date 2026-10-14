import { IsIn, IsOptional, IsString } from 'class-validator';
import { COLUMN_TYPES } from '@supavolt/constants';
import type { ColumnType } from '@supavolt/types';

export class AddColumnDto {
  @IsString()
  name!: string;

  @IsIn(COLUMN_TYPES)
  type!: ColumnType;

  @IsOptional()
  @IsString()
  defaultValue?: string;
}
