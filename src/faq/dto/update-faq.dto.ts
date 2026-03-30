import { PartialType } from '@nestjs/mapped-types';
import { CreateFaqDto } from './create-faq.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFaqDto extends PartialType(CreateFaqDto) {

    @IsString()
    @IsOptional()
    question: string;

    @IsString()
    @IsOptional()
    anwser: string;

    @IsNumber()
    @IsOptional()
    module_id: number;

    @IsNumber()
    @IsOptional()
    status_id: number;

    @IsNumber()
    @IsOptional()
    rank: number;

}
