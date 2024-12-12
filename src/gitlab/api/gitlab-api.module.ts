import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GitLabApiService } from './gitlab-api.service';

@Module({
  imports: [ConfigModule],
  providers: [GitLabApiService],
  exports: [GitLabApiService],
})
export class GitLabApiModule {}
