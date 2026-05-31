import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '../../../siteConfig';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  const { message, history = [], config } = await request.json();

  const petConfig = siteConfig.petConfig;

  // Allow client-side config override, fallback to server env / siteConfig
  const apiBaseUrl = config?.apiBaseUrl || process.env.PET_API_BASE_URL || 'https://generativelanguage.googleapis.com';
  const apiKey = config?.apiKey || process.env.PET_API_KEY || process.env.GEMINI_API_KEY || '';
  const model = config?.model || process.env.PET_MODEL || 'gemini-2.5-flash-lite';
  const systemPrompt = config?.systemPrompt || petConfig.systemPrompt;

  if (!apiKey) {
    return NextResponse.json({ reply: 'AI 助手暂未配置 API Key 喵~ 请点击猫咪头像进入设置配置。' });
  }

  // Build messages array
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  // Detect API format: if base URL contains 'generativelanguage' use Gemini format, otherwise OpenAI format
  const isGemini = apiBaseUrl.includes('generativelanguage');

  try {
    if (isGemini) {
      // Gemini API format
      const url = `${apiBaseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiMessages = messages.filter(m => m.role !== 'system');
      const systemMsg = messages.find(m => m.role === 'system');

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: (systemMsg?.content ? systemMsg.content + '\n\n' : '') + m.content }],
          })),
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.85,
          },
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
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 150,
          temperature: 0.85,
        }),
      });
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '喵？听不太懂...';
      return NextResponse.json({ reply });
    }
  } catch (error) {
    return NextResponse.json({ reply: '网络出问题了喵~' });
  }
}
