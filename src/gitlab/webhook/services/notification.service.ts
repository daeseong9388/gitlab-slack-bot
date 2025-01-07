import { Injectable, Logger } from '@nestjs/common';
import { ReviewNotification, MergeNotification } from '../types/gitlab.type';
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

  async sendMergeNotification(notification: MergeNotification) {
    try {
      await this.slackNotificationService.sendMergeNotification(notification);
    } catch (error) {
      this.logger.error('Failed to send merge notification', error);
      throw error;
    }
  }
}
