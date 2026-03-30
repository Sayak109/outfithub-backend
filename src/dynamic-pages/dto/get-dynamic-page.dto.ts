import { IsNumber, IsOptional, IsString } from "class-validator";

export class GetDynamicPageDTO {
    @IsNumber()
    @IsOptional()
    page: number

    @IsNumber()
    @IsOptional()
    rowsPerPage: number

    @IsString()
    @IsOptional()
    search: string
}