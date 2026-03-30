import { IsNumber, IsOptional, IsString } from "class-validator";

export class FaqPaginationDto {

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
