import { NextRequest, NextResponse } from 'next/server';
import { getPublicUserById } from '../../../../lib/db/public-users';
import { requirePublicUser, toPublicProfile } from '../../../../lib/public-auth/auth';
import { updateAvatarForUser } from '../../../../lib/public-auth/avatar';
import { consumePublicRateLimit, createPublicRateKey } from '../../../../lib/public-auth/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { user, error } = await requirePublicUser({ forWrite: true });
  if (!user) return NextResponse.json({ ok: false, message: error }, { status: 401 });
  const key = await createPublicRateKey('avatar', user.id, '');
  const rate = await consumePublicRateLimit('avatar', key, [{ limit: 5, windowMs: 60 * 60 * 1000 }]);
  if (!rate.allowed) return NextResponse.json({ ok: false, message: '头像上传太频繁，请稍后再试' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ ok: false, message: '上传请求格式无效' }, { status: 400 }); }
  const file = formData.get('avatar');
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: '请选择头像文件' }, { status: 400 });
  try {
    await updateAvatarForUser(user.id, file);
    const updated = await getPublicUserById(user.id);
    return NextResponse.json({ ok: true, data: updated ? toPublicProfile(updated, true) : null });
  } catch (uploadError) {
    return NextResponse.json({ ok: false, message: uploadError instanceof Error ? uploadError.message : '头像上传失败' }, { status: 400 });
  }
}
