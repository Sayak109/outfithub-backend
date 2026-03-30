import { IsNumber, IsString } from "class-validator";

export class CreateFaqDto {

    @IsNumber()
    module_id: number

    @IsString()
    question: string

    @IsString()
    answer: string

}
