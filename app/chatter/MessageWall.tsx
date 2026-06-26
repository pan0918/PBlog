"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "pb_message_wall";
const MIGRATION_KEY = "pb_message_wall_migrated_v2";
const MAX_MESSAGE_LENGTH = 200;

interface WallMessage {
  id: string;
  content: string;
  author: string;
  colorIndex: number;
  createdAt: string;
}

const NOTE_COLORS = [
  { bg: "#f8edff", text: "#3c3154", pin: "#8f82ce", accent: "#d9ceff" },
  { bg: "#fff4dd", text: "#534533", pin: "#d6ad74", accent: "#f2d5a5" },
  { bg: "#e9f6ff", text: "#2d4f67", pin: "#72a9ce", accent: "#b5dcf2" },
  { bg: "#ffe9ed", text: "#5e3941", pin: "#dc7e8d", accent: "#f5bec8" },
  { bg: "#fff8ea", text: "#574a39", pin: "#e7b972", accent: "#f3d8ad" },
  { bg: "#edf8ee", text: "#31543b", pin: "#88b88b", accent: "#bee1c1" },
  { bg: "#ffe7e6", text: "#633f3b", pin: "#d98787", accent: "#f3bebe" },
  { bg: "#fff0cf", text: "#5a472f", pin: "#c79a4e", accent: "#efd28f" },
  { bg: "#eee9ff", text: "#3f3764", pin: "#9182d5", accent: "#ccc2fa" },
  { bg: "#e5f5ff", text: "#31536c", pin: "#79add1", accent: "#b7dff6" },
];

const SCATTER = [
  { rotate: -5, y: 4, tape: false },
  { rotate: 0, y: 13, tape: false },
  { rotate: -12, y: -6, tape: false },
  { rotate: 0, y: 16, tape: false },
  { rotate: 6, y: 8, tape: true },
  { rotate: -5, y: -3, tape: false },
  { rotate: -4, y: 10, tape: true },
  { rotate: 7, y: 0, tape: false },
  { rotate: -3, y: 13, tape: false },
  { rotate: 1, y: 2, tape: true },
];

const DECORATIONS = [
  <Flower key="flower" />,
  <Leaf key="leaf" />,
  <Cloud key="cloud" />,
  <Heart key="heart" />,
  <Sprout key="sprout" />,
  <Star key="star" />,
];

const DEFAULT_MESSAGES: WallMessage[] = [
  { id: "1", content: "功不唐捐", author: "匿名", colorIndex: 0, createdAt: "2026-06-09T03:10:48.125Z" },
  { id: "2", content: "凡是过往，皆为序章", author: "zet", colorIndex: 5, createdAt: "2026-05-22T13:42:23.359Z" },
  { id: "3", content: "Never say never", author: "Frud_", colorIndex: 3, createdAt: "2026-05-22T13:41:55.278Z" },
  { id: "4", content: "帮顶！", author: "ttdk", colorIndex: 2, createdAt: "2026-05-21T12:37:20.541Z" },
  { id: "5", content: "好久不见", author: "zzz", colorIndex: 6, createdAt: "2026-05-21T12:23:23.480Z" },
  { id: "6", content: "不错！", author: "wex", colorIndex: 3, createdAt: "2026-05-21T12:02:23.737Z" },
  { id: "7", content: "好耶！", author: "aura", colorIndex: 4, createdAt: "2026-05-21T11:53:50.622Z" },
  { id: "8", content: "测试一下", author: "cc", colorIndex: 0, createdAt: "2026-05-21T11:53:29.707Z" },
];

function loadMessages(): WallMessage[] {
  if (typeof window === "undefined") return DEFAULT_MESSAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MESSAGES;
    return parsed
      .filter((item) => item && typeof item.content === "string")
      .map((item, index) => ({
        id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
        content: item.content.slice(0, MAX_MESSAGE_LENGTH),
        author: typeof item.author === "string" ? item.author.slice(0, 20) : "匿名",
        colorIndex: Number.isInteger(item.colorIndex) ? item.colorIndex : index,
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
      }));
  } catch {
    return DEFAULT_MESSAGES;
  }
}

