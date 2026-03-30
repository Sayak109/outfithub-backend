import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';

export enum LiveSource {
    INAPP = 'INAPP',
    YOUTUBE = 'YOUTUBE',
    FACEBOOK = 'FACEBOOK',
}

export class CreateLiveDto {

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
    roomId?: string;

    @IsString()
    @IsOptional()
    streamId?: string;

    @IsString()
    @IsOptional()
    hostId?: string;

    @IsString()
    @IsOptional()
    hostname?: string;
}
