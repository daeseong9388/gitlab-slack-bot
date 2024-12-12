import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GitLabModule } from '@/gitlab/gitlab.module';
import { AIModule } from '@/ai/ai.module';
import { SlackModule } from '@/slack/slack.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    GitLabModule,
    AIModule,
    SlackModule,
  ],
})
export class AppModule {}
