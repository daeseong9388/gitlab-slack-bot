import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIReviewContext, AIReviewResult } from '../interfaces/ai-engine.interface';
import { GitLabApiService } from '@/gitlab/api/gitlab-api.service';
import { AnthropicProvider } from '../providers/anthropic.provider';

@Injectable()
export class AIReviewService {
  private readonly logger = new Logger(AIReviewService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly gitlabApiService: GitLabApiService,
    private readonly aiProvider: AnthropicProvider,
  ) {}

  async processReviewRequest(
    projectId: number,
    mergeRequestIid: number,
    trigger: string,
  ) {
    try {
      // 1. MR의 변경사항 가져오기
      const changes = await this.gitlabApiService.getMergeRequestChanges(
        projectId,
        mergeRequestIid,
      );

      // 2. AI 리뷰 요청 준비
      const reviewContext: AIReviewContext = {
        mergeRequestId: mergeRequestIid,
        projectId,
        title: changes.title,
        description: changes.description,
        changes: this.formatChanges(changes.changes),
        authorUsername: changes.author.username,
      };

      // 3. AI 서버에 리뷰 요청
      const review = await this.aiProvider.generateReview(reviewContext);

      // 4. 리뷰 결과를 GitLab 코멘트로 포맷팅
      const comment = this.formatReviewComment(review);

      // 5. GitLab MR에 코멘트 작성
      await this.gitlabApiService.addMergeRequestNote(
        projectId,
        mergeRequestIid,
        { body: comment },
      );

      return { success: true, review };
    } catch (error) {
      this.logger.error('Failed to process AI review', {
        error,
        projectId,
        mergeRequestIid,
      });
      throw error;
    }
  }

  private formatChanges(changes: any[]): string {
    return changes
      .map((change) => {
        const diffHeader = `File: ${change.new_path} (${change.new_file ? 'new file' : 
          change.deleted_file ? 'deleted' : 'modified'})`;
        return `${diffHeader}\n${change.diff}`;
      })
      .join('\n\n');
  }

  private formatReviewComment(review: AIReviewResult): string {
    const comment = [
      '## AI 리뷰 결과 🤖',
      '',
      '### 요약',
      review.summary,
      '',
      '### 잘된 점 ✨',
      ...review.highlights.map(highlight => `- ${highlight}`),
      '',
      '### 개선 제안 💡',
      ...review.suggestions.map(suggestion => `- ${suggestion}`),
      '',
    ];

    if (review.risks.length > 0) {
      comment.push(
        '### 주의 사항 ⚠️',
        ...review.risks.map(risk => `- ${risk}`),
        '',
      );
    }

    comment.push(
      '---',
      `리뷰 시간: ${new Date(review.metadata?.timestamp || Date.now()).toLocaleString('ko-KR')}`,
      `모델: ${review.metadata?.model || 'Claude'}`,
    );

    return comment.join('\n');
  }
}
