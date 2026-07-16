"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare } from 'lucide-react';
import CommentSurface from './comments/CommentSurface';
import { useCommentData } from './comments/useCommentData';

export default function Comments({ postId, postTitle }: { postId: string; postTitle: string }) {
  const data = useCommentData(postId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="sticky top-24 hidden lg:block">
        <CommentSurface variant="sidebar" postTitle={postTitle} data={data} />
      </div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white shadow-xl transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:max-lg:right-[20rem] md:max-lg:z-[60] lg:hidden dark:bg-indigo-500"
        aria-label={`打开评论，共 ${data.total} 条`}
      >
        <MessageSquare size={18} />
        评论 {data.total > 0 ? data.total : ''}
      </button>
      {mobileOpen && createPortal(
        <div ref={dialogRef} className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={`${postTitle}的评论面板`}>
          <CommentSurface variant="fullscreen" postTitle={postTitle} data={data} onClose={() => setMobileOpen(false)} />
        </div>,
        document.body,
      )}
    </>
  );
}
