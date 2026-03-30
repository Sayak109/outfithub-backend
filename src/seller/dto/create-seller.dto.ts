import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateSellerDto {

    @IsString()
    @IsOptional()
    mobile_number: string

    @IsString()
    @IsOptional()
    gender: string

    @IsString()
    address1: string

    @IsString()
    landmark: string

    @IsNotEmpty()
    @IsString()
    city: string

    @IsNotEmpty()
    @IsString()
    state: string

    @IsOptional()
    @IsString()
    country: string

    @IsNotEmpty()
    @IsString()
    pincode: string

    @IsNotEmpty()
    @IsString()
    business_name: string

    @IsString()
    @IsOptional()
    business_tag: string

    @IsString()
    @IsOptional()
    bank_business_name: string

    @IsNotEmpty()
    @IsString()
    bank_name: string

    @IsNotEmpty()
    @IsString()
    account_number: string

    @IsNotEmpty()
    @IsString()
    branch_name: string

    @IsNotEmpty()
    @IsString()
    ifsc_code: string

    @IsNotEmpty()
    @IsString()
    GSTIN: string

    @IsNotEmpty()
    @IsString()
    PAN: string

}
