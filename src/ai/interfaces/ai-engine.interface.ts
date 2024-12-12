import AnthropicClient from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';

export interface AIEngineConfig {
  apiKey: string;
  model: string;
  maxTokensOutput: number;
  maxTokensInput: number;
  baseURL?: string;
}

export type AIClient = AnthropicClient | OpenAI;

export interface AIReviewContext {
  mergeRequestId: number;
  projectId: number;
  title: string;
  description: string;
  changes: string;
  authorUsername: string;
  additionalContext?: Record<string, unknown>;
}

export interface AIReviewResult {
  summary: string;
  suggestions: string[];
  highlights: string[];
  risks: string[];
  metadata?: {
    model: string;
    timestamp: string;
    [key: string]: unknown;
  };
}

export interface AIEngine {
  config: AIEngineConfig;
  client: AIClient;
  generateReview(context: AIReviewContext): Promise<AIReviewResult>;
}
