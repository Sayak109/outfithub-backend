import { IsNumber, IsString } from "class-validator";

export class CreateShiprocketDto {
    @IsNumber()
    orderId: number;

    @IsString()
    pickupAddress: string
}