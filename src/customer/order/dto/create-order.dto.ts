import { PartialType } from "@nestjs/mapped-types"
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"
import { CheckoutDto } from "./checkout.dto"

export class CreateOrderDto extends PartialType(CheckoutDto) {

    @IsNotEmpty()
    @IsNumber()
    billing_id: number

    @IsNotEmpty()
    @IsNumber()
    shipping_id: number

}
