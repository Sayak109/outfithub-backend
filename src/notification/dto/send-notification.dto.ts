import { ArrayNotEmpty, IsArray, IsOptional, IsString } from "class-validator";

export class SendNotificationDto {

    @IsString()
    title: string

    @IsString()
    body: string

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    deviceTokens: string[];

    @IsOptional()
    @IsString()
    url: string

}
