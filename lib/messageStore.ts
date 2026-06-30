import { promises as fs } from "fs";
import path from "path";
import { normalizePublicMessage, type WallMessage } from "./messageWall";

const DATA_FILE = path.join(process.cwd(), "data", "messages.json");

export async function readPublicMessages(limit = 100): Promise<WallMessage[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index) => normalizePublicMessage(item, index))
      .filter((message): message is WallMessage => Boolean(message))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch {
    return [];
  }
}
