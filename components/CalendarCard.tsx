"use client";

export default function CalendarCard() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 transition-all duration-700">
      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 tracking-tight">
        {year}年 {monthNames[month]}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">{d}</div>
        ))}
        {days.map((d, i) => (
          <div
            key={i}
            className={`text-xs py-1.5 rounded-lg transition-all ${
              d === today
                ? "bg-indigo-500 text-white font-black shadow-md shadow-indigo-500/30"
                : d
                ? "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50"
                : ""
            }`}
          >
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
}
