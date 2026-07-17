"use client";

import Link from 'next/link';
import { LogOut, ShieldCheck, X } from 'lucide-react';
import useDialogFocusTrap from '../comments/useDialogFocusTrap';

export default function AuthorAccountDialog({ open, username, onClose, onLogout }: {
  open: boolean;
  username: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  const dialogRef = useDialogFocusTrap(open, onClose);
  if (!open) return null;

  const logout = async () => {
    const response = await fetch('/api/admin/logout', { method: 'POST' });
    if (!response.ok) return;
    onLogout();
    onClose();
  };

  return (
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="author-account-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-[#fffaf4] p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="grid size-11 place-items-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"><ShieldCheck size={22} /></span>
            <h2 id="author-account-title" className="mt-4 text-xl font-black text-slate-900 dark:text-white">作者账号</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">当前以 {username} 的身份登录</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-white/10" aria-label="关闭"><X size={18} /></button>
        </div>
        <div className="mt-6 grid gap-3">
          <Link href="/admin" onClick={onClose} className="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-black text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">进入管理后台</Link>
          <button type="button" onClick={() => void logout()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"><LogOut size={17} />退出登录</button>
        </div>
      </div>
    </div>
  );
}
