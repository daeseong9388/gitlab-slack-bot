import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitLabNoteHook } from '../interfaces/gitlab-webhook.interface';
import { GITLAB_EVENT_TYPES } from '../constants/gitlab.constant';
import { ReviewService } from './review.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly reviewService: ReviewService,
  ) {}

  async verifySecret(token: string): Promise<void> {
    const secret = this.configService.get<string>('GITLAB_WEBHOOK_SECRET');
    if (token !== secret) {
      this.logger.error('Invalid webhook secret provided');
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  async processWebhook(eventType: string, payload: GitLabNoteHook) {
    this.logger.log(`Processing webhook: ${eventType}`);

    if (eventType === GITLAB_EVENT_TYPES.NOTE) {
      return this.reviewService.processNote(payload);
    }

    this.logger.warn(`Unhandled GitLab event type: ${eventType}`);
    return { message: `Event ${eventType} received but not processed` };
  }
}
