import { IsObject, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class SociallinksDto {
    @IsObject()
    @Type(() => Object)
    metadata: Record<string, string>;
}
