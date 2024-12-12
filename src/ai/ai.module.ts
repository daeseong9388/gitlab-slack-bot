import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIReviewService } from './services/ai-review.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GitLabApiModule } from '../gitlab/api/gitlab-api.module';

@Module({
  imports: [
    ConfigModule,
    GitLabApiModule,
  ],
  providers: [
    AIReviewService,
    {
      provide: AnthropicProvider,
      useClass: AnthropicProvider,
    },
  ],
  exports: [AIReviewService],
})
export class AIModule {}
