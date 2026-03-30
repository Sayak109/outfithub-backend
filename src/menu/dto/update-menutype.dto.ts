import { PartialType } from "@nestjs/mapped-types";
import { CreateMenuTypeDto } from "./create-menutype.dto";

export class UpdateMenuTypeDto extends PartialType(CreateMenuTypeDto) { }

