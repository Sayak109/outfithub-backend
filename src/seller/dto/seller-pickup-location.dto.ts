import { IsNumber, IsOptional, IsString } from "class-validator"

export class SellerPickupLocationDto {
    @IsString()
    address: string;

    @IsString()
    @IsOptional()
    address_2: string;

    @IsString()
    city: string;

    @IsString()
    state: string;

    @IsString()
    pin_code: string;

    @IsString()
    country: string;

    @IsString()
    pickup_location: string;

    @IsNumber()
    @IsOptional()
    shiprocketCode: number;


    @IsNumber()
    phone: number;
}