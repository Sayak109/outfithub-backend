import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class CreateBlockedKeywordDto {

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    keywords: string[];
}
