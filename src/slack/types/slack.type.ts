export interface MessageBlock {
  type: 'section';
  text: {
    type: 'mrkdwn';
    text: string;
  };
}

export interface SlackMessage {
  blocks: MessageBlock[];
}
