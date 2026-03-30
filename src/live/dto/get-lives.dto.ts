import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class GetLivesDto {

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
    approval_status_id: number
}
