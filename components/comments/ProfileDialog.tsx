"use client";

import { FormEvent, useRef, useState } from 'react';
import { Camera, LogOut, Trash2, X } from 'lucide-react';
import type { CommentSession } from './types';

async function request<T>(path: string, init: RequestInit) {
  const response = await fetch(path, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) throw new Error(payload.message || '操作失败');
  return payload.data as T;
}

export default function ProfileDialog({ open, session, onClose, onSessionChange }: { open: boolean; session: CommentSession; onClose: () => void; onSessionChange: (session: CommentSession | null) => void }) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-white';

  async function run(operation: () => Promise<void>) {
    setBusy(true); setError(null); setMessage(null);
    try { await operation(); } catch (operationError) { setError(operationError instanceof Error ? operationError.message : '操作失败'); } finally { setBusy(false); }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = String(new FormData(event.currentTarget).get('username') || '');
    await run(async () => {
      const next = await request<CommentSession>('/api/auth/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
      onSessionChange({ ...next, isAuthor: false }); setMessage('用户名已更新');
    });
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    await run(async () => {
      const next = await request<CommentSession>('/api/auth/password', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      onSessionChange({ ...next, isAuthor: false }); setMessage('密码已更新'); event.currentTarget.reset();
    });
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get('password') || '');
    if (!window.confirm('确定注销账号吗？你的全部评论会一并移除，此操作无法撤销。')) return;
    await run(async () => {
      await request<null>('/api/auth/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      onSessionChange(null); onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className="mx-auto my-4 w-full max-w-lg rounded-3xl border border-white/60 bg-[#fffaf4] p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 id="profile-title" className="text-xl font-black text-slate-900 dark:text-white">个人资料</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-white/10" aria-label="关闭"><X size={18} /></button>
        </div>
        {session.mustChangePassword && <p className="mt-4 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">当前使用临时密码，请先修改密码后再参与讨论。</p>}
        <div className="mt-5 flex items-center gap-4">
          {session.avatarUrl ? <img src={session.avatarUrl} alt="当前头像" className="size-16 rounded-2xl object-cover" /> : <span className="grid size-16 place-items-center rounded-2xl bg-slate-200 text-lg font-black dark:bg-slate-700 dark:text-white">{Array.from(session.username).slice(0, 2).join('').toUpperCase()}</span>}
          <div>
            <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => {
              const file = event.target.files?.[0]; if (!file) return;
              void run(async () => {
                const form = new FormData(); form.append('avatar', file);
                const next = await request<CommentSession>('/api/auth/avatar', { method: 'POST', body: form });
                onSessionChange({ ...next, isAuthor: false }); setMessage('头像已更新');
              });
            }} />
            <button type="button" onClick={() => avatarRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-indigo-300 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"><Camera size={16} />上传头像</button>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">JPG、PNG 或 WebP，最大 2MB</p>
          </div>
        </div>
        <form className="mt-6" onSubmit={updateProfile}>
          <label htmlFor="profile-username" className="text-sm font-bold text-slate-700 dark:text-slate-200">用户名</label>
          <div className="flex gap-2"><input id="profile-username" name="username" defaultValue={session.username} required minLength={2} maxLength={20} className={fieldClass} /><button type="submit" disabled={busy} className="mt-1.5 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900">保存</button></div>
        </form>
        <form className="mt-7 space-y-3 border-t border-slate-200 pt-6 dark:border-white/10" onSubmit={updatePassword}>
          <h3 className="font-black text-slate-900 dark:text-white">修改密码</h3>
          <div><label htmlFor="current-password" className="text-sm font-bold text-slate-700 dark:text-slate-200">当前密码</label><input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required className={fieldClass} /></div>
          <div><label htmlFor="new-password" className="text-sm font-bold text-slate-700 dark:text-slate-200">新密码</label><input id="new-password" name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={fieldClass} /></div>
          <button type="submit" disabled={busy} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">更新密码</button>
        </form>
        <div className="mt-7 flex flex-wrap gap-2 border-t border-slate-200 pt-6 dark:border-white/10">
          <button type="button" onClick={() => void run(async () => { await request<null>('/api/auth/logout', { method: 'POST' }); onSessionChange(null); onClose(); })} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 dark:border-white/10 dark:text-slate-300"><LogOut size={16} />退出登录</button>
        </div>
        <form className="mt-6 rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-500/20 dark:bg-red-500/5" onSubmit={deleteAccount}>
          <h3 className="font-black text-red-700 dark:text-red-300">注销账号</h3>
          <p className="mt-1 text-xs leading-5 text-red-600/80 dark:text-red-300/70">注销会移除你的全部评论。请输入密码确认。</p>
          <label htmlFor="delete-password" className="mt-3 block text-sm font-bold text-red-700 dark:text-red-300">当前密码</label>
          <input id="delete-password" name="password" type="password" required className={fieldClass} />
          <button type="submit" disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Trash2 size={16} />永久注销</button>
        </form>
        {message && <p className="mt-4 text-sm font-bold text-green-700 dark:text-green-400" role="status">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
      </div>
    </div>
  );
}

