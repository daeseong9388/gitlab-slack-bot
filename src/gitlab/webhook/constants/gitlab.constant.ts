export const GITLAB_EVENT_TYPES = {
  NOTE: 'Note Hook',
  MERGE_REQUEST: 'Merge Request Hook',
} as const;

export const REVIEW_TRIGGERS = {
  REQUEST: '[리뷰 요청]',
  START: '[리뷰 시작]',
  COMPLETE: '[리뷰 완료]',
  RESPONSE: '[리뷰 응답]',
  ADDITIONAL: '[추가 리뷰]',
  AI_REVIEW: '[AI 리뷰]',
} as const;
