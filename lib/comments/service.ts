import { getAdminFromCookie } from '../admin/auth';
import { getPublicUserSession, requirePublicUser } from '../public-auth/auth';

export type CommentActor =
  | { kind: 'admin'; id: string; username: string }
  | { kind: 'user'; id: string; username: string };

export function resolveReplyParent(comment: { id: string; parent_id: string | null }) {
  return comment.parent_id || comment.id;
}

export async function resolveCommentActor(forWrite = false): Promise<{ actor: CommentActor | null; error: string | null }> {
  const admin = await getAdminFromCookie();
  if (admin) return { actor: { kind: 'admin', id: admin.sub, username: admin.username }, error: null };
  if (forWrite) {
    const result = await requirePublicUser({ forWrite: true });
    return result.user
      ? { actor: { kind: 'user', id: result.user.id, username: result.user.username }, error: null }
      : { actor: null, error: result.error };
  }
  const user = await getPublicUserSession();
  return user
    ? { actor: { kind: 'user', id: user.id, username: user.username }, error: null }
    : { actor: null, error: null };
}
