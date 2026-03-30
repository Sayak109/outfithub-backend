import { PartialType } from '@nestjs/mapped-types';
import { ListType } from './create-wishlist.dto';
import { PaginationDto } from '@/customer/product/dto/pagination.dto';
import { IsEnum } from 'class-validator';

export class GetWishlistDto extends PartialType(PaginationDto) {

    @IsEnum(ListType)
    list_type: ListType

}
