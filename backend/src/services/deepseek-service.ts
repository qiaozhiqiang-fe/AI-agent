import type { Response } from 'express';
import type {
  ChatStreamRequest,
  DeepSeekMessage,
  SseEventName,
} from '../types/chat.types.js';

const defaultTimeoutMs = 60000;

type DeepSeekChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
};

type DeepSeekErrorResponse = {
  error?: {
    message?: string;
  };
};

export class DeepSeekServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function writeSse(
  response: Response,
  event: SseEventName,
  data: Record<string, unknown>,
) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

function buildMessages(request: ChatStreamRequest): DeepSeekMessage[] {
  const systemPrompt =
    process.env.DEEPSEEK_SYSTEM_PROMPT?.trim() ||
    '你是一名专业、准确的中文 AI 助手。优先遵守业务规则，回答应清晰、直接，并结合已有对话上下文。';

  const contextMessages: DeepSeekMessage[] = (request.context ?? []).map(
    ({ role, content }) => ({
      role,
      content: content.trim(),
    }),
  );

  return [
    { role: 'system', content: systemPrompt },
    ...contextMessages,
    { role: 'user', content: request.message },
  ];
}

export async function streamChat(
  request: ChatStreamRequest,
  response: Response,
  clientSignal: AbortSignal,
) {
  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    throw new DeepSeekServiceError(
      'MODEL_API_KEY_MISSING',
      'DeepSeek API Key 未配置，请先在 backend/.env 中配置 DEEPSEEK_API_KEY。',
    );
  }

  const conversationId =
    request.conversationId || crypto.randomUUID();
  const messageId = crypto.randomUUID();

  writeSse(response, 'start', { conversationId, messageId });

  await streamDeepSeekResponse(request, response, clientSignal);
}

async function streamDeepSeekResponse(
  request: ChatStreamRequest,
  response: Response,
  clientSignal: AbortSignal,
) {
  const timeoutMs = Number(
    process.env.DEEPSEEK_REQUEST_TIMEOUT_MS ?? defaultTimeoutMs,
  );
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
  const signal = AbortSignal.any([clientSignal, timeoutController.signal]);
  const baseUrl =
    process.env.DEEPSEEK_API_BASE_URL?.replace(/\/$/, '') ||
    'https://api.deepseek.com';

  try {
    const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
        messages: buildMessages(request),
        stream: true,
      }),
      signal,
    });

    if (!upstreamResponse.ok) {
      const errorBody = (await upstreamResponse
        .json()
        .catch(() => ({}))) as DeepSeekErrorResponse;
      throw new DeepSeekServiceError(
        'MODEL_REQUEST_FAILED',
        errorBody.error?.message || 'DeepSeek request failed.',
      );
    }

    if (!upstreamResponse.body) {
      throw new DeepSeekServiceError(
        'MODEL_STREAM_UNAVAILABLE',
        'DeepSeek stream is unavailable.',
      );
    }

    await pipeDeepSeekStream(upstreamResponse.body, response, signal);
  } catch (error) {
    if (clientSignal.aborted || response.writableEnded) {
      return;
    }

    if (error instanceof DeepSeekServiceError) {
      throw error;
    }

    if (timeoutController.signal.aborted) {
      throw new DeepSeekServiceError(
        'MODEL_REQUEST_TIMEOUT',
        'DeepSeek request timed out.',
      );
    }

    throw new DeepSeekServiceError(
      'MODEL_REQUEST_FAILED',
      'DeepSeek request failed.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function pipeDeepSeekStream(
  body: ReadableStream<Uint8Array>,
  response: Response,
  signal: AbortSignal,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (!signal.aborted) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine.startsWith('data:')) {
        continue;
      }

      const payload = trimmedLine.slice(5).trim();

      if (payload === '[DONE]') {
        writeSse(response, 'done', { finishReason: 'stop' });
        return;
      }

      const chunk = JSON.parse(payload) as DeepSeekChunk;
      const content = chunk.choices?.[0]?.delta?.content;

      if (content) {
        writeSse(response, 'delta', { content });
      }

      const finishReason = chunk.choices?.[0]?.finish_reason;

      if (finishReason) {
        writeSse(response, 'done', { finishReason });
        return;
      }
    }
  }
}
