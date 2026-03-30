import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"


export class PaymentDto {

    // @IsNotEmpty()
    // @IsString()
    // rzp_order_id: string

    // @IsNotEmpty()
    // @IsString()
    // rzp_transaction_id: string

    // @IsNotEmpty()
    // @IsString()
    // rzp_signature: string

    @IsNotEmpty()
    @IsString()
    data: string

}
