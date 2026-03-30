import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum FAQStatus {
    PUBLISHED = 'PUBLISHED',
    DRAFT = 'DRAFT'
}

export class CreateFaqModule {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsOptional()
    @IsEnum(FAQStatus, { message: "status must be one of: PUBLISHED, DRAFT" })
    status?: FAQStatus
}