import { IsEmail } from 'class-validator';
import type { MagicLinkInput } from '@supavolt/types';

export class MagicLinkDto implements MagicLinkInput {
  @IsEmail()
  email!: string;
}
