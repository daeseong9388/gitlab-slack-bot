import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GitLabApiModule } from './api/gitlab-api.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [ConfigModule, GitLabApiModule, WebhookModule],
  exports: [GitLabApiModule, WebhookModule],
})
export class GitLabModule {}
