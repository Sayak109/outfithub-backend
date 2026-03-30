import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class loginDto {
    @IsString()
    @IsOptional()
    first_name?: string

    @IsString()
    @IsOptional()
    last_name?: string

    @IsEmail()
    email: string

    @IsOptional()
    @IsString()
    password?: string

    @IsNotEmpty()
    auth_type: AuthProvider

    @IsString()
    @IsOptional()
    provider_id?: string

    @IsNumber()
    @IsOptional()
    guest_id: number;

}

export enum AuthProvider {
    LOCAL = 'EMAIL',
    GOOGLE = 'GOOGLE',
    APPLE = 'APPLE'
}