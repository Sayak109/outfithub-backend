import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class GetCategoryDto {

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
}
