import { Injectable, Logger } from '@nestjs/common';
import {
  GitLabMergeRequest,
  GitLabNoteHook,
} from '../interfaces/gitlab-webhook.interface';
import { REVIEW_TYPES } from '@/common/constants/review.constant';
import { ReviewNotification, ReviewType } from '../types/gitlab.type';
import { NotificationService } from './notification.service';
import { REVIEW_TRIGGERS } from '../constants/gitlab.constant';
import { AIReviewService } from '@/ai/services/ai-review.service';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly aiReviewService: AIReviewService,
  ) {}

  async processNote(payload: GitLabNoteHook) {
    const { user, project, object_attributes, merge_request } = payload;

    if (
      !this.isValidMergeRequestNote(
        merge_request,
        object_attributes.noteable_type,
      )
    ) {
      this.logger.debug('Note is not on merge request');
      return { message: 'Note is not on merge request' };
    }

    const triggerType = this.getReviewTriggerType(object_attributes.note);
    if (!triggerType) {
      this.logger.debug('No trigger found in note');
      return { message: 'No trigger found in note' };
    }

    try {
      // Send Slack notification
      if (triggerType !== REVIEW_TYPES.AI_REVIEW) {
        const notification = this.createReviewNotification(
          triggerType,
          payload,
        );
        await this.notificationService.sendReviewNotification(notification);
      }

      // If the trigger is for AI review, process it
      if (triggerType === REVIEW_TYPES.AI_REVIEW) {
        await this.aiReviewService.processReviewRequest(
          project.id,
          merge_request.iid,
          object_attributes.note,
        );
      }

      this.logger.log(`Review notification sent: ${triggerType}`);
      return {
        message: 'Review notification sent',
        triggerType,
      };
    } catch (error) {
      this.logger.error('Failed to process review notification', {
        error: error.message,
        type: triggerType,
        user: user.name,
        project: project.name,
      });
      throw error;
    }
  }

  private isValidMergeRequestNote(
    mergeRequest?: GitLabMergeRequest,
    noteableType?: string,
  ): boolean {
    return (
      !!mergeRequest &&
      typeof mergeRequest.title === 'string' &&
      typeof mergeRequest.url === 'string' &&
      noteableType === 'MergeRequest'
    );
  }

  private getReviewTriggerType(note: string): ReviewType | null {
    const triggerMap = {
      [REVIEW_TRIGGERS.REQUEST]: REVIEW_TYPES.REQUEST,
      [REVIEW_TRIGGERS.START]: REVIEW_TYPES.START,
      [REVIEW_TRIGGERS.COMPLETE]: REVIEW_TYPES.COMPLETE,
      [REVIEW_TRIGGERS.RESPONSE]: REVIEW_TYPES.RESPONSE,
      [REVIEW_TRIGGERS.ADDITIONAL]: REVIEW_TYPES.ADDITIONAL,
      [REVIEW_TRIGGERS.AI_REVIEW]: REVIEW_TYPES.AI_REVIEW,
    };

    for (const [trigger, type] of Object.entries(triggerMap)) {
      if (note.includes(trigger)) {
        return type as ReviewType;
      }
    }

    return null;
  }

  private createReviewNotification(
    type: ReviewType,
    payload: GitLabNoteHook,
  ): ReviewNotification {
    const { user, project, object_attributes, merge_request } = payload;

    if (!merge_request) {
      throw new Error(
        'Merge request data is required for review notifications',
      );
    }

    // GitLab API에서는 author 정보가 last_commit.author에 있음
    const authorName = merge_request.last_commit?.author?.name || user.name;

    return {
      type,
      username: user.name,
      userId: user.id,
      project: project.name,
      mergeRequest: {
        title: merge_request.title,
        url: merge_request.url,
        authorId: merge_request.author_id,
        author: authorName,
        sourceBranch: merge_request.source_branch,
        targetBranch: merge_request.target_branch,
        state: merge_request.state,
      },
      note: object_attributes.note,
      noteUrl: object_attributes.url,
    };
  }
}
