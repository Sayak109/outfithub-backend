import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateMenuTypeDto {

    @IsString()
    name: string

    @IsNumber()
    @IsOptional()
    parent_id: number


}
