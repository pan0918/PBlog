import { siteConfig } from '../../siteConfig';
import { recordAiUsage } from '../db/ai-usage';
import { estimateCostUsd, roughTokenCount, type TokenUsage } from './pricing';

const DEEPSEEK_CHAT_URL = 'https://api.deepseek.com/chat/completions';
const REQUEST_TIMEOUT_MS = 30_000;

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiRequest {
  /** Recorded with the usage so the dashboard can tell features apart. */
  feature: string;
  messages: AiMessage[];
  maxTokens: number;
  temperature?: number;
  /** Ask for a JSON object. The prompt itself must also ask for JSON. */
  json?: boolean;
  signal?: AbortSignal;
}

/** The key is missing or DeepSeek could not answer; callers fall back to non-AI behaviour. */
export class AiUnavailableError extends Error {}

export function isAiConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

interface DeepSeekUsage {
  prompt_tokens?: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
  completion_tokens?: number;
}

export function toTokenUsage(usage: DeepSeekUsage): TokenUsage {
  const cacheHitTokens = usage.prompt_cache_hit_tokens ?? 0;
  return {
    cacheHitTokens,
    cacheMissTokens: usage.prompt_cache_miss_tokens ?? Math.max(0, (usage.prompt_tokens ?? 0) - cacheHitTokens),
    completionTokens: usage.completion_tokens ?? 0,
  };
}

async function recordUsage(feature: string, usage: TokenUsage, at: Date) {
  const model = siteConfig.aiConfig.model;
  try {
    await recordAiUsage({ feature, model, usage, costUsd: estimateCostUsd(usage, model, at), at });
  } catch (error) {
    // A failed log write must not break the reply the visitor already paid for.
    console.error('Failed to record AI usage', error);
  }
}

async function postToDeepSeek(request: AiRequest, stream: boolean) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new AiUnavailableError('DEEPSEEK_API_KEY is not set');

  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const response = await fetch(DEEPSEEK_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    signal: request.signal ? AbortSignal.any([request.signal, timeout]) : timeout,
    body: JSON.stringify({
      model: siteConfig.aiConfig.model,
      messages: request.messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      // deepseek-flash thinks by default, which is slower and bills reasoning tokens.
      thinking: { type: 'disabled' },
      ...(request.json ? { response_format: { type: 'json_object' } } : {}),
      ...(stream ? { stream: true, stream_options: { include_usage: true } } : {}),
    }),
  });
  if (!response.ok) {
    throw new AiUnavailableError(`DeepSeek responded with HTTP ${response.status}`);
  }
  return response;
}

/** Single-shot completion. Returns the reply text. */
export async function completeChat(request: AiRequest): Promise<string> {
  const startedAt = new Date();
  const response = await postToDeepSeek(request, false);
  const data = await response.json() as {
    choices?: Array<{ message?: { content?: unknown } }>;
    usage?: DeepSeekUsage;
  };
  if (data.usage) await recordUsage(request.feature, toTokenUsage(data.usage), startedAt);

  const content = data.choices?.[0]?.message?.content;
  // JSON mode can return only whitespace even with finish_reason "stop".
  if (typeof content !== 'string' || !content.trim()) {
    throw new AiUnavailableError('DeepSeek returned an empty reply');
  }
  return content;
}

/** Yields the `data:` payloads of a server-sent event stream, stopping at `[DONE]`. */
export async function* readSseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        // Lines starting with ":" are keep-alive comments.
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        if (data) yield data;
      }
    }
  } finally {
    // Closes the upstream connection when the consumer stops early.
    await reader.cancel().catch(() => {});
  }
}

/**
 * Starts a streamed completion. Resolves once DeepSeek accepts the request
 * (so callers can still fall back before sending anything), then yields text
 * deltas. Usage is recorded when the stream ends or is cancelled.
 */
export async function openChatStream(request: AiRequest): Promise<AsyncGenerator<string>> {
  const startedAt = new Date();
  const response = await postToDeepSeek(request, true);
  const body = response.body;
  if (!body) throw new AiUnavailableError('DeepSeek returned no stream');

  return (async function* () {
    let usage: TokenUsage | null = null;
    try {
      for await (const data of readSseData(body)) {
        let chunk: { choices?: Array<{ delta?: { content?: unknown } }>; usage?: DeepSeekUsage };
        try {
          chunk = JSON.parse(data);
        } catch {
          continue;
        }
        if (chunk.usage) usage = toTokenUsage(chunk.usage);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) yield delta;
      }
    } finally {
      // A stream cut short (the visitor closed the chat) never reports usage.
      // DeepSeek may keep generating after the disconnect, so assume the full
      // output budget was used to keep the monthly estimate on the high side.
      await recordUsage(request.feature, usage ?? {
        cacheHitTokens: 0,
        cacheMissTokens: roughTokenCount(request.messages.map((message) => message.content).join('')),
        completionTokens: request.maxTokens,
      }, startedAt);
    }
  })();
}
