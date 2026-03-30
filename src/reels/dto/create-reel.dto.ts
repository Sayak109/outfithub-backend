import { LiveSource } from "@/live/dto/create-live.dto";
import { Transform } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";

export class CreateReelDto {

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
