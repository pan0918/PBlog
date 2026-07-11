"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudOff,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  LocateFixed,
  MapPin,
  Moon,
  Sun,
  ThermometerSun,
  Wind,
  type LucideProps,
} from "lucide-react";
import {
  YUEQING_LOCATION,
  buildWeatherUrl,
  normalizeWeatherResponse,
  type WeatherIconKind,
  type WeatherLocation,
  type WeatherViewModel,
} from "../lib/weather";

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

function getCurrentLocation(): Promise<WeatherLocation> {
  if (!("geolocation" in navigator)) return Promise.resolve(YUEQING_LOCATION);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        name: "当前位置",
        latitude: coords.latitude,
        longitude: coords.longitude,
        isCurrentLocation: true,
      }),
      () => resolve(YUEQING_LOCATION),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30 * 60 * 1000 },
    );
  });
}

function WeatherSymbol({
  kind,
  isDay,
  className,
}: {
  kind: WeatherIconKind;
  isDay: boolean;
  className?: string;
}) {
  let Icon = iconMap[kind];
  if (kind === "sun" && !isDay) Icon = Moon;
  if (kind === "cloud-sun" && !isDay) Icon = CloudMoon;
  return <Icon aria-hidden="true" strokeWidth={1.65} className={className} />;
}

function WeatherSkeleton() {
  return (
    <div aria-busy="true" aria-label="天气信息正在加载" className="soft-glass-panel min-h-[338px] rounded-3xl p-5 transition-all duration-700">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 rounded-full bg-stone-200/70 dark:bg-stone-700/60" />
        <div className="h-4 w-4 rounded-full bg-amber-400/25" />
      </div>
      <div className="mt-7 flex items-center justify-between">
        <div>
          <div className="h-14 w-28 rounded-2xl bg-stone-200/70 dark:bg-stone-700/60" />
          <div className="mt-3 h-4 w-32 rounded-full bg-stone-200/55 dark:bg-stone-700/50" />
        </div>
        <div className="h-16 w-16 rounded-full bg-amber-400/20" />
      </div>
      <div className="mt-7 flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-20 min-w-[54px] flex-1 rounded-2xl bg-white/35 dark:bg-stone-700/30" />)}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((item) => <div key={item} className="h-14 rounded-2xl bg-white/30 dark:bg-stone-700/25" />)}
      </div>
    </div>
  );
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchWeather() {
      try {
        const location = await getCurrentLocation();
        if (cancelled) return;

        const response = await fetch(buildWeatherUrl(location), { signal: controller.signal });
        if (!response.ok) throw new Error("Weather request failed");
        const data = await response.json();
        if (cancelled) return;

        setWeather(normalizeWeatherResponse(data, location));
      } catch {
        if (cancelled || controller.signal.aborted) return;
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (loading) return <WeatherSkeleton />;

  if (error || !weather) {
    return (
      <div className="soft-glass-panel flex min-h-[220px] flex-col items-center justify-center rounded-3xl p-5 text-center transition-all duration-700">
        <CloudOff aria-hidden="true" className="h-8 w-8 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-bold text-stone-600 dark:text-stone-300">暂时无法获取天气</p>
        <p className="mt-1 text-[11px] text-stone-400 dark:text-stone-500">稍后刷新页面再试</p>
      </div>
    );
  }

  return (
    <section className="soft-glass-panel relative overflow-hidden rounded-3xl p-5 transition-all duration-700" aria-label={`${weather.city}天气`}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-300/16 blur-[42px] dark:bg-amber-400/10" />

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {weather.isCurrentLocation
            ? <LocateFixed aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" strokeWidth={2} />
            : <MapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" strokeWidth={2} />}
          <h3 className="truncate text-sm font-bold tracking-wide text-stone-800 dark:text-stone-100">{weather.city}</h3>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">当地天气</span>
      </header>

      <div className="relative z-10 mt-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-start">
            <span className="text-[52px] font-light leading-none tracking-[-0.07em] text-stone-900 dark:text-white">{weather.temperature}</span>
            <span className="ml-1 mt-1 text-xl font-medium text-stone-500 dark:text-stone-400">°</span>
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-stone-700 dark:text-stone-200">{weather.label}</p>
          <p className="mt-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">最高 {weather.high}° · 最低 {weather.low}°</p>
        </div>

        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-[26px] border border-white/45 bg-gradient-to-br from-amber-100/75 to-orange-100/25 shadow-inner dark:border-white/10 dark:from-amber-500/15 dark:to-stone-800/10">
          <WeatherSymbol kind={weather.icon} isDay={weather.isDay} className="h-11 w-11 text-amber-500 drop-shadow-sm dark:text-amber-300" />
        </div>
      </div>

      <div className="relative z-10 mt-5 border-t border-stone-500/10 pt-4">
        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">逐小时预报</p>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {weather.hourly.map((hour) => (
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

      <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
        <WeatherMetric icon={ThermometerSun} label="体感" value={`${weather.apparentTemperature}°`} />
        <WeatherMetric icon={Droplets} label="湿度" value={`${weather.humidity}%`} />
        <WeatherMetric icon={Wind} label="风速" value={`${weather.windSpeed} km/h`} />
      </div>
    </section>
  );
}

function WeatherMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/25 px-2 py-2.5 text-center dark:border-white/[0.04] dark:bg-stone-800/20">
      <div className="flex items-center justify-center gap-1 text-stone-400 dark:text-stone-500">
        <Icon aria-hidden="true" className="h-3 w-3" strokeWidth={1.8} />
        <span className="text-[8px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 truncate text-[10px] font-bold text-stone-700 dark:text-stone-200">{value}</p>
    </div>
  );
}
