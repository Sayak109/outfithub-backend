import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateCouponDto {

    @IsNotEmpty()
    @IsString()
    code: string

    @IsOptional()
    @IsString()
    desc: string

    @IsString()
    @IsNotEmpty()
    type: string

    @IsNumber()
    @IsNotEmpty()
    amount: number

    @IsNumber()
    @IsOptional()
    min_order_value: number

    @IsString()
    @IsOptional()
    expire_at: string
}
