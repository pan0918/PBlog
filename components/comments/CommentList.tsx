"use client";

import { MessageCircle } from 'lucide-react';
import CommentItem from './CommentItem';
import type { CommentData } from './useCommentData';

export default function CommentList({ data, onNeedAuth }: { data: CommentData; onNeedAuth: () => void }) {
  if (data.loading) {
    return <div className="space-y-4 py-4" aria-label="评论加载中">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/5" />)}</div>;
  }
  if (data.error) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">{data.error}</p>
        <button type="button" onClick={() => void data.refresh()} className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900">重新加载</button>
      </div>
    );
  }
  if (data.comments.length === 0) {
    return (
      <div className="grid place-items-center py-12 text-center text-slate-400 dark:text-slate-500">
        <MessageCircle size={30} strokeWidth={1.5} />
        <p className="mt-3 text-sm font-bold">还没有评论</p>
        <p className="mt-1 text-xs">来留下第一条认真回应吧</p>
      </div>
    );
  }
  return (
    <div>
      <div className="divide-y divide-slate-200/70 dark:divide-white/10">
        {data.comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            session={data.session}
            onNeedAuth={onNeedAuth}
            onReply={(content, parentId) => data.submitComment(content, parentId)}
            onLike={data.toggleLike}
            onEdit={data.editComment}
          />
        ))}
      </div>
      {data.nextCursor && (
        <button type="button" onClick={() => void data.loadMore()} disabled={data.loadingMore} className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
          {data.loadingMore ? '加载中' : '加载更多评论'}
        </button>
      )}
    </div>
  );
}

