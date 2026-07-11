"use client";

import { useEffect, useRef, useState, type ComponentType, type FormEvent } from "react";
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
  ChevronDown,
  ChevronRight,
  Droplets,
  LocateFixed,
  MapPin,
  Moon,
  RotateCcw,
  Search,
  Sun,
  ThermometerSun,
  Wind,
  type LucideProps,
} from "lucide-react";
import {
  YUEQING_LOCATION,
  buildCitySearchUrl,
  buildReverseGeocodeUrl,
  buildWeatherUrl,
  normalizeWeatherResponse,
  parseCitySearchResponse,
  parseReverseGeocodeResponse,
  type CitySearchResult,
  type LocationSource,
  type WeatherIconKind,
  type WeatherLocation,
  type WeatherViewModel,
} from "../lib/weather";

const SAVED_LOCATION_KEY = "pblog:weather-location";

const locationSourceLabels: Record<LocationSource, string> = {
  gps: "精确定位",
  ip: "网络定位",
  manual: "手动位置",
  default: "默认位置",
};

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

function getDeviceCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (coordinates: { latitude: number; longitude: number } | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(coordinates);
    };
    const timeoutId = window.setTimeout(() => finish(null), 8000);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => finish({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
      () => finish(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  });
}

function readSavedLocation(): WeatherLocation | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_LOCATION_KEY) || "null") as Partial<WeatherLocation> | null;
    if (
      parsed?.source === "manual"
      && typeof parsed.name === "string"
      && Number.isFinite(parsed.latitude)
      && Number.isFinite(parsed.longitude)
    ) {
      return parsed as WeatherLocation;
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchReverseLocation(
  source: "gps" | "ip",
  signal: AbortSignal,
  coordinates?: { latitude: number; longitude: number },
): Promise<WeatherLocation> {
  const response = await fetch(buildReverseGeocodeUrl(coordinates), { signal });
  if (!response.ok) throw new Error("Location request failed");
  return parseReverseGeocodeResponse(await response.json(), source);
}

async function resolveAutomaticLocation(signal: AbortSignal): Promise<WeatherLocation> {
  const coordinates = await getDeviceCoordinates();
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");

  if (coordinates) {
    try {
      return await fetchReverseLocation("gps", signal, coordinates);
    } catch {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    }
  }

  try {
    return await fetchReverseLocation("ip", signal);
  } catch {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    return YUEQING_LOCATION;
  }
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
  const [locationRevision, setLocationRevision] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const searchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchWeather() {
      try {
        setLoading(true);
        const location = readSavedLocation() || await resolveAutomaticLocation(controller.signal);
        if (cancelled) return;

        const response = await fetch(buildWeatherUrl(location), { signal: controller.signal });
        if (!response.ok) throw new Error("Weather request failed");
        const data = await response.json();
        if (cancelled) return;

        setWeather(normalizeWeatherResponse(data, location));
      } catch {
        if (cancelled || controller.signal.aborted) return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locationRevision]);

  useEffect(() => () => searchControllerRef.current?.abort(), []);

  async function handleCitySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = cityQuery.trim();
    if (query.length < 2) {
      setSearchMessage("请输入至少两个字");
      return;
    }

    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    setSearching(true);
    setSearchMessage("");

    try {
      const response = await fetch(buildCitySearchUrl(query), { signal: controller.signal });
      if (!response.ok) throw new Error("City search failed");
      const results = parseCitySearchResponse(await response.json());
      setCityResults(results);
      if (results.length === 0) setSearchMessage("没有找到匹配城市");
    } catch {
      if (!controller.signal.aborted) setSearchMessage("城市搜索暂时不可用");
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }

  function selectManualLocation(location: WeatherLocation) {
    localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(location));
    setPickerOpen(false);
    setCityQuery("");
    setCityResults([]);
    setLocationRevision((value) => value + 1);
  }

  function restoreAutomaticLocation() {
    localStorage.removeItem(SAVED_LOCATION_KEY);
    setPickerOpen(false);
    setCityQuery("");
    setCityResults([]);
    setLocationRevision((value) => value + 1);
  }

  if (loading && !weather) return <WeatherSkeleton />;

  if (!weather) {
    return (
      <div className="soft-glass-panel flex min-h-[220px] flex-col items-center justify-center rounded-3xl p-5 text-center transition-all duration-700">
        <CloudOff aria-hidden="true" className="h-8 w-8 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-bold text-stone-600 dark:text-stone-300">暂时无法获取天气</p>
        <p className="mt-1 text-[11px] text-stone-400 dark:text-stone-500">稍后刷新页面再试</p>
      </div>
    );
  }

  return (
    <section aria-busy={loading} className="soft-glass-panel relative overflow-hidden rounded-3xl p-5 transition-all duration-700" aria-label={`${weather.city}天气`}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-300/16 blur-[42px] dark:bg-amber-400/10" />

      {pickerOpen && (
        <div className="absolute inset-x-3 top-3 z-30 rounded-[22px] border border-white/60 bg-[#fffaf2]/95 p-4 shadow-2xl shadow-stone-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-stone-900/95">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">选择天气城市</p>
              <p className="mt-0.5 text-[9px] text-stone-400 dark:text-stone-500">搜索后将保存到当前浏览器</p>
            </div>
            <button type="button" onClick={() => setPickerOpen(false)} aria-label="关闭城市选择" className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/5 text-stone-500 transition-colors hover:bg-stone-900/10 dark:bg-white/5 dark:text-stone-300">
              <span aria-hidden="true" className="text-lg leading-none">×</span>
            </button>
          </div>

          <form onSubmit={handleCitySearch} className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="weather-city-search">搜索城市</label>
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input id="weather-city-search" value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} placeholder="例如：杭州、深圳" className="h-9 w-full rounded-xl border border-stone-900/10 bg-white/70 pl-8 pr-3 text-xs text-stone-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 dark:border-white/10 dark:bg-stone-800/70 dark:text-stone-100" />
            </div>
            <button type="submit" disabled={searching} className="h-9 rounded-xl bg-amber-500 px-3 text-[10px] font-bold text-white transition hover:bg-amber-600 disabled:opacity-50">{searching ? "搜索中" : "搜索"}</button>
          </form>

          <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
            {cityResults.map((result) => (
              <button key={result.id} type="button" onClick={() => selectManualLocation(result.location)} className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-amber-500/10">
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-stone-700 dark:text-stone-200">{result.location.name}</span>
                  <span className="mt-0.5 block truncate text-[9px] text-stone-400 dark:text-stone-500">{result.detail || "城市位置"}</span>
                </span>
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
              </button>
            ))}
            {searchMessage && <p className="py-3 text-center text-[10px] text-stone-400 dark:text-stone-500">{searchMessage}</p>}
          </div>

          <button type="button" onClick={restoreAutomaticLocation} className="mt-2 flex w-full items-center justify-center gap-1.5 border-t border-stone-900/[0.06] pt-3 text-[10px] font-bold text-stone-500 transition-colors hover:text-amber-600 dark:border-white/[0.06] dark:text-stone-400 dark:hover:text-amber-400">
            <RotateCcw aria-hidden="true" className="h-3 w-3" />
            恢复自动定位
          </button>
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {weather.locationSource === "gps"
            ? <LocateFixed aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" strokeWidth={2} />
            : <MapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" strokeWidth={2} />}
          <h3 className="truncate text-sm font-bold tracking-wide text-stone-800 dark:text-stone-100">{weather.city}</h3>
        </div>
        <button type="button" onClick={() => setPickerOpen(true)} aria-expanded={pickerOpen} aria-label="选择天气城市" className="flex items-center gap-1 rounded-full border border-stone-900/[0.06] bg-white/25 px-2 py-1 text-[8px] font-bold tracking-wide text-stone-400 transition-colors hover:border-amber-400/30 hover:text-amber-600 dark:border-white/[0.06] dark:text-stone-500 dark:hover:text-amber-400">
          {locationSourceLabels[weather.locationSource]}
          <ChevronDown aria-hidden="true" className="h-2.5 w-2.5" />
        </button>
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
