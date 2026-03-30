import { IsNumber } from 'class-validator';

export class UpdateFeedbackDto {

    @IsNumber()
    status_id: number
}
