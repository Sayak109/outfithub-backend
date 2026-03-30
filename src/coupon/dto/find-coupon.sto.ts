import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class FindCouponDto {

    @IsNumber()
    @IsOptional()
    page: number

    @IsNumber()
    @IsOptional()
    rowsPerPage: number

    @IsString()
    @IsOptional()
    search: string

    @IsString()
    @IsOptional()
    type: string

    @IsNumber()
    @IsOptional()
    status_id: number
}
