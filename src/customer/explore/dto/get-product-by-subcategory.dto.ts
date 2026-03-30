import { IsNumber, IsOptional } from "class-validator";

export class GetProductBySubCategoryDto {
    @IsNumber()
    @IsOptional()
    page: number;

    @IsNumber()
    @IsOptional()
    rowsPerPage: number


}