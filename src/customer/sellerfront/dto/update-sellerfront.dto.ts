import { PartialType } from '@nestjs/mapped-types';
import { CreateSellerfrontDto } from './create-sellerfront.dto';

export class UpdateSellerfrontDto extends PartialType(CreateSellerfrontDto) {}
