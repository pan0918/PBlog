"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Theme detection ─── */
function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    setDark(el.classList.contains("dark"));
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const STORAGE_KEY = "pb_message_wall";
const NOTES_PER_PAGE = 12;

/* ─── Warm post-it note palette with richer tones ─── */
const NOTE_COLORS = [
  { bg: "#fef9c3", text: "#713f12", shadow: "#eab308", tape: "rgba(200,180,140,0.45)" },   // 淡黄
  { bg: "#dcfce7", text: "#14532d", shadow: "#22c55e", tape: "rgba(160,200,170,0.45)" },   // 浅绿
  { bg: "#fff7ed", text: "#7c2d12", shadow: "#f97316", tape: "rgba(220,190,150,0.45)" },   // 奶橙
  { bg: "#e0f2fe", text: "#0c4a6e", shadow: "#38bdf8", tape: "rgba(170,200,220,0.45)" },   // 天蓝
  { bg: "#fce7f3", text: "#831843", shadow: "#ec4899", tape: "rgba(220,180,190,0.45)" },   // 粉色
  { bg: "#f5f5f4", text: "#44403c", shadow: "#a8a29e", tape: "rgba(190,185,180,0.45)" },   // 米灰
  { bg: "#ecfccb", text: "#365314", shadow: "#84cc16", tape: "rgba(180,210,150,0.45)" },   // 嫩绿
  { bg: "#fef3c7", text: "#92400e", shadow: "#f59e0b", tape: "rgba(220,195,140,0.45)" },   // 暖黄
];

/* ─── Deterministic organic scatter layout with overlap ─── */
function computeLayout(count: number) {
  const items: { x: number; y: number; rotation: number; zIndex: number; scale: number; tapeRotation: number }[] = [];
  if (count === 0) return items;

  for (let i = 0; i < count; i++) {
    const s = (i * 2654435761) >>> 0;
    const r1 = (s % 997) / 997;
    const r2 = (((s * 7 + 13) >>> 0) % 997) / 997;
    const r3 = (((s * 11 + 3) >>> 0) % 997) / 997;
    const r4 = (((s * 17 + 7) >>> 0) % 997) / 997;
    const r5 = (((s * 23 + 19) >>> 0) % 997) / 997;

    // Tighter grid with heavy organic offset for natural scatter
    const cols = count <= 3 ? 2 : count <= 6 ? 3 : 4;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const colWidth = 100 / cols;

    // More aggressive random offsets for overlap
    const x = colWidth * col + colWidth * 0.5 + (r1 - 0.5) * colWidth * 0.55;
    const baseRowHeight = 26;
    const y = row * baseRowHeight + 10 + (r2 - 0.5) * baseRowHeight * 0.55;

    // Wider rotation
    const rotation = (r3 - 0.5) * 28; // -14 to +14 degrees

    // Varied scale for depth
    const scale = 0.92 + r4 * 0.16; // 0.92 to 1.08

    // z-index with more variation for overlap
    const zIndex = 10 + Math.floor(r5 * 8);

    // Tape angle
    const tapeRotation = (r1 - 0.5) * 30;

    items.push({
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(2, Math.min(88, y)),
      rotation,
      zIndex,
      scale,
      tapeRotation,
    });
  }
  return items;
}

interface WallMessage {
  id: string;
  content: string;
  author: string;
  colorIndex: number;
  createdAt: string;
}

function loadMessages(): WallMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: WallMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/* ─── Washi Tape decoration ─── */
function WashiTape({ color, rotation }: { color: string; rotation: number }) {
  return (
    <div
      className="absolute -top-[3px] left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none"
      style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
    >
      <div
        className="w-[50px] h-[14px] rounded-[1px]"
        style={{
          background: color,
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          // Subtle torn edge effect via gradient
          backgroundImage: `
            linear-gradient(90deg,
              transparent 0%, ${color} 3%, ${color} 97%, transparent 100%
            )
          `,
        }}
      />
    </div>
  );
}

