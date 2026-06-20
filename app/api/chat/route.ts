import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '../../../siteConfig';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  message?: unknown;
  history?: unknown;
  config?: {
    apiBaseUrl?: string;
    apiKey?: string;
    model?: string;
    systemPrompt?: string;
  };
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY = 10;

// Hosts the relay is allowed to call — prevents this endpoint from being abused as an
// open relay / SSRF vector. Configurable via siteConfig.petConfig.allowedApiHosts.
const ALLOWED_HOSTS: string[] = siteConfig.petConfig.allowedApiHosts ?? [
  'generativelanguage.googleapis.com',
  'api.openai.com',
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

// Reject obvious cross-site use; stay lenient when no Origin/Referer is present
// (same-origin fetches without an Origin header, server-to-server, curl, etc.).
function isSameOrigin(request: NextRequest): boolean {
  const selfHost = request.nextUrl.host.toLowerCase();
  const candidate = request.headers.get('origin') || request.headers.get('referer');
  if (!candidate) return true;
  const h = hostOf(candidate);
  return h === null ? true : h === selfHost;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ reply: '喵？这个请求不太对劲...' }, { status: 403 });
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reply: '喵？没听清你说什么...' }, { status: 400 });
  }

  const { message, history, config } = body;

  // --- Validate input ---
  if (typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ reply: '说点什么呀喵~' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ reply: '太长了喵，说短一点~' }, { status: 400 });
  }

  const safeHistory: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(history)
    ? history
        .filter(
          (m): m is { role?: unknown; content: string } =>
            !!m && typeof m === 'object' && typeof (m as { content?: unknown }).content === 'string'
        )
        .slice(-MAX_HISTORY)
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content).slice(0, MAX_MESSAGE_LENGTH),
        }))
    : [];

  const petConfig = siteConfig.petConfig;
  const geminiConfig = siteConfig.geminiConfig;

  // Allow client-side config override, fallback to server env / siteConfig
  const apiBaseUrl = config?.apiBaseUrl || process.env.PET_API_BASE_URL || 'https://generativelanguage.googleapis.com';
  const apiKey = config?.apiKey || process.env.PET_API_KEY || process.env.GEMINI_API_KEY || '';
  const model = config?.model || process.env.PET_MODEL || geminiConfig.modelId || 'gemini-2.5-flash-lite';
  const systemPrompt = config?.systemPrompt || petConfig.systemPrompt;

  if (!apiKey) {
    return NextResponse.json({ reply: 'AI 助手暂未配置 API Key 喵~ 请点击猫咪头像进入设置配置。' });
  }

  // Enforce the host allowlist on the (possibly client-supplied) base URL.
  const baseHost = hostOf(apiBaseUrl);
  if (!baseHost || !ALLOWED_HOSTS.includes(baseHost)) {
    return NextResponse.json(
      { reply: '这个 API 地址不被允许喵~（可在 siteConfig.petConfig.allowedApiHosts 添加白名单）' },
      { status: 400 }
    );
  }

  const maxOutputTokens = geminiConfig.maxOutputTokens || 150;
  const temperature = typeof geminiConfig.temperature === 'number' ? geminiConfig.temperature : 0.85;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...safeHistory,
    { role: 'user', content: message },
  ];

  const isGemini = baseHost.includes('generativelanguage');

  try {
    if (isGemini) {
      // Gemini API format
      const url = `${apiBaseUrl.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const geminiMessages = messages.filter((m) => m.role !== 'system');
      const systemMsg = messages.find((m) => m.role === 'system');

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: (systemMsg?.content ? systemMsg.content + '\n\n' : '') + m.content }],
          })),
          generationConfig: { maxOutputTokens, temperature },
        }),
      });
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '喵？听不太懂...';
      return NextResponse.json({ reply });
    } else {
      // OpenAI-compatible format
      const url = `${apiBaseUrl.replace(/\/$/, '')}/v1/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, max_tokens: maxOutputTokens, temperature }),
      });
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '喵？听不太懂...';
      return NextResponse.json({ reply });
    }
  } catch {
    return NextResponse.json({ reply: '网络出问题了喵~' });
  }
}
