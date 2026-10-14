import { IsEmail } from 'class-validator';
import type { MagicLinkInput } from '@orion/types';

export class MagicLinkDto implements MagicLinkInput {
  @IsEmail()
  email!: string;
}
