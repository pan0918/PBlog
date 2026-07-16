"use client";

import { useState } from 'react';
import { ChevronUp, MessageSquare, UserRound, X } from 'lucide-react';
import AuthDialog from './AuthDialog';
import CommentComposer from './CommentComposer';
import CommentList from './CommentList';
import ProfileDialog from './ProfileDialog';
import type { CommentData } from './useCommentData';

export default function CommentSurface({ variant, postTitle, data, onClose }: { variant: 'sidebar' | 'fullscreen'; postTitle: string; data: CommentData; onClose?: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const fullscreen = variant === 'fullscreen';

  return (
    <section className={`flex flex-col overflow-hidden border border-white/60 bg-white/72 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/72 ${fullscreen ? 'h-[100dvh] rounded-none' : 'max-h-[calc(100dvh-7rem)] rounded-3xl'}`} aria-label={`${postTitle}的评论`}>
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/70 px-4 py-3.5 dark:border-white/10">
        <span className="grid size-9 place-items-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"><MessageSquare size={18} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">评论 <span className="font-medium text-slate-400">({data.total})</span></h2>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">按时间正序，与文章一起慢慢读</p>
        </div>
        {!fullscreen && (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-white/10" aria-expanded={expanded} aria-label={expanded ? '收起评论' : '展开评论'}>
            <ChevronUp size={17} className={`transition-transform ${expanded ? '' : 'rotate-180'}`} />
          </button>
        )}
        {fullscreen && <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-white/10" aria-label="关闭评论"><X size={20} /></button>}
      </header>

      {expanded && (
        <>
          <div className="shrink-0 p-4 pb-2">
            {data.session ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {data.session.avatarUrl ? <img src={data.session.avatarUrl} alt="" className="size-8 rounded-xl object-cover" /> : <span className="grid size-8 place-items-center rounded-xl bg-slate-200 text-[11px] font-black text-slate-700 dark:bg-slate-700 dark:text-white">{Array.from(data.session.username).slice(0, 2).join('').toUpperCase()}</span>}
                    <p className="truncate text-xs font-bold text-slate-600 dark:text-slate-300">以 {data.session.username} 的身份</p>
                    {data.session.isAuthor && <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">作者</span>}
                  </div>
                  {!data.session.isAuthor && <button type="button" onClick={() => setProfileOpen(true)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-white/10"><UserRound size={14} />资料</button>}
                </div>
                {data.session.mustChangePassword ? (
                  <button type="button" onClick={() => setProfileOpen(true)} className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-xs font-bold leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">请先修改临时密码，再发布评论</button>
                ) : (
                  <CommentComposer onSubmit={(content) => data.submitComment(content)} />
                )}
              </>
            ) : (
              <button type="button" onClick={() => setAuthOpen(true)} className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-left hover:border-indigo-300 hover:bg-indigo-50/60 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-white/15 dark:bg-white/5 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-500/10">
                <span className="block text-sm font-black text-slate-800 dark:text-slate-100">登录后参与讨论</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">可以评论、回复和点赞，所有评论会立即显示。</span>
              </button>
            )}
          </div>
          <div className={`comment-scroll min-h-0 flex-1 overflow-y-auto px-4 ${fullscreen ? 'pb-[calc(env(safe-area-inset-bottom)+1.5rem)]' : 'pb-4'}`}>
            <CommentList data={data} onNeedAuth={() => setAuthOpen(true)} />
          </div>
        </>
      )}

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={(session) => { data.setSession(session); setAuthOpen(false); void data.refresh(); }} />
      {data.session && !data.session.isAuthor && <ProfileDialog open={profileOpen} session={data.session} onClose={() => setProfileOpen(false)} onSessionChange={(session) => { data.setSession(session); void data.refresh(); }} />}
    </section>
  );
}
