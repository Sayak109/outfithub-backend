import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateAttributeDto {

    @IsOptional()
    @IsString()
    name: string

    @IsArray()
    @IsOptional()
    values: string[]

    @IsOptional()
    @IsNumber()
    status_id: number
}