/* ─── Realistic Red Pushpin ─── */
function PushPin() {
  return (
    <div className="absolute -top-[8px] left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
      <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
        {/* Drop shadow */}
        <ellipse cx="14" cy="32" rx="5" ry="2" fill="rgba(0,0,0,0.15)" />
        {/* Pin shaft */}
        <rect x="13" y="23" width="2" height="8" rx="1" fill="#a0a0a0" opacity="0.5" />
        {/* Pin head */}
        <circle cx="14" cy="14" r="9" fill="#dc2626" />
        <circle cx="14" cy="14" r="9" fill="url(#pinGrad2)" />
        {/* Glossy highlight */}
        <ellipse cx="11" cy="11" rx="4" ry="3" fill="white" opacity="0.3" />
        <ellipse cx="10" cy="9.5" rx="2" ry="1.5" fill="white" opacity="0.2" />
        <defs>
          <radialGradient id="pinGrad2" cx="0.35" cy="0.3" r="0.65">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0.5" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Corner fold effect ─── */
function CornerFold({ color }: { color: string }) {
  return (
    <div className="absolute bottom-0 right-0 z-[2] pointer-events-none select-none">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M20 0 L20 20 L0 20 Z" fill={color} opacity="0.15" />
        <path d="M20 0 L20 20 L0 20 Z" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

/* ─── Decorative stamp mark ─── */
function StampMark({ rotation }: { rotation: number }) {
  return (
    <div
      className="absolute bottom-2 left-2 pointer-events-none select-none z-[2]"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className="w-[28px] h-[28px] rounded-full border-[1.5px] border-red-800/10 flex items-center justify-center">
        <span className="text-[7px] font-bold text-red-800/10 tracking-wider" style={{ fontFamily: "'Georgia', serif" }}>
          PB
        </span>
      </div>
    </div>
  );
}

/* ─── StickyNote ─── */
function StickyNote({ msg, color, layout, index }: {
  msg: WallMessage;
  color: typeof NOTE_COLORS[number];
  layout: { x: number; y: number; rotation: number; zIndex: number; scale: number; tapeRotation: number };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 30 }}
      animate={{ opacity: 1, scale: layout.scale, y: 0 }}
      exit={{ opacity: 0, scale: 0.2, y: -30 }}
      transition={{ type: "spring", stiffness: 180, damping: 16, delay: index * 0.04 }}
      className="absolute"
      style={{
        left: `${layout.x}%`,
        top: `${layout.y}%`,
        transform: `translate(-50%, -50%) rotate(${layout.rotation}deg)`,
        width: "min(230px, 44vw)",
        zIndex: layout.zIndex,
      }}
    >
      <div className="relative cursor-default group">
        {/* Pushpin on top */}
        <PushPin />

        {/* Washi tape decoration (alternates with pin) */}
        {index % 3 === 1 && (
          <WashiTape color={color.tape} rotation={layout.tapeRotation} />
        )}

        {/* Note card — physical paper */}
        <div
          className="rounded-[2px] p-5 pt-6 min-h-[130px] flex flex-col justify-between relative transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-lg"
          style={{
            backgroundColor: color.bg,
            color: color.text,
            boxShadow: `
              3px 4px 12px rgba(0,0,0,0.15),
              1px 2px 4px rgba(0,0,0,0.1),
              inset 0 -3px 0 rgba(0,0,0,0.04),
              inset 0 1px 0 rgba(255,255,255,0.4)
            `,
          }}
        >
          {/* Paper grain texture */}
          <div className="absolute inset-0 rounded-[2px] opacity-[0.03] pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
          }} />

          {/* Horizontal fold line */}
          <div
            className="absolute top-[45%] left-[8%] right-[8%] h-[0.5px] pointer-events-none opacity-[0.06]"
            style={{ background: `linear-gradient(90deg, transparent, ${color.text}, transparent)` }}
          />

          {/* Decorative dotted line at top */}
          <div
            className="absolute top-[18px] left-[12px] right-[12px] h-[1px] pointer-events-none opacity-[0.08]"
            style={{ backgroundImage: `repeating-linear-gradient(90deg, ${color.text} 0, ${color.text} 3px, transparent 3px, transparent 7px)` }}
          />

          {/* Watermark */}
          <div
            className="absolute bottom-3 right-3 text-[30px] font-black pointer-events-none select-none leading-none tracking-tighter"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: color.shadow, opacity: 0.06 }}
          >
            PBLOG
          </div>

          {/* Stamp mark (on some notes) */}
          {index % 4 === 0 && <StampMark rotation={(index * 17) % 30 - 15} />}

          {/* Corner fold (on some notes) */}
          {index % 3 === 2 && <CornerFold color={color.shadow} />}

          {/* Content */}
          <p
            className="text-[14px] leading-[2] whitespace-pre-wrap break-words line-clamp-5 relative z-[1]"
            style={{ fontFamily: "'Noto Serif SC', 'STSong', 'SimSun', serif" }}
          >
            {msg.content}
          </p>

          {/* Footer: author + date */}
          <div className="mt-4 pt-2 relative z-[1]">
            {/* Dashed separator */}
            <div
              className="mb-2 h-[0.5px] opacity-[0.1]"
              style={{ backgroundImage: `repeating-linear-gradient(90deg, ${color.text} 0, ${color.text} 4px, transparent 4px, transparent 8px)` }}
            />
            <p
              className="text-[12px] font-bold opacity-45 tracking-wide"
              style={{ fontFamily: "'Noto Serif SC', 'STSong', serif" }}
            >
              ——{msg.author}
            </p>
            <p
              className="text-[10px] opacity-25 mt-0.5"
              style={{ fontFamily: "'Noto Serif SC', 'STSong', serif" }}
            >
              {fmtDate(msg.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════ MAIN ═══════════════ */
export default function MessageWall() {
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [authorName, setAuthorName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wallRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDark();

  useEffect(() => {
    setMessages(loadMessages());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) saveMessages(messages);
  }, [messages, isLoaded]);

  const totalPages = Math.ceil(messages.length / NOTES_PER_PAGE);
  const cur = messages.slice((page - 1) * NOTES_PER_PAGE, page * NOTES_PER_PAGE);
  const layouts = useMemo(() => computeLayout(cur.length), [cur.length]);

  const submit = () => {
    const t = messageText.trim();
    if (!t) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setMessages((p) => [{
        id: crypto.randomUUID(),
        content: t,
        author: authorName.trim() || "匿名",
        colorIndex: Math.floor(Math.random() * NOTE_COLORS.length),
        createdAt: new Date().toISOString(),
      }, ...p]);
      setMessageText("");
      setPage(1);
      setIsSubmitting(false);
    }, 350);
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-[3px] border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
        <span className="font-bold text-slate-400 text-sm tracking-wide" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          加载留言墙...
        </span>
      </div>
    );
  }

  const wallMinH = messages.length === 0 ? 320 : Math.max(380, Math.ceil(cur.length / (cur.length <= 3 ? 2 : cur.length <= 6 ? 3 : 4)) * 190 + 60);

  return (
    <div ref={wallRef} className="flex flex-col gap-6">
      {/* ══════ WALL — Frosted glass board ══════ */}
      <div
        className="relative rounded-[20px] overflow-hidden backdrop-blur-xl"
        style={{
          minHeight: wallMinH,
          backgroundColor: isDark ? "rgba(30,26,20,0.55)" : "rgba(255,255,255,0.35)",
        }}
      >
        {/* Warm frosted glass tint */}
        <div className="absolute inset-0 rounded-[20px]" style={{
          background: isDark
            ? `radial-gradient(ellipse at 20% 20%, rgba(180,140,60,0.08) 0%, transparent 50%),
               radial-gradient(ellipse at 80% 80%, rgba(160,120,50,0.06) 0%, transparent 50%)`
            : `radial-gradient(ellipse at 20% 20%, rgba(217,191,146,0.15) 0%, transparent 50%),
               radial-gradient(ellipse at 80% 80%, rgba(200,175,130,0.1) 0%, transparent 50%)`,
        }} />

        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.06] rounded-[20px] mix-blend-soft-light pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.0' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />

        {/* Glass border — double edge */}
        <div className="absolute inset-0 rounded-[20px] border border-white/30 dark:border-white/[0.08] z-[3] pointer-events-none" />
        <div className="absolute inset-[1px] rounded-[19px] border border-white/15 dark:border-white/[0.04] z-[3] pointer-events-none" />

        {/* Inner glow */}
        <div className="absolute inset-0 rounded-[20px] z-[3] pointer-events-none" style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.03)",
        }} />

        {/* ── Empty state ── */}
        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[4]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col items-center"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border backdrop-blur-sm ${isDark ? "bg-white/[0.06] border-white/[0.08]" : "bg-white/40 border-white/50"}`}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isDark ? "text-amber-400/50" : "text-amber-700/50"}>
                  <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                  <path d="M14 3v4a2 2 0 0 0 2 2h4" />
                  <path d="M8 13h8" />
                  <path d="M8 17h8" />
                </svg>
              </div>
              <p className={`font-bold text-lg tracking-tight ${isDark ? "text-amber-300/40" : "text-amber-800/50"}`} style={{ fontFamily: "'Noto Serif SC', serif" }}>
                这面墙还很安静
              </p>
              <p className={`text-xs mt-1.5 font-medium ${isDark ? "text-amber-400/25" : "text-amber-700/30"}`} style={{ fontFamily: "'Noto Serif SC', serif" }}>
                在下方写下你的第一张便签吧
              </p>
            </motion.div>
          </div>
        )}

        {/* ── Notes ── */}
        {messages.length > 0 && (
          <div className="absolute inset-0 z-[4]">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative w-full h-full"
                style={{ minHeight: wallMinH }}
              >
                {cur.map((msg, i) => (
                  <StickyNote
                    key={msg.id}
                    msg={msg}
                    color={NOTE_COLORS[msg.colorIndex % NOTE_COLORS.length]}
                    layout={layouts[i]}
                    index={i}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ══════ PAGINATION ══════ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => { setPage((p) => Math.max(1, p - 1)); wallRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
            disabled={page === 1}
            className={`w-8 h-8 rounded-full border disabled:opacity-25 transition-colors flex items-center justify-center ${
              isDark
                ? "bg-amber-900/30 border-amber-700/30 text-amber-400/60"
                : "bg-amber-100/60 border-amber-200/50 text-amber-700/60"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </motion.button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => { setPage(p); wallRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className={`w-8 h-8 rounded-full text-[11px] font-bold transition-colors duration-200 flex items-center justify-center ${
                p === page
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : isDark
                    ? "bg-amber-900/30 border border-amber-700/30 text-amber-400/60"
                    : "bg-amber-100/60 border border-amber-200/50 text-amber-700/60"
              }`}
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {p}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); wallRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
            disabled={page === totalPages}
            className={`w-8 h-8 rounded-full border disabled:opacity-25 transition-colors flex items-center justify-center ${
              isDark
                ? "bg-amber-900/30 border-amber-700/30 text-amber-400/60"
                : "bg-amber-100/60 border border-amber-200/50 text-amber-700/60"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </motion.button>
        </div>
      )}

      {/* ══════ INPUT — Frosted glass form ══════ */}
      <div
        className="rounded-[20px] backdrop-blur-xl p-5 sm:p-6 transition-colors duration-500"
        style={{
          backgroundColor: isDark ? "rgba(30,26,20,0.5)" : "rgba(255,255,255,0.35)",
          boxShadow: `
            0 4px 24px rgba(0,0,0,${isDark ? "0.15" : "0.06"}),
            inset 0 1px 0 ${isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.5)"}
          `,
        }}
      >
        <h3
          className={`text-base font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-amber-200/80" : "text-amber-900/80"}`}
          style={{ fontFamily: "'Noto Serif SC', serif" }}
        >
          <div className="w-7 h-7 rounded-md bg-amber-600 flex items-center justify-center shadow-sm shadow-amber-600/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 17v5" />
              <path d="M9 2h6l-1 7H10L9 2Z" />
              <circle cx="12" cy="9" r="6" />
            </svg>
          </div>
          写一张便签
        </h3>

        <div className="flex flex-col md:grid md:grid-cols-4 gap-3 mb-3">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="你的名字（可选）"
            maxLength={20}
            className={`md:col-span-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all ${
              isDark
                ? "bg-white/5 border border-white/[0.08] text-amber-100 placeholder-amber-500/50"
                : "bg-white/40 border border-white/50 text-amber-900 placeholder-amber-400/60"
            }`}
            style={{ fontFamily: "'Noto Serif SC', serif", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
          />
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="写下你想说的话..."
            maxLength={200}
            rows={3}
            className={`md:col-span-3 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all resize-none leading-relaxed ${
              isDark
                ? "bg-white/5 border border-white/[0.08] text-amber-100 placeholder-amber-500/50"
                : "bg-white/40 border border-white/50 text-amber-900 placeholder-amber-400/60"
            }`}
            style={{ fontFamily: "'Noto Serif SC', serif", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span
            className="text-[11px] text-amber-600/40 font-medium tabular-nums"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {messageText.length}/200
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={submit}
            disabled={!messageText.trim() || isSubmitting}
            className="px-5 py-2 rounded-md bg-amber-600 text-white text-sm font-bold shadow-md shadow-amber-600/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            )}
            {isSubmitting ? "钉上中..." : "钉上便签"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
