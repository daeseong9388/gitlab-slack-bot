import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './services/webhook.service';
import { ReviewService } from './services/review.service';
import { NotificationService } from './services/notification.service';
import { SlackModule } from '@/slack/slack.module';
import { AIModule } from '@/ai/ai.module';
import { GitLabApiModule } from '../api/gitlab-api.module';
import { MergeRequestService } from './services/merge-request.service';

@Module({
  imports: [ConfigModule, SlackModule, AIModule, GitLabApiModule],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    ReviewService,
    NotificationService,
    MergeRequestService,
  ],
})
export class WebhookModule {}
