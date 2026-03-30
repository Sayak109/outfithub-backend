import { PartialType } from '@nestjs/mapped-types';
import { CreateSellerAggrementDto } from './create-seller-aggrement.dto';

export class UpdateSellerAggrementDto extends PartialType(CreateSellerAggrementDto) {}
