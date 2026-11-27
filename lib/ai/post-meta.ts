import { z } from 'zod';
import type { AiMessage } from './deepseek';

// Enough for the model to grasp a long post while keeping one call well under a cent.
const MAX_CONTENT_CHARS = 12_000;
const MAX_TAGS = 5;

const SYSTEM_PROMPT = `你是一个中文技术博客的编辑助手。根据用户给出的文章标题和正文，生成文章摘要和标签。

要求：
- summary：60 到 120 个汉字，概括文章讲了什么、读者能得到什么。它会同时显示在文章列表里、作为搜索引擎的页面描述，所以要具体、通顺，不要以"本文"开头，不要用 Markdown。
- tags：3 到 5 个标签，每个不超过 12 个字。优先从"已有标签"里选意思相符的，名称要与已有标签完全一致；确实没有合适的再起新标签。

只输出一个 JSON 对象，格式为：{"summary": "...", "tags": ["...", "..."]}`;

export function buildPostMetaMessages(title: string, content: string, existingTags: string[]): AiMessage[] {
  // Image links are long and tell the model nothing about the topic.
  const text = content.replace(/!\[[^\]]*]\([^)]*\)/g, '').slice(0, MAX_CONTENT_CHARS);
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `已有标签：${existingTags.length ? existingTags.join('、') : '（暂无）'}\n\n标题：${title || '（未填写）'}\n\n正文：\n${text}`,
    },
  ];
}

const resultSchema = z.object({
  summary: z.string(),
  tags: z.array(z.unknown()).default([]),
});

export interface PostMeta {
  summary: string;
  tags: string[];
}

/** Parses the model's JSON reply, or returns null if it is unusable. */
export function parsePostMeta(raw: string): PostMeta | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = resultSchema.safeParse(json);
  if (!parsed.success) return null;

  const summary = parsed.data.summary.trim().slice(0, 500);
  if (!summary) return null;
  const tags = [...new Set(
    parsed.data.tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter((tag) => tag && tag.length <= 20),
  )].slice(0, MAX_TAGS);
  return { summary, tags };
}
