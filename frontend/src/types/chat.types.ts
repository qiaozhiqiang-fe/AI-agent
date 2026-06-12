export type ChatRole = 'user' | 'assistant';

export type ChatMessageStatus =
  | 'done'
  | 'loading'
  | 'streaming'
  | 'error'
  | 'canceled';

export type ChatMode = 'quick' | 'expert';

export type ChatContextMessage = {
  role: ChatRole;
  content: string;
  status?: ChatMessageStatus;
};

export type ChatMessage = {
  id: string;
  serverId?: string;
  role: ChatRole;
  content: string;
  status: ChatMessageStatus;
  createdAt: number;
  sourceUserMessageId?: string;
  errorMessage?: string;
  actionMessage?: string;
};

export type ConversationItem = {
  id: string;
  title: string;
  group: '今天' | '昨天' | '7 天内' | '30 天内';
  active?: boolean;
};
