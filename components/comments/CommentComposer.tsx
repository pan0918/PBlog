"use client";

import { useId, useRef, useState } from 'react';
import { Send, Smile } from 'lucide-react';

const EMOJIS = ['🙂', '😂', '🥰', '🤔', '👍', '🎉', '❤️', '✨'];

export default function CommentComposer({
  placeholder = '写下你的留言...',
  compact = false,
  autoFocus = false,
  initialValue = '',
  onSubmit,
  onCancel,
}: {
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const count = Array.from(content).length;

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed || count > 500 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setContent('');
      setShowEmoji(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '发送失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`relative rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-950/35 ${compact ? 'mt-3' : ''}`}>
      <label className="sr-only" htmlFor={inputId}>{placeholder}</label>
      <textarea
        ref={inputRef}
        id={inputId}
        autoFocus={autoFocus}
        value={content}
        maxLength={500}
        rows={compact ? 2 : 3}
        placeholder={placeholder}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void submit();
        }}
        className="w-full resize-none bg-transparent text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
      {showEmoji && (
        <div className="mb-2 flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-2 dark:bg-slate-800/80" aria-label="选择表情">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="grid size-8 place-items-center rounded-lg hover:bg-white focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-slate-700"
              onClick={() => { setContent((value) => `${value}${emoji}`); inputRef.current?.focus(); }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mb-2 text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmoji((value) => !value)}
          className="grid size-8 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-white/10 dark:hover:text-indigo-300"
          aria-label="添加表情"
          aria-expanded={showEmoji}
        >
          <Smile size={17} />
        </button>
        <span className={`mr-auto text-[11px] ${count > 480 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{count}/500</span>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10">取消</button>
        )}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!content.trim() || count > 500 || submitting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-[transform,opacity,background-color] hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <Send size={14} />
          {submitting ? '发送中' : '发送'}
        </button>
      </div>
    </div>
  );
}
