import { PartialType } from '@nestjs/mapped-types';
import { CreateUsersDto } from './create-admin.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAdminDto {
    @IsString()
    @IsOptional()
    first_name: string

    @IsString()
    @IsOptional()
    last_name: string

    @IsString()
    @IsOptional()
    email: string

    @IsString()
    @IsOptional()
    phone_no: string

    @IsString()
    @IsOptional()
    old_password: string

    @IsString()
    @IsOptional()
    password: string

    @IsNumber()
    @IsOptional()
    role_id: number

    @IsNumber()
    @IsOptional()
    approval_status_id: number

    @IsNumber()
    @IsOptional()
    account_status_id: number
}
