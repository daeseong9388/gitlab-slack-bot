import { Module } from '@nestjs/common';
import { SlackClientService } from './services/client.service';
import { MessageService } from './services/message.service';
import { SlackNotificationService } from './services/notification.service';

@Module({
  providers: [SlackClientService, MessageService, SlackNotificationService],
  exports: [SlackNotificationService],
})
export class SlackModule {}
