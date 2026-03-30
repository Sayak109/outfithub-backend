import { PartialType } from '@nestjs/mapped-types';
import { CreateReelDto } from './create-reel.dto';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { LiveSource } from '@/live/dto/create-live.dto';

export class UpdateReelDto {

    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string' && value.startsWith('[')) {
            value = JSON.parse(value);
        }
        const values = Array.isArray(value) ? value : [value];
        return values
            .filter((v) => v !== '')
            .map((v) => Number(v))
            .filter((v) => !isNaN(v));
    })
    @IsArray()
    product_ids: number[];

    @IsString()
    @IsOptional()
    likes: string

    @IsString()
    @IsOptional()
    views: string

    @IsEnum(LiveSource)
    source: LiveSource;

    @IsString()
    @IsOptional()
    facebookLink?: string;

    @IsString()
    @IsOptional()
    youtubeLink?: string;


    @IsString()
    @IsOptional()
    desc: string


}
