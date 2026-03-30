import { PartialType } from '@nestjs/mapped-types';
import { AccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(AccountDto) { }
