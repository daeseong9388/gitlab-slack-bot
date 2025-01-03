export const GITLAB_USERS: Record<string, string> = {
  '17': 'jelee',
  '18': 'manaemee',
  '27': 'ds.jeon',
  '28': 'dohkim',
};

export const getSlackMention = (userId: string | number) => {
  return `<@${GITLAB_USERS[userId] ?? GITLAB_USERS['27']}>`;
};
