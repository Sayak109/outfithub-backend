
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class GetAllMenuTypeDto {
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
}