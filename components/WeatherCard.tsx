"use client";
import { useState, useEffect } from "react";

interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  hourly: { time: string; temp: number; icon: string }[];
}

const weatherIcons: Record<string, string> = {
  "113": "☀️", "116": "⛅", "119": "☁️", "122": "☁️",
  "143": "🌫️", "176": "🌦️", "179": "🌨️", "182": "🌧️",
  "185": "🌧️", "200": "⛈️", "227": "🌨️", "230": "❄️",
  "248": "🌫️", "260": "🌫️", "263": "🌦️", "266": "🌧️",
  "281": "🌧️", "284": "🌧️", "293": "🌦️", "296": "🌧️",
  "299": "🌧️", "302": "🌧️", "305": "🌧️", "308": "🌧️",
  "311": "🌧️", "314": "🌧️", "317": "🌨️", "320": "🌨️",
  "323": "🌨️", "326": "🌨️", "329": "❄️", "332": "❄️",
  "335": "❄️", "338": "❄️", "350": "🌧️", "353": "🌦️",
  "356": "🌧️", "359": "🌧️", "362": "🌨️", "365": "🌨️",
  "368": "🌨️", "371": "❄️", "374": "🌧️", "377": "🌧️",
  "386": "⛈️", "389": "⛈️", "392": "⛈️", "395": "❄️",
};

const descMap: Record<string, string> = {
  "Sunny": "晴", "Partly cloudy": "多云", "Cloudy": "阴",
  "Overcast": "阴天", "Mist": "薄雾", "Fog": "雾",
  "Light rain": "小雨", "Moderate rain": "中雨", "Heavy rain": "大雨",
  "Light snow": "小雪", "Moderate snow": "中雪", "Heavy snow": "大雪",
  "Thundery outbreaks possible": "可能有雷阵雨",
  "Light rain shower": "阵雨", "Moderate or heavy rain shower": "大阵雨",
  "Patchy rain possible": "可能有零星小雨",
  "Patchy light drizzle": "零星小雨", "Light drizzle": "小雨",
  "Patchy light rain": "零星小雨", "Moderate rain at times": "间歇中雨",
  "Heavy rain at times": "间歇大雨", "Light freezing rain": "冻雨",
  "Blowing snow": "风吹雪", "Blizzard": "暴风雪",
  "Patchy light snow": "零星小雪", "Patchy moderate snow": "零星中雪",
  "Patchy heavy snow": "零星大雪",
  "Ice pellets": "冰粒", "Light shower of ice pellets": "小冰粒",
  "Moderate or heavy shower of ice pellets": "大冰粒",
  "Patchy sleet possible": "可能有雨夹雪", "Light sleet": "雨夹雪",
  "Moderate or heavy sleet": "大雨夹雪",
  "Thundery outbreaks likely": "可能有雷阵雨",
  "Moderate or heavy snow with thunder": "大雪伴雷暴",
  "Patchy light snow with thunder": "零星小雪伴雷暴",
  "Moderate or heavy rain with thunder": "大雷雨",
  "Patchy light rain with thunder": "零星小雷雨",
};

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchWeather() {
      try {
        const res = await fetch("https://wttr.in/?format=j1", { signal: controller.signal });
        if (!res.ok) throw new Error("Weather failed");
        const data = await res.json();
        if (cancelled) return;

        const cur = data.current_condition?.[0];
        if (!cur) throw new Error("No data");

        const nearest = data.nearest_area?.[0];
        const city = nearest?.areaName?.[0]?.value || nearest?.region?.[0]?.value || "未知";

        const hourly = (data.weather?.[0]?.hourly || [])
          .slice(0, 6)
          .map((h: Record<string, string>) => {
            const hour = Math.floor(parseInt(h.time) / 100);
            const now = new Date().getHours();
            return {
              time: hour === now ? "现在" : `${String(hour).padStart(2, "0")}:00`,
              temp: parseInt(h.tempC || "0"),
              icon: h.weatherCode || "113",
            };
          });

        const desc = cur.lang_zh?.[0]?.value
          || descMap[cur.weatherDesc?.[0]?.value]
          || cur.weatherDesc?.[0]?.value || "晴";

        setWeather({
          city,
          temp: parseInt(cur.temp_C || "0"),
          feelsLike: parseInt(cur.FeelsLikeC || "0"),
          description: desc,
          icon: cur.weatherCode || "113",
          humidity: parseInt(cur.humidity || "0"),
          windSpeed: parseInt(cur.windspeedKmph || "0"),
          hourly,
        });
        setLoading(false);
      } catch (e) {
        if (cancelled || controller.signal.aborted) return;
        if (!cancelled) { setError(true); setLoading(false); }
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (error) {
    return (
      <div className="soft-glass-panel rounded-3xl p-5 transition-all duration-700">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-1 rounded-full bg-amber-500"></div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">天气</h3>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">天气服务暂时不可用</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="soft-glass-panel rounded-3xl p-5 transition-all duration-700">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-1 rounded-full bg-amber-500"></div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">天气</h3>
        </div>
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500/40 border-t-transparent"></div>
          <p className="text-xs text-slate-400 dark:text-slate-500">获取天气中...</p>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="soft-glass-panel rounded-3xl p-5 transition-all duration-700">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-1 rounded-full bg-amber-500"></div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">天气</h3>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{weather.city}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{weather.temp}°</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">体感 {weather.feelsLike}°</span>
          </div>
        </div>
        <div className="text-4xl">{weatherIcons[weather.icon] || "☀️"}</div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">{weather.description}</p>

      <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 mb-4">
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
          <span>{weather.windSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          <span>{weather.humidity}%</span>
        </div>
      </div>

      {weather.hourly.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {weather.hourly.map((h, i) => (
            <div key={i} className="flex min-w-[48px] flex-col items-center gap-1 rounded-xl bg-white/38 py-2 dark:bg-stone-700/30">
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">{h.time}</span>
              <span className="text-sm">{weatherIcons[h.icon] || "☀️"}</span>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{h.temp}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
