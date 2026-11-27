import { NextRequest } from 'next/server';
import { requireAdmin, success, error, readBody } from '../../../../../lib/admin/api-helpers';
import { aiPostMetaSchema } from '../../../../../lib/admin/validators';
import { completeChat, isAiConfigured } from '../../../../../lib/ai/deepseek';
import { buildPostMetaMessages, parsePostMeta } from '../../../../../lib/ai/post-meta';
import { getAllTags } from '../../../../../lib/db/tags';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { error: authErr } = await requireAdmin();
  if (authErr) return authErr;
  if (!isAiConfigured()) return error('还没有配置 DEEPSEEK_API_KEY 环境变量', 503);

  const body = await readBody(request);
  if (!body) return error('请求格式无效');
  const parsed = aiPostMetaSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues.map(e => e.message).join('; '));

  try {
    const existingTags = (await getAllTags()).map((tag) => tag.name);
    const raw = await completeChat({
      feature: 'admin-post-meta',
      messages: buildPostMetaMessages(parsed.data.title, parsed.data.content, existingTags),
      maxTokens: 400,
      json: true,
    });
    const meta = parsePostMeta(raw);
    if (!meta) return error('AI 返回的内容格式不对，请再试一次', 502);
    return success(meta);
  } catch (err) {
    console.error('Post meta generation failed', err);
    return error('AI 生成失败，请稍后再试', 502);
  }
}
