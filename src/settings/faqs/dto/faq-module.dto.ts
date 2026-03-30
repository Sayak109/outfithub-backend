import { IsNumber, IsOptional, IsString, ValidateIf } from "class-validator"

export class FaqModuleDto {
    @IsOptional()
    @IsNumber()
    page?: number

    @ValidateIf((o) => o.page !== undefined)
    @IsNumber()
    row_per_page?: number;

    @IsOptional()
    @IsString()
    search?: string
}
