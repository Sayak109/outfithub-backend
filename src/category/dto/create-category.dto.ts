import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateCategoryDto {

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsOptional()
    desc: string

    @IsOptional()
    @IsBoolean()
    show_home_page: boolean

    @IsString()
    @IsOptional()
    image: string

    @IsString()
    @IsOptional()
    parent_id: string


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
