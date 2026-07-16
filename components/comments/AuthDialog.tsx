"use client";

import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import type { CommentSession } from './types';

async function submitAuth(path: string, data: Record<string, string>) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) throw new Error(payload.message || '请求失败');
  return payload.data as CommentSession;
}

export default function AuthDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: (session: CommentSession) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries()) as Record<string, string>;
    try {
      const session = await submitAuth(mode === 'login' ? '/api/auth/login' : '/api/auth/register', values);
      onSuccess({ ...session, isAuthor: false });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '请求失败');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white';
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-[#fffaf4] p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="auth-title" className="text-xl font-black text-slate-900 dark:text-white">{mode === 'login' ? '登录后参与讨论' : '创建读者账号'}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">账号仅用于本站评论与个人资料</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-white/10" aria-label="关闭"><X size={18} /></button>
        </div>
        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['login', 'register'] as const).map((value) => (
            <button key={value} type="button" onClick={() => { setMode(value); setError(null); }} className={`rounded-lg py-2 text-sm font-bold ${mode === value ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
              {value === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div>
            <label htmlFor="auth-username" className="text-sm font-bold text-slate-700 dark:text-slate-200">用户名</label>
            <input id="auth-username" name="username" autoComplete="username" required minLength={2} maxLength={20} className={fieldClass} />
          </div>
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-email" className="text-sm font-bold text-slate-700 dark:text-slate-200">邮箱</label>
              <input id="auth-email" name="email" type="email" autoComplete="email" required className={fieldClass} />
              <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">邮箱不会公开，仅作为联系管理员找回账号时的核对依据。</p>
            </div>
          )}
          <div>
            <label htmlFor="auth-password" className="text-sm font-bold text-slate-700 dark:text-slate-200">密码</label>
            <input id="auth-password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} maxLength={72} className={fieldClass} />
          </div>
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-confirm-password" className="text-sm font-bold text-slate-700 dark:text-slate-200">确认密码</label>
              <input id="auth-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={fieldClass} />
            </div>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
          {mode === 'login' && <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">忘记密码？请联系管理员，并提供注册邮箱作为账号核对依据。</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            {submitting ? '请稍候' : mode === 'login' ? '登录' : '注册并登录'}
          </button>
        </form>
      </div>
    </div>
  );
}

