import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCategoryDto {

    @IsString()
    @IsOptional()
    name: string

    @IsString()
    @IsOptional()
    desc: string

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    show_home_page: boolean;

    @IsString()
    @IsOptional()
    image: string

    @IsString()
    @IsOptional()
    status_id: string

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
