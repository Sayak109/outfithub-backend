import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponDto } from './create-coupon.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCouponDto {

    @IsString()
    @IsOptional()
    code: string

    @IsString()
    @IsOptional()
    desc: string

    @IsString()
    @IsOptional()
    type: string

    @IsNumber()
    @IsOptional()
    amount: number

    @IsNumber()
    @IsOptional()
    min_order_value: number

    @IsString()
    @IsOptional()
    expire_at: string

    @IsNumber()
    @IsOptional()
    status_id: number
}
