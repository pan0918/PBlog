"use client";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import type { WeatherIconKind } from "../lib/weather";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun } from "lucide-react";

interface HourlyItem {
  time: string;
  temperature: number;
  icon: WeatherIconKind;
  isDay: boolean;
  precipitationProbability: number;
}

interface HourlyForecastProps {
  hourly: HourlyItem[];
}

const iconMap: Record<WeatherIconKind, ComponentType<LucideProps>> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

function WeatherSymbol({ kind, isDay, className }: { kind: WeatherIconKind; isDay: boolean; className?: string }) {
  let Icon = iconMap[kind];
  if (kind === "sun" && !isDay) Icon = Moon;
  if (kind === "cloud-sun" && !isDay) Icon = CloudMoon;
  return <Icon aria-hidden="true" strokeWidth={1.65} className={className} />;
}

export default function HourlyForecast({ hourly }: HourlyForecastProps) {
  return (
    <div className="relative z-10 mt-5 border-t border-stone-500/10 pt-4">
      <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">逐小时预报</p>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {hourly.map((hour) => (
          <div key={hour.time} className="flex min-w-[54px] flex-1 flex-col items-center rounded-2xl border border-white/25 bg-white/30 px-1 py-2.5 dark:border-white/[0.04] dark:bg-stone-800/25">
            <span className={`text-[9px] font-bold ${hour.time === "现在" ? "text-amber-600 dark:text-amber-400" : "text-stone-500 dark:text-stone-400"}`}>{hour.time}</span>
            <WeatherSymbol kind={hour.icon} isDay={hour.isDay} className="my-2 h-4 w-4 text-stone-700 dark:text-stone-200" />
            <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">{hour.temperature}°</span>
            <span className={`mt-1 min-h-[12px] text-[8px] font-bold text-sky-600 dark:text-sky-400 ${hour.precipitationProbability < 20 ? "opacity-0" : "opacity-100"}`}>
              {hour.precipitationProbability}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
