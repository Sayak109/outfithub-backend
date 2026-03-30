import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator"

export enum LogType {
    ERROR = "ERROR",
    WARNING = "WARNING",
    INFO = "INFO",
    SYNC_FAILURE = "SYNC_FAILURE",
    UI_ERROR = "UI_ERROR",
    USER_ISSUE = "USER_ISSUE"
}

export class CreateLogDto {
    @IsNotEmpty()
    @IsEnum(LogType, { message: 'type must be one of: ERROR, WARNING, INFO, SYNC_FAILURE, UI_ERROR, USER_ISSUE' })
    type: LogType

    @IsNotEmpty()
    @IsString()
    message: string

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    @IsOptional()
    @IsNumber()
    user_id?: number

    @IsOptional()
    @IsString()
    source?: string
}