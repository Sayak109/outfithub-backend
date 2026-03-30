import { IsString } from "class-validator";

export class CreateFaqModuleDto {

    @IsString()
    name: string


    @IsString()
    desc: string
}
