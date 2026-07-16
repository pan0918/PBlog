import { db } from '../db';
import type { CommentActor } from '../comments/service';

type RawComment = Record<string, unknown>;

export type PublicComment = {
  id: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  editedAt: string | null;
  likeCount: number;
  likedByViewer: boolean;
  replyCount: number;
  author: { id: string; username: string; avatarUrl: string | null; isAuthor: boolean };
  replies: PublicComment[];
};

function mapComment(row: RawComment, likedIds: Set<string>, likeCounts = new Map<string, number>(), replyCounts = new Map<string, number>()): PublicComment {
  const isAuthor = Boolean(row.admin_user_id);
  const id = String(row.id);
  return {
    id,
    parentId: row.parent_id ? String(row.parent_id) : null,
    content: String(row.content),
    createdAt: String(row.created_at),
    editedAt: row.edited_at ? String(row.edited_at) : null,
    likeCount: likeCounts.get(id) || 0,
    likedByViewer: likedIds.has(id),
    replyCount: replyCounts.get(id) || 0,
    author: {
      id: String(row.public_user_id || row.admin_user_id),
      username: String(row.user_username || row.admin_username || '已注销用户'),
      avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
      isAuthor,
    },
    replies: [],
  };
}

function decodeCursor(cursor?: string | null) {
  if (!cursor) return null;
  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    return createdAt && id ? { createdAt, id } : null;
  } catch { return null; }
}

function encodeCursor(createdAt: string, id: string) {
  return Buffer.from(`${createdAt}|${id}`).toString('base64url');
}

async function getViewerLikes(commentIds: string[], viewerId?: string | null) {
  if (!viewerId || commentIds.length === 0) return new Set<string>();
  const placeholders = commentIds.map(() => '?').join(',');
  const result = await db.execute({
    sql: `SELECT comment_id FROM comment_likes WHERE public_user_id = ? AND comment_id IN (${placeholders})`,
    args: [viewerId, ...commentIds],
  });
  return new Set(result.rows.map((row) => String(row.comment_id)));
}

async function getLikeCounts(commentIds: string[]) {
  if (commentIds.length === 0) return new Map<string, number>();
  const placeholders = commentIds.map(() => '?').join(',');
  const result = await db.execute({
    sql: `SELECT comment_id, COUNT(*) AS count FROM comment_likes WHERE comment_id IN (${placeholders}) GROUP BY comment_id`,
    args: commentIds,
  });
  return new Map(result.rows.map((row) => [String(row.comment_id), Number(row.count || 0)]));
}

async function getReplyCounts(commentIds: string[]) {
  if (commentIds.length === 0) return new Map<string, number>();
  const placeholders = commentIds.map(() => '?').join(',');
  const result = await db.execute({
    sql: `SELECT parent_id, COUNT(*) AS count FROM post_comments
          WHERE parent_id IN (${placeholders}) AND status = 'visible' AND deleted_at IS NULL GROUP BY parent_id`,
    args: commentIds,
  });
  return new Map(result.rows.map((row) => [String(row.parent_id), Number(row.count || 0)]));
}

const SELECT_FIELDS = `c.*, u.username AS user_username, u.avatar_url, a.username AS admin_username`;

