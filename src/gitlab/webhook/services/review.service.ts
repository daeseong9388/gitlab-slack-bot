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
import { GitLabApiService } from '../../api/gitlab-api.service'; // Add this line

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly aiReviewService: AIReviewService,
    private readonly gitlabApiService: GitLabApiService, // Add this line
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
        const notification = await this.createReviewNotification(
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

  private async createReviewNotification(
    type: ReviewType,
    payload: GitLabNoteHook,
  ): Promise<ReviewNotification> {
    const { user, project, object_attributes, merge_request } = payload;

    const notification: ReviewNotification = {
      type,
      username: user.username,
      userId: user.id,
      project: project.path_with_namespace,
      mergeRequest: {
        title: merge_request.title,
        url: merge_request.url,
        authorId: merge_request.author_id,
        author: merge_request.author?.name || 'Unknown',
        sourceBranch: merge_request.source_branch,
        targetBranch: merge_request.target_branch,
        state: merge_request.state,
      },
      note: object_attributes.note,
      noteUrl: object_attributes.url,
    };

    // Add discussion information only for review responses
    if (type === REVIEW_TYPES.RESPONSE && object_attributes.discussion_id) {
      try {
        const discussion =
          await this.gitlabApiService.getMergeRequestDiscussion(
            project.id,
            merge_request.iid,
            object_attributes.discussion_id,
          );

        if (discussion.notes.length > 0) {
          const originalNote = discussion.notes[0];
          const lastNote = discussion.notes[discussion.notes.length - 1];

          notification.discussion = {
            id: discussion.id,
            originalAuthor: {
              id: originalNote.author.id,
              name: originalNote.author.name,
            },
            lastReplyAuthor: {
              id: lastNote.author.id,
              name: lastNote.author.name,
            },
          };
        }
      } catch (error) {
        this.logger.error('Failed to fetch discussion details', error);
      }
    }

    return notification;
  }
}
