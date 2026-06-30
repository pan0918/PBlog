import { NextRequest, NextResponse } from "next/server";
import { sendModerationEmail, EmailConfigurationError } from "../../../lib/messageEmail";
import { checkMessageRateLimit, validateMessageSubmission } from "../../../lib/messageWall";
import { readPublicMessages } from "../../../lib/messageStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    forwarded ||
    "unknown"
  );
}

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const messages = await readPublicMessages();
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = checkMessageRateLimit(ip);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "提交太频繁，请稍后再试" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  const body = await readJsonBody(request);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const validation = validateMessageSubmission({
    author: "author" in body ? body.author : undefined,
    content: "content" in body ? body.content : undefined,
    honeypot: "honeypot" in body ? body.honeypot : undefined,
  });

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  try {
    await sendModerationEmail({
      author: validation.author,
      content: validation.content,
      createdAt: new Date().toISOString(),
      ip,
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      ok: true,
      message: "留言已收到，审核后展示。",
    });
  } catch (error) {
    if (error instanceof EmailConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "留言通知发送失败，请稍后再试" }, { status: 502 });
  }
}
