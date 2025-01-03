import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AnthropicClient from '@anthropic-ai/sdk';
import {
  MessageCreateParamsNonStreaming,
  TextBlock,
} from '@anthropic-ai/sdk/resources/messages.mjs';
import { tokenCount } from '../utils/token-count';
import {
  AIEngine,
  AIEngineConfig,
  AIReviewContext,
  AIReviewResult,
} from '../interfaces/ai-engine.interface';

@Injectable()
export class AnthropicProvider implements AIEngine {
  private readonly logger = new Logger(AnthropicProvider.name);
  config: AIEngineConfig;
  client: AnthropicClient;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    this.config = {
      apiKey,
      model:
        this.configService.get<string>('CLAUDE_MODEL') ||
        'claude-3-5-sonnet-20241022',
      maxTokensOutput: 4000,
      maxTokensInput: 100000,
    };

    this.client = new AnthropicClient({ apiKey: this.config.apiKey });
  }

  async generateReview(context: AIReviewContext): Promise<AIReviewResult> {
    try {
      const systemMessage = this.buildSystemMessage();
      const userMessage = this.buildUserMessage(context);

      // Calculate tokens
      const requestTokens =
        tokenCount(systemMessage) + tokenCount(userMessage) + 8;
      if (
        requestTokens >
        this.config.maxTokensInput - this.config.maxTokensOutput
      ) {
        throw new Error('Review request exceeds maximum token limit');
      }

      const params: MessageCreateParamsNonStreaming = {
        model: this.config.model,
        system: systemMessage,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.3,
        max_tokens: this.config.maxTokensOutput,
      };

      const response = (await this.client.messages.create(
        params,
      )) satisfies TextBlock;
      return this.parseResponse(response.content[0].text);
    } catch (error) {
      this.logger.error('Failed to generate review with Claude', error);
      throw error;
    }
  }

  private buildSystemMessage(): string {
    return `당신은 경험이 풍부한 시니어 개발자이자 코드 리뷰어입니다. 
주어진 merge request의 변경사항을 검토하고 건설적인 피드백을 제공하는 것이 당신의 임무입니다.

다음 측면들을 중점적으로 검토해주세요:

1. 코드 품질 및 모범 사례
   - 클린 코드 원칙 준수 여부
   - 코드 중복 및 재사용성
   - 네이밍 컨벤션
   - 일관된 코딩 스타일

2. 잠재적 버그 및 이슈
   - 엣지 케이스 처리
   - 예외 처리
   - 메모리 누수 가능성
   - 동시성 문제

3. 성능 고려사항
   - 알고리즘 복잡도
   - 리소스 사용 효율성
   - 데이터베이스 쿼리 최적화
   - 캐싱 활용 가능성

4. 보안 관련
   - 입력 값 검증
   - 인증/인가 처리
   - 민감 정보 처리
   - SQL 인젝션, XSS 등 보안 취약점

5. 유지보수성 및 가독성
   - 문서화 품질
   - 테스트 커버리지
   - 모듈화 및 의존성
   - 기술 부채 가능성

6. 아키텍처 및 설계
   - SOLID 원칙 준수
   - 디자인 패턴 적용
   - 확장성 고려
   - 의존성 관리

응답은 한글로 작성하며, 다음 JSON 구조를 따라주세요:
{
  "summary": "변경사항에 대한 간단한 요약",
  "suggestions": ["개선 제안 1", "개선 제안 2", ...],
  "highlights": ["특별히 잘한 점 1", "특별히 잘한 점 2", ...],
  "risks": ["잠재적 위험 1", "잠재적 위험 2", ...]
}`;
  }

  private buildUserMessage(context: AIReviewContext): string {
    return `다음 merge request 변경사항을 검토해주세요:

제목: ${context.title}
설명: ${context.description}
작성자: ${context.authorUsername}

변경사항:
${context.changes}

다음 형식의 JSON으로 응답해주세요:
{
  "summary": "전반적인 코드 품질과 변경사항에 대한 간단한 요약",
  "suggestions": ["구체적인 개선 제안들을 항목별로 나열"],
  "highlights": ["잘 작성된 부분들을 항목별로 나열"],
  "risks": ["주의가 필요한 부분들을 항목별로 나열"]
}

각 항목은 명확하고 구체적으로 작성해주시고, 가능한 한 코드 예시나 참조할 수 있는 문서 링크도 포함해주세요.`;
  }

  private parseResponse(response: string): AIReviewResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary,
        suggestions: parsed.suggestions,
        highlights: parsed.highlights || [],
        risks: parsed.risks || [],
        metadata: {
          model: this.config.model,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Failed to parse AI response', error);
      throw new Error('Failed to parse AI response');
    }
  }
}
