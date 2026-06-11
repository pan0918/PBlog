import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "data", "messages.json");
const MAX_MESSAGE_LENGTH = 200;
const MAX_AUTHOR_LENGTH = 20;

type WallMessage = {
  id: string;
  content: string;
  author: string;
  colorIndex: number;
  createdAt: string;
};

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]\n", "utf8");
  }
}

async function readMessages(): Promise<WallMessage[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeMessages(messages: WallMessage[]) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, `${JSON.stringify(messages, null, 2)}\n`, "utf8");
}

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : fallback;
}

function normalizeMessage(input: Partial<WallMessage>, index = 0): WallMessage | null {
  const content = cleanText(input.content).slice(0, MAX_MESSAGE_LENGTH);
  if (!content) return null;

  const createdAt = typeof input.createdAt === "string" && !Number.isNaN(new Date(input.createdAt).getTime())
    ? new Date(input.createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: typeof input.id === "string" && input.id ? input.id : crypto.randomUUID(),
    content,
    author: cleanText(input.author, "匿名").slice(0, MAX_AUTHOR_LENGTH) || "匿名",
    colorIndex: Number.isInteger(input.colorIndex) ? input.colorIndex! : index,
    createdAt,
  };
}

export async function GET() {
  const messages = await readMessages();
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = await readMessages();

    if (Array.isArray(body.messages)) {
      const incoming = body.messages
        .map((item: Partial<WallMessage>, index: number) => normalizeMessage(item, index))
        .filter(Boolean) as WallMessage[];
      const seen = new Set<string>();
      const merged = [...incoming, ...current]
        .filter((message) => {
          if (seen.has(message.id)) return false;
          seen.add(message.id);
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100);

      await writeMessages(merged);
      return NextResponse.json({ messages: merged });
    }

    const message = normalizeMessage({
      content: body.content,
      author: body.author,
      colorIndex: Math.floor(Math.random() * 10),
    });

    if (!message) {
      return NextResponse.json({ error: "留言内容不能为空" }, { status: 400 });
    }

    const messages = [message, ...current].slice(0, 100);
    await writeMessages(messages);
    return NextResponse.json({ message, messages }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "留言保存失败" }, { status: 500 });
  }
}
