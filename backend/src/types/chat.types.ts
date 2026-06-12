export type ChatRole = 'user' | 'assistant';

export type ChatContextMessage = {
  role: ChatRole;
  content: string;
  status?: 'done' | 'canceled' | 'error';
};

export type ChatStreamRequest = {
  message: string;
  conversationId?: string;
  context?: ChatContextMessage[];
};

export type SseEventName = 'start' | 'delta' | 'done' | 'error' | 'ping';

export type DeepSeekMessage = {
  role: 'system' | ChatRole;
  content: string;
};
