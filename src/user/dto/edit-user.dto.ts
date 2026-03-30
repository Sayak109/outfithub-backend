import { Transform } from "class-transformer"
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class EditUserDto {
    @IsString()
    @IsOptional()
    first_name?: string

    @IsString()
    @IsOptional()
    last_name?: string

    @IsOptional()
    phone_no?: string

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    delete?: boolean
}