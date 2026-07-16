"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArticleComment, CommentPage, CommentReplyPage, CommentSession } from './types';

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.message || '请求失败，请稍后再试');
  return payload.data as T;
}

function updateCommentTree(comments: ArticleComment[], id: string, update: (comment: ArticleComment) => ArticleComment): ArticleComment[] {
  let changed = false;
  const next = comments.map((comment) => {
    if (comment.id === id) { changed = true; return update(comment); }
    const replies = updateCommentTree(comment.replies, id, update);
    if (replies !== comment.replies) { changed = true; return { ...comment, replies }; }
    return comment;
  });
  return changed ? next : comments;
}

function findComment(comments: ArticleComment[], id: string): ArticleComment | null {
  for (const comment of comments) {
    if (comment.id === id) return comment;
    const nested = findComment(comment.replies, id);
    if (nested) return nested;
  }
  return null;
}

function mergeCommentsByOrder(current: ArticleComment[], incoming: ArticleComment[]) {
  return Array.from(new Map([...current, ...incoming].map((comment) => [comment.id, comment])).values())
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
}

export function useCommentData(postId: string) {
  const [session, setSession] = useState<CommentSession | null>(null);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingLikes = useRef(new Set<string>());
  const pendingEdits = useRef(new Set<string>());
  const pendingReplies = useRef(new Set<string>());

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [sessionData, page] = await Promise.all([
        fetch('/api/auth/session', { signal, cache: 'no-store' }).then((response) => readJson<CommentSession | null>(response)),
        fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, { signal, cache: 'no-store' }).then((response) => readJson<CommentPage>(response)),
      ]);
      setSession(sessionData);
      setComments(page.comments);
      setTotal(page.total);
      setNextCursor(page.nextCursor);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
      setError(requestError instanceof Error ? requestError.message : '评论加载失败');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const refreshSession = useCallback(async () => {
    const next = await fetch('/api/auth/session', { cache: 'no-store' }).then((response) => readJson<CommentSession | null>(response));
    setSession(next);
    return next;
  }, []);

  const submitComment = useCallback(async (content: string, parentId?: string | null) => {
    if (!session) throw new Error('请先登录');
    const created = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parentId: parentId || null }),
    }).then((response) => readJson<{ id: string; parentId: string | null; createdAt: string }>(response));
    const nextComment: ArticleComment = {
      id: created.id,
      parentId: created.parentId,
      content,
      createdAt: created.createdAt,
      editedAt: null,
      likeCount: 0,
      likedByViewer: false,
      replyCount: 0,
      repliesLoaded: true,
      replyNextCursor: null,
      author: { id: session.id, username: session.username, avatarUrl: session.avatarUrl, isAuthor: session.isAuthor },
      replies: [],
    };
    setTotal((current) => current + 1);
    if (!created.parentId) {
      setComments((current) => [...current, nextComment]);
      return;
    }
    setComments((current) => updateCommentTree(current, created.parentId!, (comment) => ({
      ...comment,
      replyCount: comment.replyCount + 1,
      replies: mergeCommentsByOrder(comment.replies, [nextComment]),
    })));
  }, [postId, session]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments?cursor=${encodeURIComponent(nextCursor)}`, { cache: 'no-store' })
        .then((response) => readJson<CommentPage>(response));
      setComments((current) => mergeCommentsByOrder(current, page.comments));
      setTotal(page.total);
      setNextCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, postId]);

  const loadReplies = useCallback(async (parentId: string, append = false) => {
    if (pendingReplies.current.has(parentId)) return;
    const parent = findComment(comments, parentId);
    const cursor = append ? parent?.replyNextCursor : null;
    if (append && !cursor) return;
    pendingReplies.current.add(parentId);
    try {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
      const page = await fetch(`/api/comments/${encodeURIComponent(parentId)}/replies${query}`, { cache: 'no-store' })
        .then((response) => readJson<CommentReplyPage>(response));
      setComments((current) => updateCommentTree(current, parentId, (comment) => ({
        ...comment,
        replies: mergeCommentsByOrder(comment.replies, page.comments),
        repliesLoaded: true,
        replyNextCursor: page.nextCursor,
      })));
    } finally {
      pendingReplies.current.delete(parentId);
    }
  }, [comments]);

  const toggleLike = useCallback(async (id: string) => {
    if (!session || session.isAuthor) throw new Error('请使用普通用户账号点赞');
    if (pendingLikes.current.has(id)) return;
    const previous = findComment(comments, id);
    if (!previous) return;
    const snapshot = { likedByViewer: previous.likedByViewer, likeCount: previous.likeCount };
    pendingLikes.current.add(id);
    setComments((current) => updateCommentTree(current, id, (comment) => ({
      ...comment,
      likedByViewer: !comment.likedByViewer,
      likeCount: Math.max(0, comment.likeCount + (comment.likedByViewer ? -1 : 1)),
    })));
    try {
      const result = await fetch(`/api/comments/${encodeURIComponent(id)}/like`, { method: 'POST' })
        .then((response) => readJson<{ liked: boolean }>(response));
      setComments((current) => updateCommentTree(current, id, (comment) => ({
        ...comment,
        likedByViewer: result.liked,
        likeCount: result.liked === comment.likedByViewer ? comment.likeCount : Math.max(0, comment.likeCount + (result.liked ? 1 : -1)),
      })));
    } catch (requestError) {
      setComments((current) => updateCommentTree(current, id, (comment) => ({ ...comment, ...snapshot })));
      throw requestError;
    } finally {
      pendingLikes.current.delete(id);
    }
  }, [comments, session]);

  const editComment = useCallback(async (id: string, content: string) => {
    if (pendingEdits.current.has(id)) return;
    const previous = findComment(comments, id);
    if (!previous) return;
    const snapshot = { content: previous.content, editedAt: previous.editedAt };
    pendingEdits.current.add(id);
    const editedAt = new Date().toISOString();
    setComments((current) => updateCommentTree(current, id, (comment) => ({ ...comment, content, editedAt })));
    try {
      await fetch(`/api/comments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }).then((response) => readJson<null>(response));
    } catch (requestError) {
      setComments((current) => updateCommentTree(current, id, (comment) => ({ ...comment, ...snapshot })));
      throw requestError;
    } finally {
      pendingEdits.current.delete(id);
    }
  }, [comments]);

  return {
    session, comments, total, nextCursor, loading, loadingMore, error,
    refresh, refreshSession, submitComment, loadMore, loadReplies, toggleLike, editComment,
    setSession,
  };
}

export type CommentData = ReturnType<typeof useCommentData>;
