
import { IsObject, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreateAdminSettingDto {

    // @IsString()
    // @IsOptional()
    // title: string

    @IsString()
    data: string

    // @IsObject()
    // @Type(() => Object)
    // metadata: Record<string, string>;


}
