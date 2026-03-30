import { IsNumber, IsOptional } from "class-validator";

export class CheckoutDto {

    @IsNumber()
    @IsOptional()
    coupon_id?: number;
}
