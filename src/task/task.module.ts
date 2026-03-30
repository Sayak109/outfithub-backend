import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { WebhookModule } from '@/webhook/webhook.module';
import { WebhookService } from '@/webhook/webhook.service';
import { SettingsService } from '@/settings/settings.service';


@Module({
    imports: [WebhookModule],
    providers: [TaskService, WebhookService, SettingsService]
})
export class TaskModule { }
