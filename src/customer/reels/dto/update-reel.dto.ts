

import { IsOptional, IsInt } from 'class-validator';

export class UpdateReelDto {
    @IsOptional()
    @IsInt()
    likes?: number;

    @IsOptional()
    @IsInt()
    views?: number;
}
