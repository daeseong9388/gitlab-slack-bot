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

1. 컴포넌트 설계 원칙 (책임과 컴포지션)

단일 책임
- 컴포넌트가 하나의 명확한 역할만 수행하는가?
- 컴포넌트 이름이 그 역할을 잘 표현하는가?
- props가 해당 책임에 필요한 것들로만 제한되어 있는가?

컴포지션
- 재사용/확장이 용이한 설계인가?
- UI와 로직이 적절히 분리되어 있는가?
- 다른 컴포넌트와의 조합이 자연스러운가?

2. 성능 최적화

리렌더링 최적화
- 상태 관리가 적절한 위치에서 이루어지는가?
- 컴포넌트 외부의 고비용 계산 혹은 함수에 대한 메모이제이션
- 여러 컴포넌트에서 공유되는 계산의 캐싱

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

각 항목은 명확하고 구체적으로 작성해주세요.`;
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
