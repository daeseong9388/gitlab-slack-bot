import { encode } from 'gpt-tokenizer';

export function tokenCount(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}
