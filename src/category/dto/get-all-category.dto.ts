import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class GetAllCategoryDto {

    @IsNumber()
    @IsOptional()
    page: number

    @IsNumber()
    @IsOptional()
    rowsPerPage: number

    @IsString()
    @IsOptional()
    search: string

    @IsBoolean()
    @IsOptional()
    parent: boolean

    @IsNumber()
    @IsOptional()
    status_id: number

    @IsNumber()
    @IsOptional()
    subcat_status_id: number

}
