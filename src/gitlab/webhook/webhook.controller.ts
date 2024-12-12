import { Controller, Post, Logger } from '@nestjs/common';
import { WebhookService } from './services/webhook.service';
import {
  GitLabWebhook,
  GitLabWebhookData,
} from './decorators/gitlab-webhook.decorator';
import { GitLabNoteHook } from './interfaces/gitlab-webhook.interface';

@Controller('webhook/gitlab')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async handleWebhook(@GitLabWebhook() webhook: GitLabWebhookData) {
    this.logger.log('Received GitLab webhook', {
      eventType: webhook.eventType,
      payload: webhook.payload,
    });

    try {
      // Verify webhook secret
      await this.webhookService.verifySecret(webhook.token);

      // Process webhook based on event type
      return this.webhookService.processWebhook(
        webhook.eventType,
        webhook.payload as GitLabNoteHook,
      );
    } catch (error) {
      this.logger.error('Error processing webhook', error);
      throw error;
    }
  }
}
