import type { ChatContextMessage } from '@/types/chat.types';

export type ChatStreamPayload = {
  message: string;
  conversationId?: string;
  context: ChatContextMessage[];
};

export type ChatStreamHandlers = {
  onStart: (data: { messageId: string; conversationId: string }) => void;
  onDelta: (data: { content: string }) => void;
  onDone: (data: { finishReason?: string }) => void;
  onError: (data: { code: string; message: string }) => void;
};

export async function streamChat(
  payload: ChatStreamPayload,
  signal: AbortSignal,
  handlers: ChatStreamHandlers,
) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.json().catch(() => null);
    handlers.onError({
      code: errorBody?.code || 'REQUEST_FAILED',
      message: errorBody?.message || '请求失败，请稍后重试。',
    });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (!signal.aborted) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const eventBlock of events) {
      dispatchEventBlock(eventBlock, handlers);
    }
  }
}

function dispatchEventBlock(
  eventBlock: string,
  handlers: ChatStreamHandlers,
) {
  const lines = eventBlock.split('\n');
  const eventLine = lines.find((line) => line.startsWith('event:'));
  const dataLine = lines.find((line) => line.startsWith('data:'));
  const eventName = eventLine?.slice(6).trim();
  const data = parseData(dataLine?.slice(5).trim());

  if (eventName === 'start') {
    handlers.onStart(data as { messageId: string; conversationId: string });
    return;
  }

  if (eventName === 'delta') {
    handlers.onDelta(data as { content: string });
    return;
  }

  if (eventName === 'done') {
    handlers.onDone(data as { finishReason?: string });
    return;
  }

  if (eventName === 'error') {
    handlers.onError(data as { code: string; message: string });
  }
}

function parseData(data: string | undefined) {
  if (!data) {
    return {};
  }

  try {
    return JSON.parse(data) as unknown;
  } catch {
    return {};
  }
}
