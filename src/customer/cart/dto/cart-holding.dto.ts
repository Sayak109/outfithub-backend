import { IsEnum } from "class-validator";

export enum Type {
    HOLD = "HOLD",
    ROLLBACK = "ROLLBACK",
}

export class CartHoldingDto {

    @IsEnum(Type)
    type: Type

}