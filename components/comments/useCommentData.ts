"use client";

import { useCallback, useEffect, useState } from 'react';
import type { ArticleComment, CommentPage, CommentSession } from './types';

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.message || '请求失败，请稍后再试');
  return payload.data as T;
}

function updateCommentTree(comments: ArticleComment[], id: string, update: (comment: ArticleComment) => ArticleComment): ArticleComment[] {
  return comments.map((comment) => {
    if (comment.id === id) return update(comment);
    const replies = updateCommentTree(comment.replies, id, update);
    return replies === comment.replies ? comment : { ...comment, replies };
  });
}

export function useCommentData(postId: string) {
  const [session, setSession] = useState<CommentSession | null>(null);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parentId: parentId || null }),
    }).then((response) => readJson<{ id: string }>(response));
    await refresh();
  }, [postId, refresh]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments?cursor=${encodeURIComponent(nextCursor)}`, { cache: 'no-store' })
        .then((response) => readJson<CommentPage>(response));
      setComments((current) => [...current, ...page.comments]);
      setTotal(page.total);
      setNextCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, postId]);

  const toggleLike = useCallback(async (id: string) => {
    if (!session || session.isAuthor) throw new Error('请使用普通用户账号点赞');
    const previousComments = comments;
    setComments((current) => updateCommentTree(current, id, (comment) => ({
      ...comment,
      likedByViewer: !comment.likedByViewer,
      likeCount: Math.max(0, comment.likeCount + (comment.likedByViewer ? -1 : 1)),
    })));
    try {
      const result = await fetch(`/api/comments/${encodeURIComponent(id)}/like`, { method: 'POST' })
        .then((response) => readJson<{ liked: boolean }>(response));
      setComments((current) => updateCommentTree(current, id, (comment) => ({ ...comment, likedByViewer: result.liked })));
    } catch (requestError) {
      setComments(previousComments);
      throw requestError;
    }
  }, [comments, session]);

  const editComment = useCallback(async (id: string, content: string) => {
    const previousComments = comments;
    const editedAt = new Date().toISOString();
    setComments((current) => updateCommentTree(current, id, (comment) => ({ ...comment, content, editedAt })));
    try {
      await fetch(`/api/comments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }).then((response) => readJson<null>(response));
    } catch (requestError) {
      setComments(previousComments);
      throw requestError;
    }
  }, [comments]);

  return {
    session, comments, total, nextCursor, loading, loadingMore, error,
    refresh, refreshSession, submitComment, loadMore, toggleLike, editComment,
    setSession,
  };
}

export type CommentData = ReturnType<typeof useCommentData>;
