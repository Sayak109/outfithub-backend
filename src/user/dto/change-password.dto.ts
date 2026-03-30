import { IsNotEmpty, IsString, MinLength } from "class-validator"

export class ChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    old_password: string

    @IsString()
    @MinLength(8)
    new_password: string;
}