import { ArrayNotEmpty, IsArray, IsOptional, IsString } from "class-validator";

export class SendNotificationToAllDto {

    @IsString()
    title: string

    @IsString()
    body: string

    @IsOptional()
    @IsString()
    url: string

}
