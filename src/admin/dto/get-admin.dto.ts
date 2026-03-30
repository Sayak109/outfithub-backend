import { IsNumber, IsOptional, IsString } from "class-validator"

export class GetUsersDto {

    @IsNumber()
    page: number

    @IsNumber()
    rowsPerPage: number

    @IsString()
    @IsOptional()
    search: string

    @IsNumber()
    @IsOptional()
    role_id: number

    @IsNumber()
    @IsOptional()
    account_status_id: number

    @IsNumber()
    @IsOptional()
    approval_status_id: number

    @IsString()
    @IsOptional()
    email: string
}
