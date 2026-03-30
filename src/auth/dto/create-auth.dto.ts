import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, ValidateIf } from "class-validator"

export enum AuthProvider {
    LOCAL = 'EMAIL',
    GOOGLE = 'GOOGLE',
    APPLE = 'APPLE'
}
export class CreateAuthDto {
    @IsString()
    @IsOptional()
    first_name: string

    @IsString()
    @IsOptional()
    last_name: string

    @IsEmail()
    email: string

    // @ValidateIf(o => o.auth_type === AuthProvider.LOCAL)
    @IsOptional()
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string

    @IsNotEmpty()
    @IsEnum(AuthProvider, { message: 'auth type must be one of: EMAIL, GOOGLE, APPLE' })
    auth_type: AuthProvider

    @IsNumber()
    role_id: number

    @IsOptional()
    @IsString()
    provider_id?: string

    @IsOptional()
    @IsString()
    fcm_token?: string

    @IsOptional()
    @IsString()
    image?: string

    @IsNumber()
    @IsOptional()
    otp: number

    @IsNumber()
    @IsOptional()
    guest_id: number;

}