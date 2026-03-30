import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class PaginationDto {

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
    link: string

    @IsNumber()
    @IsOptional()
    reelId: number

    @IsString()
    @IsOptional()
    type: string

    @IsNumber()
    @IsOptional()
    status_id: number

}
