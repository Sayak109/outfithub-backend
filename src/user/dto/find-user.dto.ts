import { IsNotEmpty, IsString, MinLength } from "class-validator"

export class FindUserDto {
    @IsNotEmpty()
    @IsString()
    email: string

}