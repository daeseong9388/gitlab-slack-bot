import { REVIEW_TYPES } from '@/common/constants/review.constant';

export type ReviewType = (typeof REVIEW_TYPES)[keyof typeof REVIEW_TYPES];

export interface ReviewNotification {
  type: ReviewType;
  username: string;
  userId: number;
  project: string;
  mergeRequest: {
    title: string;
    url: string;
    authorId: number;
    author: string;
    sourceBranch: string;
    targetBranch: string;
    state: string;
  };
  note: string;
  noteUrl: string;
  discussion?: {
    id: string;
    originalAuthor: {
      id: number;
      name: string;
    };
    lastReplyAuthor: {
      id: number;
      name: string;
    };
  };
}
