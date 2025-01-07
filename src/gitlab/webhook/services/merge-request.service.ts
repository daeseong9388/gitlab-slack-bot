import { Injectable, Logger } from '@nestjs/common';
import { GitLabMergeRequestHook } from '../interfaces/gitlab-webhook.interface';
import { NotificationService } from './notification.service';
import { MergeNotification } from '../types/gitlab.type';

@Injectable()
export class MergeRequestService {
  private readonly logger = new Logger(MergeRequestService.name);

  constructor(private readonly notificationService: NotificationService) {}

  async processMergeRequest(payload: GitLabMergeRequestHook) {
    const { object_attributes, user, project, reviewers } = payload;

    if (object_attributes.action !== 'merge') {
      this.logger.debug(
        `Skipping merge request event with action: ${object_attributes.action}`,
      );
      return;
    }

    const notification: MergeNotification = {
      type: 'merge',
      username: user.username,
      userId: user.id,
      project: project.path_with_namespace,
      mergeRequest: {
        title: object_attributes.title,
        url: object_attributes.url,
        sourceBranch: object_attributes.source_branch,
        targetBranch: object_attributes.target_branch,
        description: object_attributes.description,
      },
      reviewers: reviewers?.map((reviewer) => ({
        id: reviewer.id,
        name: reviewer.name,
      })),
    };

    await this.notificationService.sendMergeNotification(notification);
  }
}
