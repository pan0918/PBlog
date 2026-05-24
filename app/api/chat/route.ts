import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '../../../siteConfig';

export async function POST(request: NextRequest) {
  const { message } = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ reply: 'AI 助手暂未配置 API Key 喵~' });
  }

  const config = siteConfig.geminiConfig;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${config.systemPrompt}\n\n用户说: ${message}` }] },
          ],
          generationConfig: {
            maxOutputTokens: config.maxOutputTokens,
            temperature: config.temperature,
          },
        }),
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '喵？听不太懂...';

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ reply: '网络出问题了喵~' });
  }
}
