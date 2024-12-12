import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App } from '@slack/bolt';
import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  KnownBlock,
  MessageAttachment,
} from '@slack/web-api';

// Define our own message type that's compatible with ChatPostMessageArguments
type SlackMessage = {
  text: string;
  blocks?: KnownBlock[];
  attachments?: MessageAttachment[];
  thread_ts?: string;
  reply_broadcast?: boolean;
  as_user?: boolean;
  mrkdwn?: boolean;
};

@Injectable()
export class SlackClientService implements OnModuleInit {
  private readonly app: App;
  private readonly logger = new Logger(SlackClientService.name);

  constructor(private readonly configService: ConfigService) {
    this.app = new App({
      token: this.configService.get<string>('SLACK_BOT_TOKEN'),
      signingSecret: this.configService.get<string>('SLACK_SIGNING_SECRET'),
    });
  }

  async onModuleInit() {
    try {
      const authInfo = await this.app.client.auth.test();
      this.logger.log('Slack bot initialized', {
        user_id: authInfo.user_id,
        team: authInfo.team,
        url: authInfo.url,
      });
    } catch (error) {
      this.logger.error('Failed to initialize Slack client:', error);
      throw error;
    }
  }

  async sendMessage(message: SlackMessage): Promise<ChatPostMessageResponse> {
    const channelId = this.configService.get<string>('SLACK_CHANNEL_ID');

    try {
      const postMessageArgs: ChatPostMessageArguments = {
        channel: channelId,
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments || [],
        thread_ts: message.thread_ts,
        reply_broadcast: message.reply_broadcast || false,
        as_user: true,
      };

      const result = await this.app.client.chat.postMessage(postMessageArgs);

      if (!result.ok) {
        throw new Error(`Failed to send message: ${result.error}`);
      }

      this.logger.debug('Message sent successfully', {
        channel: channelId,
        ts: result.ts,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to send Slack message:', {
        error: error.message,
        channel: channelId,
      });
      throw error;
    }
  }
}
