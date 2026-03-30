import { IsNumber, IsOptional, IsString } from "class-validator"

export class CreateUsersDto {

    @IsString()
    @IsOptional()
    first_name: string

    @IsString()
    @IsOptional()
    last_name: string

    @IsString()
    email: string

    @IsString()
    @IsOptional()
    phone_no: string

    @IsString()
    password: string

    @IsNumber()
    role_id: number

    @IsNumber()
    @IsOptional()
    approval_status_id: number

    @IsNumber()
    @IsOptional()
    account_status_id: number
}
