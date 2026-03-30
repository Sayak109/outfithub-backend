import { IsNumber, IsOptional, IsString } from "class-validator"

export class LogReportDto {

    @IsNumber()
    page: number

    @IsNumber()
    rowsPerPage: number

    @IsString()
    @IsOptional()
    search: string
}