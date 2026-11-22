"use client";

import { useEffect, useState } from "react";
import { getSiteDateParts } from "../lib/datetime";

type CalendarDay = { year: number; month: number; day: number };

function siteCalendarDay(value: string): CalendarDay {
  const parts = getSiteDateParts(value);
  if (!parts) return localCalendarDay(new Date(value));
  return { year: Number(parts.year), month: Number(parts.month) - 1, day: Number(parts.day) };
}

function localCalendarDay(date: Date): CalendarDay {
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
}

export default function CalendarCard({ renderedAt }: { renderedAt: string }) {
  // The homepage HTML is cached, so hydrate with the day it was rendered on and
  // then switch to the visitor's actual day.
  const [current, setCurrent] = useState(() => siteCalendarDay(renderedAt));
  useEffect(() => {
    setCurrent(localCalendarDay(new Date()));
  }, []);
  const { year, month, day: today } = current;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="soft-glass-panel rounded-3xl p-5 transition-all duration-700">
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
                ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/25"
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
