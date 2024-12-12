import { Injectable, Logger } from '@nestjs/common';
import { ReviewNotification } from '@/gitlab/webhook/types/gitlab.type';
import { SlackClientService } from './client.service';
import { MessageService } from './message.service';

@Injectable()
export class SlackNotificationService {
  private readonly logger = new Logger(SlackNotificationService.name);

  constructor(
    private readonly clientService: SlackClientService,
    private readonly messageService: MessageService,
  ) {}

  async sendReviewNotification(notification: ReviewNotification) {
    try {
      const message = this.messageService.createReviewMessage(notification);
      await this.clientService.sendMessage(message);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send review notification', error);
      throw error;
    }
  }
}
