import { Injectable, Logger } from '@nestjs/common';
import { ReviewNotification } from '../types/gitlab.type';
import { SlackNotificationService } from '@/slack/services/notification.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly slackNotificationService: SlackNotificationService,
  ) {}

  async sendReviewNotification(notification: ReviewNotification) {
    try {
      await this.slackNotificationService.sendReviewNotification(notification);
    } catch (error) {
      this.logger.error('Failed to send review notification', error);
      throw error;
    }
  }
}