function saveMessages(msgs: WallMessage[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)); } catch {}
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Pin({ color }: { color: string }) {
  const gradientId = `pin-${color.replace("#", "")}`;
  return (
    <svg className="absolute -top-5 left-1/2 z-20 h-10 w-8 -translate-x-1/2 drop-shadow-[0_6px_5px_rgba(70,88,120,0.24)]" viewBox="0 0 32 40" fill="none" aria-hidden="true">
      <ellipse cx="16" cy="35" rx="6" ry="2.2" fill="rgba(70,70,70,0.18)" />
      <rect x="14.4" y="23" width="3.2" height="10" rx="1.6" fill="#9da9ae" opacity="0.55" />
      <circle cx="16" cy="13" r="10.5" fill={color} />
      <circle cx="16" cy="13" r="10.5" fill={`url(#${gradientId})`} />
      <ellipse cx="12" cy="8.5" rx="4.5" ry="3.1" fill="white" opacity="0.32" />
      <defs>
        <radialGradient id={gradientId} cx="0" cy="0" r="1" gradientTransform="translate(12 8) rotate(48) scale(19)">
          <stop stopColor="white" stopOpacity="0.22" />
          <stop offset="1" stopColor="#22314b" stopOpacity="0.3" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Tape({ color }: { color: string }) {
  return (
    <div
      className="absolute -top-4 left-1/2 z-20 h-8 w-20 -translate-x-1/2 rotate-[-4deg] opacity-75 shadow-sm"
      style={{
        background: `repeating-linear-gradient(90deg, ${color} 0 8px, rgba(255,255,255,0.34) 8px 10px)`,
        clipPath: "polygon(4% 0, 96% 6%, 100% 100%, 0 92%)",
      }}
      aria-hidden="true"
    />
  );
}

function StickyNote({ msg, index }: { msg: WallMessage; index: number }) {
  const color = NOTE_COLORS[msg.colorIndex % NOTE_COLORS.length];
  const scatter = SCATTER[index % SCATTER.length];
  const decoration = DECORATIONS[index % DECORATIONS.length];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.92, rotate: scatter.rotate - 2 }}
      animate={{ opacity: 1, y: scatter.y, scale: 1, rotate: scatter.rotate }}
      exit={{ opacity: 0, y: -16, scale: 0.86 }}
      transition={{ type: "spring", stiffness: 160, damping: 18, delay: Math.min(index * 0.035, 0.25) }}
      className="relative mx-auto h-[168px] w-[178px] sm:h-[178px] sm:w-[184px]"
    >
      {scatter.tape ? <Tape color={color.accent} /> : <Pin color={color.pin} />}
      <div
        className="relative flex h-full flex-col overflow-hidden px-7 pb-5 pt-8 ring-1 ring-white/65 dark:ring-white/35"
        style={{
          backgroundColor: color.bg,
          color: color.text,
          boxShadow: "0 18px 24px rgba(12, 20, 44, 0.24), 0 3px 6px rgba(61, 76, 108, 0.1), inset 0 1px 0 rgba(255,255,255,0.72)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.11]"
          style={{
            backgroundImage: "linear-gradient(rgba(94,111,145,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(94,111,145,0.14) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 bg-white/45 shadow-[-8px_-8px_18px_rgba(97,116,150,0.12)]" style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }} />
        <p
          className="relative z-10 min-h-[74px] whitespace-pre-wrap break-words text-[19px] leading-[1.8] tracking-[0.08em] line-clamp-3 sm:text-[20px]"
          style={{ fontFamily: "var(--font-handwriting), var(--font-serif-stack), serif" }}
        >
          {msg.content}
        </p>
        <div className="relative z-10 mt-auto h-px w-full bg-slate-500/10" />
        <div className="relative z-10 mt-3 space-y-1.5 text-[12px] leading-none text-slate-600/70" style={{ fontFamily: "var(--font-serif-stack), serif" }}>
          <div className="flex items-center gap-2">
            <CalendarIcon />
            <span>{fmtDate(msg.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon />
            <span>{fmtTime(msg.createdAt)}</span>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 opacity-55">{decoration}</div>
      </div>
    </motion.article>
  );
}

export default function MessageWall() {
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const visibleMessages = useMemo(() => messages.slice(0, 10), [messages]);

  useEffect(() => {
    setMessages(loadMessages());
    setIsLoaded(true);
  }, []);

  const submit = () => {
    const content = messageText.trim();
    if (!content || isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    const newMsg: WallMessage = {
      id: crypto.randomUUID(),
      content: content.slice(0, MAX_MESSAGE_LENGTH),
      author: authorName.trim().slice(0, 20) || "匿名",
      colorIndex: Math.floor(Math.random() * 10),
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setMessages((current) => {
        const updated = [newMsg, ...current];
        saveMessages(updated);
        return updated;
      });
      setMessageText("");
      setIsSubmitting(false);
    }, 300);
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-[#526b94]">
        <div className="h-10 w-10 rounded-full border-[3px] border-white/60 border-t-[#8aa3dd] shadow-[0_0_18px_rgba(255,255,255,0.65)] animate-spin" />
        <span className="text-sm font-bold tracking-[0.2em]">加载留言墙...</span>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-5 text-[#284467] dark:text-[#dbe8ff]">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.65] bg-[#eaf3ff]/[0.35] px-4 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_24px_60px_rgba(42,64,104,0.18)] backdrop-blur-2xl dark:border-[#dce8ff]/40 dark:bg-[#0c1630]/55 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_28px_70px_rgba(0,0,0,0.34),0_0_42px_rgba(120,150,220,0.16)] sm:px-8 md:px-11">
        <div className="pointer-events-none absolute inset-[7px] rounded-[1.65rem] border border-white/[0.45] dark:border-white/20" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.66),transparent_31%),radial-gradient(circle_at_86%_28%,rgba(196,222,255,0.32),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.36),rgba(209,225,247,0.18))] dark:hidden" />
        <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_18%_12%,rgba(176,196,255,0.18),transparent_34%),radial-gradient(circle_at_82%_32%,rgba(111,137,205,0.18),transparent_40%),linear-gradient(135deg,rgba(202,218,255,0.12),rgba(40,55,95,0.18))] dark:block" />
        <DoodleTrail />

        {visibleMessages.length === 0 ? (
          <div className="relative z-10 flex min-h-[330px] flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full border border-white/70 bg-white/[0.35] px-5 py-2 text-sm font-bold text-[#6b83ad] shadow-sm backdrop-blur-md dark:border-white/20 dark:bg-white/10 dark:text-[#dbe8ff]">这面墙还很安静</div>
            <p className="text-sm text-[#7b8fb2] dark:text-[#b5c7ef]">在下方写下第一张便签吧</p>
          </div>
        ) : (
          <div className="relative z-10 grid min-h-[390px] grid-cols-1 gap-x-7 gap-y-10 px-1 py-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {visibleMessages.map((msg, index) => (
                <StickyNote key={msg.id} msg={msg} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-[#eaf3ff]/[0.30] px-4 pb-5 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_18px_44px_rgba(42,64,104,0.14)] backdrop-blur-2xl dark:border-[#dce8ff]/35 dark:bg-[#0b142c]/60 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_22px_56px_rgba(0,0,0,0.32),0_0_34px_rgba(120,150,220,0.12)] sm:px-8 sm:pb-6">
        <div className="pointer-events-none absolute inset-[6px] rounded-[1.45rem] border border-white/[0.35] dark:border-white/15" />
        <div className="relative z-10 mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#7894cf]/70 bg-white/20 text-[#46689d] dark:border-[#91a9e7]/70 dark:bg-white/10 dark:text-[#aec0f5]">
            <PenIcon />
          </div>
          <h2 className="shrink-0 text-lg font-black tracking-[0.14em] text-[#29466b] dark:text-[#dce8ff]">写一张便签</h2>
          <div className="h-px flex-1 border-t border-dashed border-white/[0.55] dark:border-[#cbd8ff]/30" />
          <span className="text-lg text-[#f2d68b]">✦</span>
        </div>

        <div className="relative z-10 grid gap-3 lg:grid-cols-[280px_1fr]">
          <div className="relative">
            <label htmlFor="message-author" className="sr-only">你的名字</label>
            <UserIcon />
            <input
              id="message-author"
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              maxLength={20}
              placeholder="你的名字（可选）"
              className="h-[74px] w-full rounded-xl border border-white/70 bg-white/[0.42] pl-14 pr-4 text-[15px] text-[#344e73] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] placeholder:text-[#8ea2c3] focus:border-[#93aee5] focus:bg-white/[0.58] dark:border-[#dce8ff]/35 dark:bg-[#16213e]/70 dark:text-[#edf4ff] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:placeholder:text-[#8fa4d6] dark:focus:border-[#9db7ff] dark:focus:bg-[#1b2849]/80"
            />
          </div>

          <div className="relative">
            <label htmlFor="message-content" className="sr-only">留言内容</label>
            <PencilIcon />
            <textarea
              id="message-content"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={2}
              placeholder="写下你想说的话..."
              className="min-h-[74px] w-full resize-none rounded-xl border border-white/70 bg-white/[0.42] py-5 pl-14 pr-40 text-[15px] leading-relaxed text-[#344e73] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] placeholder:text-[#8ea2c3] focus:border-[#93aee5] focus:bg-white/[0.58] dark:border-[#dce8ff]/35 dark:bg-[#16213e]/70 dark:text-[#edf4ff] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:placeholder:text-[#8fa4d6] dark:focus:border-[#9db7ff] dark:focus:bg-[#1b2849]/80 max-sm:pr-14"
            />
            <button
              type="button"
              aria-label="插入表情"
              className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-full text-[#7892bf] transition hover:bg-white/45 hover:text-[#4f6fa8] dark:text-[#9fb3ea] dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => setMessageText((current) => `${current}☺`.slice(0, MAX_MESSAGE_LENGTH))}
            >
              <SmileIcon />
            </button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={!messageText.trim() || isSubmitting}
              onClick={submit}
              className="absolute bottom-3 right-14 flex h-11 items-center gap-2 rounded-xl bg-[#879bdd] px-6 text-[15px] font-black tracking-[0.14em] text-white shadow-[0_10px_20px_rgba(89,111,183,0.28)] transition hover:bg-[#748bd4] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-[#7793e8] dark:shadow-[0_10px_24px_rgba(89,122,229,0.28)] dark:hover:bg-[#88a2f3] max-sm:static max-sm:mt-3 max-sm:w-full max-sm:justify-center"
            >
              {isSubmitting ? <Spinner /> : <PinIcon />}
              {isSubmitting ? "钉上中" : "钉上便签"}
            </motion.button>
          </div>
        </div>

        <div className="relative z-10 mt-3 flex items-center justify-between gap-3 text-xs text-[#6d83ab] dark:text-[#aebff0]">
          <span>{messageText.length}/{MAX_MESSAGE_LENGTH}</span>
          {error ? <span className="text-[#ffb0bd]">{error}</span> : <span>感谢你的到来，愿你在这里遇见美好</span>}
        </div>
      </div>

      <p className="text-center text-xs tracking-[0.18em] text-white/80 drop-shadow-sm dark:text-[#dbe8ff]/75">
        ♡ 感谢你的到来，愿你在这里遇见美好 ♡
      </p>
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 3c-2.8 1.6-5.8 4-9 7L4 17l-2 5 5-2 7-7c3-3.2 5.4-6.2 7-9Z" />
      <path d="M13 6l5 5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7892bf] dark:text-[#9fb3ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="pointer-events-none absolute left-5 top-6 h-5 w-5 text-[#7892bf] dark:text-[#9fb3ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01M15 9h.01" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m14 4 6 6-4 1-5 5v4l-2 2-3-7 5-5 1-4Z" />
    </svg>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

function DoodleTrail() {
  return (
    <svg className="pointer-events-none absolute right-12 top-6 hidden h-20 w-80 text-white/55 md:block" viewBox="0 0 360 90" fill="none" aria-hidden="true">
      <path d="M2 62c56-30 113-41 174-20 45 15 82 10 115-16 21-17 43-20 66-11" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 7" />
      <path d="M258 24c13-12 28 3 17 15-6 7-18 10-26 14 4-10 3-20 9-29Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M323 8 357 20l-27 12-7 22-5-27-24-9Z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Flower() {
  return (
    <svg className="h-12 w-12" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M25 43V26" stroke="#8da181" strokeWidth="1.5" />
      <path d="M25 34c-4-5-8-6-12-4 3 5 7 6 12 4ZM25 37c5-5 9-6 12-3-4 5-8 6-12 3Z" fill="#9fbd8f" opacity=".7" />
      <circle cx="24" cy="19" r="4" fill="#efc1ce" />
      <circle cx="18" cy="22" r="4" fill="#f4d1da" />
      <circle cx="30" cy="22" r="4" fill="#f4d1da" />
      <circle cx="24" cy="25" r="4" fill="#efc1ce" />
      <circle cx="24" cy="22" r="2.5" fill="#f3cf74" />
    </svg>
  );
}

function Leaf() {
  return (
    <svg className="h-12 w-12" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M12 36c11-3 19-12 23-25" stroke="#8ca17c" strokeWidth="1.4" />
      <path d="M17 30c-6-5-10-5-13-1 4 5 8 5 13 1ZM25 22c-2-7 0-11 5-14 3 6 1 10-5 14ZM20 27c7-1 11 1 13 6-7 2-11 0-13-6Z" fill="#9db98d" opacity=".65" />
    </svg>
  );
}

function Cloud() {
  return (
    <svg className="h-10 w-12" viewBox="0 0 48 40" fill="none" aria-hidden="true">
      <path d="M13 29h23a7 7 0 0 0 0-14h-1A11 11 0 0 0 14 18h-1a5.5 5.5 0 0 0 0 11Z" stroke="#84acd1" strokeWidth="1.5" fill="#cfe8fb" opacity=".65" />
    </svg>
  );
}

function Heart() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 32S7 24 7 14c0-4 3-7 7-7 3 0 5 2 6 4 1-2 3-4 6-4 4 0 7 3 7 7 0 10-13 18-13 18Z" fill="#f0a9bf" opacity=".72" />
    </svg>
  );
}

function Sprout() {
  return (
    <svg className="h-12 w-12" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 41V22" stroke="#87a67d" strokeWidth="1.5" />
      <path d="M24 24c-9-7-14-7-17-2 6 8 12 8 17 2ZM24 29c7-8 13-9 17-5-4 8-10 10-17 5Z" stroke="#9db98d" strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="18" r="2" fill="#efc1ce" />
      <circle cx="35" cy="22" r="2" fill="#efc1ce" />
    </svg>
  );
}

function Star() {
  return (
    <svg className="h-11 w-11" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="m22 5 4 12 12 1-9 8 3 12-10-7-10 7 3-12-9-8 12-1 4-12Z" stroke="#e4b55f" strokeWidth="1.6" fill="#f8dc8d" opacity=".65" />
    </svg>
  );
}
