import { Optional } from "@nestjs/common";
import { IsArray, IsBoolean, IsDecimal, isDecimal, IsNumber, IsNumberString, IsOptional, IsString } from "class-validator";

export class GetBuyerExploreDto {
    @IsString()
    @IsOptional()
    search: string;

    @IsOptional()
    @IsNumber()
    page?: string;

    @IsOptional()
    @IsNumber()
    rowsPerPage?: string;

    @IsOptional()
    @IsArray()
    categoryIds?: bigint[];

    @IsOptional()
    @IsArray()
    attributeIds?: string[];

    @IsOptional()
    @IsBoolean()
    isNewCollection?: boolean;

    @IsOptional()
    @IsNumber()
    start_price?: number;

    @IsOptional()
    @IsNumber()
    end_price?: number;

    @IsOptional()
    @IsString()
    sortBy?: string;
}
