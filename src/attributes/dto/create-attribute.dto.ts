import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class CreateAttributeDto {

    @IsString()
    @IsNotEmpty()
    name: string

    @IsArray()
    values: string[]
}
