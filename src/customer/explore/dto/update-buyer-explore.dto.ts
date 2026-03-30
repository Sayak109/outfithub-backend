import { PartialType } from '@nestjs/mapped-types';
import { CreateBuyerExploreDto } from './create-buyer-explore.dto';

export class UpdateBuyerExploreDto extends PartialType(CreateBuyerExploreDto) {}
