import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";

export enum FAQStatus {
    PUBLISHED = 'PUBLISHED',
    DRAFT = 'DRAFT'
}

export class UpdateFaqModule {
    @IsNotEmpty()
    @IsNumber()
    id: number

    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsEnum(FAQStatus, { message: "status must be one of: PUBLISHED, DRAFT" })
    status: FAQStatus

    @IsNotEmpty()
    @IsNumber()
    rank: number
}