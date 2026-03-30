import { PartialType } from "@nestjs/mapped-types";
import { CreateDynamicPageDto } from "./create-dynamic-page.dto";
import { IsString, IsOptional, IsBoolean } from "class-validator";

export class UpdateDynamicPageDto extends PartialType(CreateDynamicPageDto) {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
