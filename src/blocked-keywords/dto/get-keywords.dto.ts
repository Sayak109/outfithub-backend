import { IsNumber, IsOptional, IsString } from "class-validator"

export class GetKeywordsDto {

    @IsNumber()
    page: number

    @IsNumber()
    rowsPerPage: number

    @IsString()
    @IsOptional()
    search: string
}