export async function listComments(postId: string, cursor?: string | null, viewerId?: string | null) {
  const decoded = decodeCursor(cursor);
  const args: Array<string | number> = [postId];
  let cursorSql = '';
  if (decoded) {
    cursorSql = `AND (c.created_at > ? OR (c.created_at = ? AND c.id > ?))`;
    args.push(decoded.createdAt, decoded.createdAt, decoded.id);
  }
  args.push(21);
  const topResult = await db.execute({
    sql: `SELECT ${SELECT_FIELDS} FROM post_comments c
          LEFT JOIN public_users u ON u.id = c.public_user_id
          LEFT JOIN admin_users a ON a.id = c.admin_user_id
          WHERE c.post_id = ? AND c.parent_id IS NULL AND c.status = 'visible' AND c.deleted_at IS NULL
          ${cursorSql} ORDER BY c.created_at ASC, c.id ASC LIMIT ?`,
    args,
  });
  const hasMore = topResult.rows.length > 20;
  const topRows = (hasMore ? topResult.rows.slice(0, 20) : topResult.rows) as RawComment[];
  const topIds = topRows.map((row) => String(row.id));
  const [likedIds, likeCounts, replyCounts] = await Promise.all([
    getViewerLikes(topIds, viewerId), getLikeCounts(topIds), getReplyCounts(topIds),
  ]);
  const comments = topRows.map((row) => mapComment(row, likedIds, likeCounts, replyCounts));
  const totalResult = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM post_comments c
          LEFT JOIN post_comments parent ON parent.id = c.parent_id
          WHERE c.post_id = ? AND c.status = 'visible' AND c.deleted_at IS NULL
          AND (c.parent_id IS NULL OR (parent.status = 'visible' AND parent.deleted_at IS NULL))`,
    args: [postId],
  });
  const last = comments.at(-1);
  return {
    comments,
    total: Number(totalResult.rows[0]?.count || 0),
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

export async function listCommentReplies(parentId: string, cursor?: string | null, viewerId?: string | null) {
  const parent = await db.execute({
    sql: `SELECT id FROM post_comments WHERE id = ? AND parent_id IS NULL AND status = 'visible' AND deleted_at IS NULL`,
    args: [parentId],
  });
  if (!parent.rows.length) throw new Error('评论不存在');
  const decoded = decodeCursor(cursor);
  const args: Array<string | number> = [parentId];
  let cursorSql = '';
  if (decoded) {
    cursorSql = `AND (c.created_at > ? OR (c.created_at = ? AND c.id > ?))`;
    args.push(decoded.createdAt, decoded.createdAt, decoded.id);
  }
  args.push(21);
  const result = await db.execute({
    sql: `SELECT ${SELECT_FIELDS} FROM post_comments c
          LEFT JOIN public_users u ON u.id = c.public_user_id
          LEFT JOIN admin_users a ON a.id = c.admin_user_id
          WHERE c.parent_id = ? AND c.status = 'visible' AND c.deleted_at IS NULL ${cursorSql}
          ORDER BY c.created_at ASC, c.id ASC LIMIT ?`,
    args,
  });
  const hasMore = result.rows.length > 20;
  const rows = (hasMore ? result.rows.slice(0, 20) : result.rows) as RawComment[];
  const ids = rows.map((row) => String(row.id));
  const [likedIds, likeCounts] = await Promise.all([getViewerLikes(ids, viewerId), getLikeCounts(ids)]);
  const comments = rows.map((row) => mapComment(row, likedIds, likeCounts));
  const last = comments.at(-1);
  return { comments, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null };
}

export async function createComment(input: { postId: string; parentId?: string | null; content: string; actor: CommentActor }) {
  const transaction = await db.transaction('write');
  try {
    if (input.actor.kind === 'user') {
      const user = await transaction.execute({
        sql: `SELECT id FROM public_users WHERE id = ? AND deleted_at IS NULL AND session_version = ?
              AND must_change_password = 0 AND (status = 'active' OR (status = 'muted' AND muted_until IS NOT NULL AND muted_until <= ?))`,
        args: [input.actor.id, input.actor.sessionVersion, new Date().toISOString()],
      });
      if (!user.rows.length) throw new Error('账号状态已变更，请重新登录');
    }
    const post = await transaction.execute({ sql: `SELECT id FROM posts WHERE id = ? AND status = 'published' AND deleted_at IS NULL`, args: [input.postId] });
    if (!post.rows.length) throw new Error('文章不存在');
    let parentId: string | null = null;
    if (input.parentId) {
      const parent = await transaction.execute({
        sql: `SELECT id, parent_id FROM post_comments WHERE id = ? AND post_id = ? AND status = 'visible' AND deleted_at IS NULL`,
        args: [input.parentId, input.postId],
      });
      if (!parent.rows.length) throw new Error('回复目标不存在');
      parentId = String(parent.rows[0].parent_id || parent.rows[0].id);
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await transaction.execute({
      sql: `INSERT INTO post_comments (id, post_id, parent_id, public_user_id, admin_user_id, content, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'visible', ?, ?)`,
      args: [id, input.postId, parentId, input.actor.kind === 'user' ? input.actor.id : null, input.actor.kind === 'admin' ? input.actor.id : null, input.content, now, now],
    });
    await transaction.commit();
    return id;
  } finally {
    transaction.close();
  }
}

export async function editComment(id: string, content: string, actor: CommentActor) {
  const transaction = await db.transaction('write');
  try {
    if (actor.kind === 'user') {
      const user = await transaction.execute({
        sql: `SELECT id FROM public_users WHERE id = ? AND deleted_at IS NULL AND session_version = ?
              AND must_change_password = 0 AND (status = 'active' OR (status = 'muted' AND muted_until IS NOT NULL AND muted_until <= ?))`,
        args: [actor.id, actor.sessionVersion, new Date().toISOString()],
      });
      if (!user.rows.length) throw new Error('账号状态已变更，请重新登录');
    }
    const result = await transaction.execute({ sql: `SELECT public_user_id, admin_user_id FROM post_comments WHERE id = ? AND status = 'visible' AND deleted_at IS NULL`, args: [id] });
    if (!result.rows.length) throw new Error('评论不存在');
    const row = result.rows[0];
    const owns = actor.kind === 'admin' || (actor.kind === 'user' && String(row.public_user_id) === actor.id);
    if (!owns) throw new Error('无权编辑此评论');
    const now = new Date().toISOString();
    await transaction.execute({ sql: `UPDATE post_comments SET content = ?, edited_at = ?, updated_at = ? WHERE id = ?`, args: [content, now, now, id] });
    await transaction.commit();
  } finally {
    transaction.close();
  }
}

export async function toggleCommentLike(commentId: string, user: { id: string; sessionVersion: number }) {
  const transaction = await db.transaction('write');
  try {
    const currentUser = await transaction.execute({
      sql: `SELECT id FROM public_users WHERE id = ? AND deleted_at IS NULL AND session_version = ?
            AND must_change_password = 0 AND (status = 'active' OR (status = 'muted' AND muted_until IS NOT NULL AND muted_until <= ?))`,
      args: [user.id, user.sessionVersion, new Date().toISOString()],
    });
    if (!currentUser.rows.length) throw new Error('账号状态已变更，请重新登录');
    const comment = await transaction.execute({
      sql: `SELECT c.id FROM post_comments c LEFT JOIN post_comments parent ON parent.id = c.parent_id
            WHERE c.id = ? AND c.status = 'visible' AND c.deleted_at IS NULL
            AND (c.parent_id IS NULL OR (parent.status = 'visible' AND parent.deleted_at IS NULL))`,
      args: [commentId],
    });
    if (!comment.rows.length) throw new Error('评论不存在');
    const existing = await transaction.execute({ sql: `SELECT comment_id FROM comment_likes WHERE comment_id = ? AND public_user_id = ?`, args: [commentId, user.id] });
    if (existing.rows.length) {
      await transaction.execute({ sql: `DELETE FROM comment_likes WHERE comment_id = ? AND public_user_id = ?`, args: [commentId, user.id] });
      await transaction.commit();
      return false;
    }
    await transaction.execute({
      sql: `INSERT INTO comment_likes (comment_id, public_user_id, created_at) VALUES (?, ?, ?)`,
      args: [commentId, user.id, new Date().toISOString()],
    });
    await transaction.commit();
    return true;
  } finally {
    transaction.close();
  }
}

export type AdminCommentStatus = 'visible' | 'hidden' | 'spam' | 'deleted';

export async function listAdminComments(input: { query?: string; status?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, Math.trunc(input.page || 1));
  const pageSize = Math.min(50, Math.max(1, Math.trunc(input.pageSize || 20)));
  const where: string[] = [];
  const args: Array<string | number> = [];
  const query = input.query?.trim();
  if (query) {
    const pattern = `%${query}%`;
    where.push(`(c.content LIKE ? OR u.username LIKE ? OR a.username LIKE ? OR p.title LIKE ?)`);
    args.push(pattern, pattern, pattern, pattern);
  }
  if (input.status && ['visible', 'hidden', 'spam', 'deleted'].includes(input.status)) {
    where.push('c.status = ?');
    args.push(input.status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countResult = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM post_comments c
          LEFT JOIN public_users u ON u.id = c.public_user_id
          LEFT JOIN admin_users a ON a.id = c.admin_user_id
          LEFT JOIN posts p ON p.id = c.post_id ${whereSql}`,
    args,
  });
  const offset = (page - 1) * pageSize;
  const result = await db.execute({
    sql: `SELECT c.id, c.post_id, c.parent_id, c.content, c.status, c.created_at, c.edited_at,
                 COALESCE(u.username, a.username, '已注销用户') AS author_name,
                 CASE WHEN c.admin_user_id IS NOT NULL THEN 1 ELSE 0 END AS is_author,
                 p.title AS post_title, p.slug AS post_slug
          FROM post_comments c
          LEFT JOIN public_users u ON u.id = c.public_user_id
          LEFT JOIN admin_users a ON a.id = c.admin_user_id
          LEFT JOIN posts p ON p.id = c.post_id
          ${whereSql} ORDER BY c.created_at DESC, c.id DESC LIMIT ? OFFSET ?`,
    args: [...args, pageSize, offset],
  });
  return { items: result.rows, total: Number(countResult.rows[0]?.count || 0), page, pageSize };
}

export async function updateAdminCommentStatus(id: string, status: AdminCommentStatus) {
  if (!['visible', 'hidden', 'spam', 'deleted'].includes(status)) throw new Error('评论状态无效');
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `UPDATE post_comments SET status = ?, deleted_at = CASE WHEN ? = 'deleted' THEN ? ELSE NULL END,
          updated_at = ? WHERE id = ?`,
    args: [status, status, now, now, id],
  });
  if (result.rowsAffected === 0) throw new Error('评论不存在');
}
