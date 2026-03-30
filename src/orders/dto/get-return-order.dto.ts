import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class GetReturnOrderDto {
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

    @IsNumber()
    @IsOptional()
    status: number; // e.g., 'pending', 'shipped', 'delivered'

    @IsString()
    @IsOptional()
    returnStatus: string; //eg., "return processing", "returned"
}

