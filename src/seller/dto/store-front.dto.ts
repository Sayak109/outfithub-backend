import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class StoreFrontDto {

    @IsNotEmpty()
    @IsString()
    primary_colour: string

    @IsNotEmpty()
    @IsString()
    secondary_colour: string

    @IsNotEmpty()
    @IsString()
    font: string

    @IsNotEmpty()
    @IsString()
    link: string

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
