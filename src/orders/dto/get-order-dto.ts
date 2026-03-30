import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class GetOrderDto {
    @IsNumber()
    @IsOptional()
    page: number;

    @IsNumber()
    @IsOptional()
    rowsPerPage: number;

    @IsString()
    @IsOptional()
    search: string;

    @IsNumber()
    @IsOptional()
    sort: number;

    @IsString()
    @IsOptional()
    sort_by: string;




    // New Filters
    @IsString()
    @IsOptional()
    sellerId: string;

    @IsString()
    @IsOptional()
    buyerId: string;

    @IsDateString()
    @IsOptional()
    startDate: string; // filter from this date

    @IsDateString()
    @IsOptional()
    endDate: string; // filter to this date


    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'number') return [value];
        if (Array.isArray(value)) return value;

        return [];
    })
    @IsArray()
    @IsInt({ each: true })
    status: number[];

    @IsString()
    @IsOptional()
    returnStatus: string; //eg., "return processing", "returned"
}

