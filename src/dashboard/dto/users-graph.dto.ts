import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator"

export class GraphDto {

    @IsNumber()
    @IsOptional()
    day: number

    @IsNumber()
    @IsOptional()
    month: number

    @IsNumber()
    @IsOptional()
    year: number

    @IsString()
    @IsOptional()
    type: string

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}
