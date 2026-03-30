import { IsString } from "class-validator";

export class AccountDto {

    @IsString()
    data: string
}
