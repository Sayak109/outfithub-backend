import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";

export enum FAQStatus {
    PUBLISHED = 'PUBLISHED',
    DRAFT = 'DRAFT'
}

export class UpdateFaqDto {
    @IsNotEmpty()
    @IsNumber()
    id: number

    @IsNotEmpty()
    @IsString()
    question: string

    @IsNotEmpty()
    @IsString()
    answer: string

    @IsNotEmpty()
    @IsNumber()
    module_id: number

    @IsNotEmpty()
    @IsNumber()
    rank: number

    @IsNotEmpty()
    @IsEnum(FAQStatus, { message: "status must be one of: PUBLISHED, DRAFT" })
    status: FAQStatus
}