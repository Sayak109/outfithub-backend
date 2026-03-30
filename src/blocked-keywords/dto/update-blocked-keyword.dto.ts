import { PartialType } from '@nestjs/mapped-types';
import { CreateBlockedKeywordDto } from './create-blocked-keyword.dto';
import { ArrayNotEmpty, IsArray, IsInt, IsNumber } from 'class-validator';

export class UpdateBlockedKeywordDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    ids: number[];
}
