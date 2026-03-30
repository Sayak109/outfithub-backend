import { IsNumber } from "class-validator"

export class GetUsersDto {
    @IsNumber()
    page: number

    @IsNumber()
    rowsPerPage: number
}