import { PartialType } from '@nestjs/mapped-types';
import { CreateLiveDto } from './create-live.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateLiveDto extends PartialType(CreateLiveDto) {

    @IsBoolean()
    @IsOptional()
    isLive: boolean

}
