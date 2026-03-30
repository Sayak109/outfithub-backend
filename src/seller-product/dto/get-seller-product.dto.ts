import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class GetSellerProductDto {

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
    status_id: number

    @IsNumber()
    @IsOptional()
    approval_status_id: number
}
