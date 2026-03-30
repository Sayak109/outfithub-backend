
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateShipRocketOrderDto {

    @IsString()
    pickuplocation: string
    @IsNumber()
    orderId: number

    @IsNumber()
    orderItemsId: number

    @IsNumber()
    length: number
    @IsNumber()
    breadth: number
    @IsNumber()
    height: number
    @IsNumber()
    weight: number

}