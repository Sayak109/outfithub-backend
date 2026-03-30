import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class UpdateCartDto {

    @IsArray()
    @IsOptional()
    @IsNumber({}, { each: true })
    attribute_term_ids: number[];

    @IsNumber()
    @IsOptional()
    quantity: number;

    @IsBoolean()
    @IsOptional()
    increase: boolean
}
