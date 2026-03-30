import { IsArray, IsString } from "class-validator"

export class CreateSupportTicketDto {

    @IsString()
    title: string

    @IsString()
    body: string

    @IsString()
    email: string
}
