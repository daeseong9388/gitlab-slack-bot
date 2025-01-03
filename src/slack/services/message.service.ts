import { Injectable } from '@nestjs/common';
import { ReviewNotification } from '@/gitlab/webhook/types/gitlab.type';
import { KnownBlock } from '@slack/web-api';
import { getSlackMention, GITLAB_USERS } from '../constants/slack.constant';
import {
  REVIEW_TYPES,
  REVIEW_HEADERS,
} from '@/common/constants/review.constant';

@Injectable()
export class MessageService {
  createReviewMessage(notification: ReviewNotification): {
    text: string;
    blocks: KnownBlock[];
  } {
    const headerText = this.createHeaderText(notification);

    return {
      text: headerText,
      blocks: [
        this.createHeaderBlock(headerText),
        this.createMergeRequestBlock(notification),
        this.createFooterBlock(notification),
        this.createDividerBlock(),
      ],
    };
  }

  private createHeaderText(notification: ReviewNotification): string {
    const { type, userId, mergeRequest } = notification;
    const reviewerMention = getSlackMention(userId);
    const authorMention = getSlackMention(mergeRequest.authorId);
    const isAuthor = userId === mergeRequest.authorId;
    const headerText = REVIEW_HEADERS[type];

    let actionText = '';
    switch (type) {
      case REVIEW_TYPES.REQUEST:
        actionText = `${headerText} - ${authorMention}님이 요청`;
        break;
      case REVIEW_TYPES.START:
        actionText = `${headerText} - ${reviewerMention}님이 ${authorMention}님의 MR 검토`;
        break;
      case REVIEW_TYPES.COMPLETE:
        actionText = `${headerText} - ${reviewerMention}님이 ${authorMention}님의 MR 검토`;
        break;
      case REVIEW_TYPES.RESPONSE:
        actionText = isAuthor
          ? `${headerText} - ${authorMention}님이 응답`
          : `${headerText} - ${reviewerMention}님이 ${authorMention}님의 MR에 응답`;
        break;
      case REVIEW_TYPES.ADDITIONAL:
        actionText = `${headerText} - ${authorMention}님이 요청`;
        break;
      default:
        actionText = isAuthor
          ? `${authorMention}님의 코멘트`
          : `${reviewerMention}님이 ${authorMention}님의 코드에 코멘트`;
    }

    return actionText;
  }

  private createHeaderBlock(headerText: string): KnownBlock {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: headerText,
        emoji: true,
      },
    };
  }

  private createMergeRequestBlock(
    notification: ReviewNotification,
  ): KnownBlock {
    const { mergeRequest, noteUrl } = notification;
    const authorMention = getSlackMention(mergeRequest.authorId);

    const mrInfo = [
      `*제목:* <${mergeRequest.url}|${mergeRequest.title}>`,
      `*작성자:* ${authorMention}`,
      `*브랜치:* \`${mergeRequest.sourceBranch}\` → \`${mergeRequest.targetBranch}\``,
      `*코멘트:* <${noteUrl}|보기>`,
    ];

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: mrInfo.join('\n'),
      },
    };
  }

  private createDividerBlock(): KnownBlock {
    return {
      type: 'divider',
    };
  }

  private createFooterBlock(notification: ReviewNotification): KnownBlock {
    const { type, userId, noteUrl } = notification;
    const reviewerMention = getSlackMention(userId);

    let footerText = '';
    switch (type) {
      case REVIEW_TYPES.REQUEST:
        footerText = `${reviewerMention}님이 리뷰를 요청했습니다`;
        break;
      case REVIEW_TYPES.START:
        footerText = `${reviewerMention}님이 리뷰를 시작했습니다`;
        break;
      case REVIEW_TYPES.COMPLETE:
        footerText = `${reviewerMention}님이 리뷰를 완료했습니다`;
        break;
      case REVIEW_TYPES.RESPONSE:
        footerText = `${reviewerMention}님이 리뷰에 응답했습니다`;
        break;
      case REVIEW_TYPES.ADDITIONAL:
        footerText = `${reviewerMention}님이 추가 리뷰를 요청했습니다`;
        break;
      default:
        footerText = `${reviewerMention}님이 코멘트를 남겼습니다`;
    }
    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `👤 ${footerText} • <${noteUrl}|코멘트 보기>`,
        },
      ],
    };
  }
}
