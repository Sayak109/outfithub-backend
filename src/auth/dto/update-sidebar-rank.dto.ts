import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator"
import { IsBigInt } from "../decorators/is-bigint.decorator";
import { Transform } from "class-transformer";

export class UpdateSidebarRankDto {
    @IsNumber()
    sidebar_id: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(1, { message: 'new_rank must be greater than 0' })
    new_rank: number

    @IsOptional()
    @Transform(({ value }) => value !== undefined ? BigInt(value) : undefined)
    @IsBigInt({ message: 'parent_id must be a BigInt value' })
    parent_id?: BigInt
}