import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GitLabWebhook = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const eventType = request.headers['x-gitlab-event'];
    const token = request.headers['x-gitlab-token'];
    const payload = request.body;

    return {
      eventType,
      token,
      payload,
    };
  },
);

export interface GitLabWebhookData {
  eventType: string;
  token: string;
  payload: any;
}
