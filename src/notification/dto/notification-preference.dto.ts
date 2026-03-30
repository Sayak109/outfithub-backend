import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class PreferenceDto {


    @IsNumber()
    preference_id: number

    @IsBoolean()
    checked: boolean
}
