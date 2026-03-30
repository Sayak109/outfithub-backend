import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export enum FAQStatus {
    PUBLISHED = 'PUBLISHED',
    DRAFT = 'DRAFT'
}

export class CreateFaqDto {
    @IsNotEmpty()
    @IsString()
    question: string

    @IsNotEmpty()
    @IsString()
    answer: string

    @IsNotEmpty()
    @IsNumber()
    module_id: number

    @IsOptional()
    @IsEnum(FAQStatus, { message: "status must be one of: PUBLISHED, DRAFT" })
    status?: FAQStatus
}