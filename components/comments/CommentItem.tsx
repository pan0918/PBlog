"use client";

import { useState } from 'react';
import { ChevronDown, Heart, MessageCircle, Pencil } from 'lucide-react';
import { DEFAULT_PUBLIC_AVATAR_URL } from '../../lib/public-auth/presentation';
import CommentComposer from './CommentComposer';
import type { ArticleComment, CommentSession } from './types';

function relativeTime(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(delta) || delta < 60_000) return '刚刚';
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}分钟前`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}小时前`;
  if (delta < 604_800_000) return `${Math.floor(delta / 86_400_000)}天前`;
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function Avatar({ comment }: { comment: ArticleComment }) {
  return <img src={comment.author.avatarUrl || DEFAULT_PUBLIC_AVATAR_URL} alt="" className="size-9 shrink-0 rounded-xl object-cover ring-1 ring-white/70 dark:ring-white/10" />;
}

export default function CommentItem({
  comment,
  session,
  isReply = false,
  onNeedAuth,
  onReply,
  onLoadReplies,
  onLike,
  onEdit,
}: {
  comment: ArticleComment;
  session: CommentSession | null;
  isReply?: boolean;
  onNeedAuth: () => void;
  onReply: (content: string, parentId: string) => Promise<void>;
  onLoadReplies: (parentId: string, append?: boolean) => Promise<void>;
  onLike: (id: string) => Promise<void>;
  onEdit: (id: string, content: string) => Promise<void>;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const ownsComment = Boolean(session && (session.isAuthor || (!comment.author.isAuthor && session.id === comment.author.id)));

  function requireSession(action: () => void) {
    if (!session) return onNeedAuth();
    if (session.mustChangePassword) {
      setActionError('请先在个人资料中修改临时密码');
      return;
    }
    action();
  }

  return (
    <article className={isReply ? 'rounded-2xl bg-slate-100/65 p-3 dark:bg-slate-900/45' : 'py-4'}>
      <div className="flex gap-3">
        <Avatar comment={comment} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{comment.author.username}</span>
            {comment.author.isAuthor && <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">作者</span>}
            <time className="text-[11px] text-slate-400" dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time>
          </div>

          {editing ? (
            <CommentComposer
              compact
              autoFocus
              initialValue={comment.content}
              placeholder="修改评论内容"
              onCancel={() => setEditing(false)}
              onSubmit={async (content) => { await onEdit(comment.id, content); setEditing(false); }}
            />
          ) : (
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300">
              {comment.content}
              {comment.editedAt && <span className="ml-1 text-[10px] text-slate-400">已编辑</span>}
            </p>
          )}

          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => requireSession(() => void onLike(comment.id).catch((error) => setActionError(error.message)))}
              className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold focus-visible:outline-2 focus-visible:outline-indigo-500 ${comment.likedByViewer ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'}`}
              aria-label={comment.likedByViewer ? '取消点赞' : '点赞'}
            >
              <Heart size={14} fill={comment.likedByViewer ? 'currentColor' : 'none'} />
              {comment.likeCount || ''}
            </button>
            <button type="button" onClick={() => requireSession(() => setReplying((value) => !value))} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-white/10">
              <MessageCircle size={14} /> 回复
            </button>
            {ownsComment && !editing && (
              <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-white/10">
                <Pencil size={13} /> 编辑
              </button>
            )}
          </div>
          {actionError && <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{actionError}</p>}
          {replying && (
            <CommentComposer
              compact
              autoFocus
              placeholder={`回复 ${comment.author.username}`}
              onCancel={() => setReplying(false)}
              onSubmit={async (content) => {
                const topLevelId = comment.parentId || comment.id;
                await onReply(content, topLevelId);
                if (!isReply && !comment.repliesLoaded) await onLoadReplies(topLevelId);
                setReplying(false);
                setShowReplies(true);
              }}
            />
          )}
        </div>
      </div>

      {!isReply && comment.replyCount > 0 && (
        <div className="ml-12 mt-2">
          <button
            type="button"
            onClick={() => {
              if (showReplies) return setShowReplies(false);
              setShowReplies(true);
              if (!comment.repliesLoaded) {
                setLoadingReplies(true);
                void onLoadReplies(comment.id).catch((error) => setActionError(error.message)).finally(() => setLoadingReplies(false));
              }
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
            aria-expanded={showReplies}
          >
            <ChevronDown size={14} className={`transition-transform ${showReplies ? 'rotate-180' : ''}`} />
            {loadingReplies ? '加载回复中' : showReplies ? '收起回复' : `展开 ${comment.replyCount} 条回复`}
          </button>
          <span className="sr-only">回复按时间正序</span>
          {showReplies && (
            <div className="mt-2 space-y-2 border-l border-slate-200 pl-3 dark:border-white/10">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} session={session} isReply onNeedAuth={onNeedAuth} onReply={onReply} onLoadReplies={onLoadReplies} onLike={onLike} onEdit={onEdit} />
              ))}
              {comment.replyNextCursor && (
                <button type="button" disabled={loadingReplies} onClick={() => { setLoadingReplies(true); void onLoadReplies(comment.id, true).catch((error) => setActionError(error.message)).finally(() => setLoadingReplies(false)); }} className="rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                  {loadingReplies ? '加载中' : '加载更多回复'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
