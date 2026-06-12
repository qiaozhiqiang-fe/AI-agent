import type { Response } from 'express';
import type {
  ChatStreamRequest,
  DeepSeekMessage,
  SseEventName,
} from '../types/chat.types.js';

const defaultTimeoutMs = 60000;
const mockResponseDelayMs = 28;

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
  public readonly code = 'MODEL_REQUEST_FAILED';
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
  const conversationId =
    request.conversationId || crypto.randomUUID();
  const messageId = crypto.randomUUID();

  writeSse(response, 'start', { conversationId, messageId });

  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    await streamMockResponse(request, response, clientSignal);
    return;
  }

  await streamDeepSeekResponse(request, response, clientSignal);
}

async function streamMockResponse(
  request: ChatStreamRequest,
  response: Response,
  signal: AbortSignal,
) {
  const previousTurns = Math.floor((request.context?.length ?? 0) / 2);
  const mockText = [
    '当前运行在本地 Mock 流式模式。',
    previousTurns > 0
      ? `我已接收到前面约 ${previousTurns} 轮对话上下文。`
      : '这是当前会话的第一轮问题。',
    `你刚才的问题是：“${request.message}”`,
    '配置 DEEPSEEK_API_KEY 后，服务会自动切换到真实 DeepSeek 流式接口。',
  ].join('\n\n');

  for (const chunk of splitText(mockText, 5)) {
    if (signal.aborted || response.writableEnded) {
      return;
    }

    writeSse(response, 'delta', { content: chunk });
    await delay(mockResponseDelayMs, signal);
  }

  if (!signal.aborted && !response.writableEnded) {
    writeSse(response, 'done', { finishReason: 'stop' });
  }
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
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
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
        errorBody.error?.message || 'DeepSeek request failed.',
      );
    }

    if (!upstreamResponse.body) {
      throw new DeepSeekServiceError('DeepSeek stream is unavailable.');
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
      throw new DeepSeekServiceError('DeepSeek request timed out.');
    }

    throw new DeepSeekServiceError('DeepSeek request failed.');
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

function splitText(text: string, size: number) {
  const chunks: string[] = [];

  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }

  return chunks;
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, ms);

    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}
