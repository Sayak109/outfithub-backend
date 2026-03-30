import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDynamicPageDto {
    @IsString()
    @MaxLength(255)
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;


    @IsString()
    @IsOptional()
    meta_title: string
    @IsString()
    @IsOptional()
    meta_description: string
    @IsString()
    @IsOptional()
    meta_keyword: string
    @IsString()
    @IsOptional()
    other_meta: string
}