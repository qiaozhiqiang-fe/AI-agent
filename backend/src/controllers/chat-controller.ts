import type { Request, Response } from 'express';
import {
  DeepSeekServiceError,
  streamChat,
  writeSse,
} from '../services/deepseek-service.js';
import type { ChatContextMessage, ChatStreamRequest } from '../types/chat.types.js';

const maxMessageLength = 8000;
const maxContextMessages = 20;

export class ChatRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function handleChatStream(req: Request, res: Response) {
  const clientController = new AbortController();

  req.on('aborted', () => {
    clientController.abort();
  });

  res.on('close', () => {
    clientController.abort();
  });

  try {
    const request = parseChatRequest(req.body);

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        writeSse(res, 'ping', {});
      }
    }, 15000);

    try {
      await streamChat(request, res, clientController.signal);
    } finally {
      clearInterval(heartbeat);
    }
  } catch (error) {
    if (clientController.signal.aborted || res.writableEnded) {
      return;
    }

    const requestError =
      error instanceof ChatRequestError
        ? error
        : error instanceof DeepSeekServiceError
          ? new ChatRequestError(error.code, error.message, 502)
        : new ChatRequestError(
            'INTERNAL_SERVER_ERROR',
            '服务暂时不可用，请稍后重试。',
            500,
          );

    if (!res.headersSent) {
      res.status(requestError.status).json({
        code: requestError.code,
        message: requestError.message,
      });
      return;
    }

    writeSse(res, 'error', {
      code: requestError.code,
      message: requestError.message,
    });
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
}

function parseChatRequest(input: unknown): ChatStreamRequest {
  if (!input || typeof input !== 'object') {
    throw new ChatRequestError(
      'INVALID_REQUEST',
      '请求参数格式不正确。',
      400,
    );
  }

  const candidate = input as Partial<ChatStreamRequest>;
  const message = typeof candidate.message === 'string'
    ? candidate.message.trim()
    : '';

  if (!message) {
    throw new ChatRequestError('MESSAGE_REQUIRED', '请输入消息内容。', 400);
  }

  if (message.length > maxMessageLength) {
    throw new ChatRequestError(
      'MESSAGE_TOO_LONG',
      `消息内容不能超过 ${maxMessageLength} 个字符。`,
      400,
    );
  }

  const conversationId =
    typeof candidate.conversationId === 'string'
      ? candidate.conversationId.trim()
      : undefined;

  const context = Array.isArray(candidate.context)
    ? candidate.context.filter(isValidContextMessage)
    : [];

  return {
    message,
    conversationId,
    context: context.slice(-maxContextMessages),
  };
}

function isValidContextMessage(value: unknown): value is ChatContextMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ChatContextMessage>;

  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    candidate.content.trim().length > 0 &&
    candidate.status !== 'error'
  );
}
