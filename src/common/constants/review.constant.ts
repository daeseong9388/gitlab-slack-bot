export const REVIEW_TYPES = {
  REQUEST: 'request',
  START: 'start',
  COMPLETE: 'complete',
  RESPONSE: 'response',
  ADDITIONAL: 'additional',
  AI_REVIEW: 'ai_review',
} as const;

export const REVIEW_HEADERS = {
  [REVIEW_TYPES.REQUEST]: '🙏 리뷰 요청',
  [REVIEW_TYPES.START]: '👀 리뷰 시작',
  [REVIEW_TYPES.COMPLETE]: '✅ 리뷰 완료',
  [REVIEW_TYPES.RESPONSE]: '💬 리뷰 응답',
  [REVIEW_TYPES.ADDITIONAL]: '📝 추가 리뷰',
  [REVIEW_TYPES.AI_REVIEW]: '🤖 AI 리뷰',
} as const;

export type ReviewType = (typeof REVIEW_TYPES)[keyof typeof REVIEW_TYPES];
