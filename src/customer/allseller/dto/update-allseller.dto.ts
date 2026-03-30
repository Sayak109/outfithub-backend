import { PartialType } from '@nestjs/mapped-types';
import { CreateAllsellerDto } from './create-allseller.dto';

export class UpdateAllsellerDto extends PartialType(CreateAllsellerDto) {}
