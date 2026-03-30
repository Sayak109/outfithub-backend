import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class GetReelsDto {

    @IsNumber()
    @IsOptional()
    page: number

    @IsNumber()
    @IsOptional()
    rowsPerPage: number

    @IsString()
    @IsOptional()
    search: string

    @IsNumber()
    @IsOptional()
    approval_status_id: number
}
