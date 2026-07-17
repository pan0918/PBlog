"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_PUBLIC_AVATAR_URL, LOGIN_PUBLIC_AVATAR_URL } from '../../lib/public-auth/presentation';
import { publishPublicSession, subscribePublicAccountRequest, subscribePublicSession } from '../../lib/public-auth/session-events';
import AuthorAccountDialog from './AuthorAccountDialog';
import AuthDialog from '../comments/AuthDialog';
import ProfileDialog from '../comments/ProfileDialog';
import type { CommentSession } from '../comments/types';

async function readSession(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) throw new Error(payload.message || '登录状态加载失败');
  return payload.data as CommentSession | null;
}

export default function DesktopAccountControl() {
  const [session, setSession] = useState<CommentSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authorAccountOpen, setAuthorAccountOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const controller = new AbortController();
    let receivedExternalSession = false;
    const unsubscribe = subscribePublicSession((nextSession) => {
      receivedExternalSession = true;
      setSession(nextSession);
      setSessionLoaded(true);
    });
    void fetch('/api/auth/session', { cache: 'no-store', signal: controller.signal })
      .then(readSession)
      .then((nextSession) => { if (!receivedExternalSession) setSession(nextSession); })
      .catch((error) => {
        if (!receivedExternalSession && !(error instanceof DOMException && error.name === 'AbortError')) setSession(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSessionLoaded(true);
      });
    return () => { controller.abort(); unsubscribe(); };
  }, []);

  const updateSession = (nextSession: CommentSession | null) => {
    setSession(nextSession);
    publishPublicSession(nextSession);
  };

  useEffect(() => subscribePublicAccountRequest(() => {
    if (session?.isAuthor) setAuthorAccountOpen(true);
    else if (session) setProfileOpen(true);
    else setAuthOpen(true);
  }), [session]);

  const accountLabel = !sessionLoaded
    ? '正在检查登录状态'
    : !session
      ? '登录或注册'
      : session.isAuthor
        ? '作者账号已登录'
        : '打开个人资料';

  return (
    <>
      <button
        type="button"
        disabled={!sessionLoaded}
        onClick={() => session?.isAuthor ? setAuthorAccountOpen(true) : session ? setProfileOpen(true) : setAuthOpen(true)}
        className="group grid size-9 shrink-0 place-items-center rounded-full outline-none transition-transform duration-200 hover:scale-105 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf4] disabled:cursor-default disabled:opacity-75 dark:focus-visible:ring-offset-stone-950"
        aria-label={accountLabel}
        title={accountLabel}
      >
        <img
          src={session ? session.avatarUrl || DEFAULT_PUBLIC_AVATAR_URL : LOGIN_PUBLIC_AVATAR_URL}
          alt=""
          className="size-8 rounded-full object-cover ring-1 ring-stone-300/80 shadow-[0_3px_10px_rgba(120,83,45,0.16)] transition-shadow group-hover:shadow-[0_4px_14px_rgba(120,83,45,0.24)] dark:ring-white/15"
        />
      </button>

      {mounted && createPortal(
        <>
          <AuthDialog
            open={authOpen}
            onClose={() => setAuthOpen(false)}
            onSuccess={(nextSession) => { updateSession(nextSession); setAuthOpen(false); }}
          />
          {session && !session.isAuthor && (
            <ProfileDialog
              open={profileOpen}
              session={session}
              onClose={() => setProfileOpen(false)}
              onSessionChange={updateSession}
            />
          )}
          {session?.isAuthor && (
            <AuthorAccountDialog
              open={authorAccountOpen}
              username={session.username}
              onClose={() => setAuthorAccountOpen(false)}
              onLogout={() => updateSession(null)}
            />
          )}
        </>,
        document.body,
      )}
    </>
  );
}
