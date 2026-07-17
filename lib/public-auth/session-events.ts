export type PublicSessionSnapshot = {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  status: string;
  mustChangePassword: boolean;
  isAuthor: boolean;
};

export const PUBLIC_SESSION_CHANGED_EVENT = 'pblog:public-session-changed';

export function publishPublicSession(
  session: PublicSessionSnapshot | null,
  target: EventTarget = window,
) {
  target.dispatchEvent(new CustomEvent(PUBLIC_SESSION_CHANGED_EVENT, { detail: session }));
}

export function subscribePublicSession(
  listener: (session: PublicSessionSnapshot | null) => void,
  target: EventTarget = window,
) {
  const handleChange = (event: Event) => {
    listener((event as CustomEvent<PublicSessionSnapshot | null>).detail);
  };
  target.addEventListener(PUBLIC_SESSION_CHANGED_EVENT, handleChange);
  return () => target.removeEventListener(PUBLIC_SESSION_CHANGED_EVENT, handleChange);
}
