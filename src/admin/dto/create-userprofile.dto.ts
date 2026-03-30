import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateUsersProfileDto {

    @IsString()
    @IsOptional()
    mobile_number: string

    @IsString()
    @IsOptional()
    gender: string

    @IsString()
    address1: string

    @IsString()
    @IsOptional()
    landmark: string

    @IsString()
    city: string

    @IsString()
    state: string

    @IsString()
    @IsOptional()
    country: string

    @IsString()
    pincode: string

    @IsString()
    business_name: string

    @IsString()
    @IsOptional()
    business_tag: string

    @IsString()
    @IsOptional()
    bank_business_name: string

    @IsString()
    bank_name: string

    @IsString()
    account_number: string

    @IsString()
    branch_name: string

    @IsString()
    ifsc_code: string

    @IsBoolean()
    @Transform(({ value }) => {
        if (value === undefined || value === null) return false;
        if (typeof value === "boolean") return value;
        return value === "true";
    })
    fake_seller: boolean = false;

    @ValidateIf(o => o.fake_seller === false)
    @IsString()
    GSTIN: string

    @ValidateIf(o => o.fake_seller === false)
    @IsString()
    PAN: string

}
