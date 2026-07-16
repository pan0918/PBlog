"use client";

import { type FormEvent } from "react";
import { ChevronRight, RotateCcw, Search } from "lucide-react";
import type { CitySearchResult, WeatherLocation } from "../lib/weather";

interface CityPickerProps {
  cityQuery: string;
  onCityQueryChange: (query: string) => void;
  cityResults: CitySearchResult[];
  searching: boolean;
  searchMessage: string;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSelectLocation: (location: WeatherLocation) => void;
  onRestoreAutomatic: () => void;
  onClose: () => void;
}

export default function CityPicker({
  cityQuery,
  onCityQueryChange,
  cityResults,
  searching,
  searchMessage,
  onSearch,
  onSelectLocation,
  onRestoreAutomatic,
  onClose,
}: CityPickerProps) {
  return (
    <div className="absolute inset-x-3 top-3 z-30 rounded-[22px] border border-white/60 bg-[#fffaf2]/95 p-4 shadow-2xl shadow-stone-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-stone-900/95">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-stone-800 dark:text-stone-100">选择天气城市</p>
          <p className="mt-0.5 text-[9px] text-stone-400 dark:text-stone-500">搜索后将保存到当前浏览器</p>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭城市选择" className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/5 text-stone-500 transition-colors hover:bg-stone-900/10 dark:bg-white/5 dark:text-stone-300">
          <span aria-hidden="true" className="text-lg leading-none">×</span>
        </button>
      </div>

      <form onSubmit={onSearch} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="weather-city-search">搜索城市</label>
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input id="weather-city-search" value={cityQuery} onChange={(event) => onCityQueryChange(event.target.value)} placeholder="例如：杭州、深圳" className="h-9 w-full rounded-xl border border-stone-900/10 bg-white/70 pl-8 pr-3 text-xs text-stone-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 dark:border-white/10 dark:bg-stone-800/70 dark:text-stone-100" />
        </div>
        <button type="submit" disabled={searching} className="h-9 rounded-xl bg-amber-500 px-3 text-[10px] font-bold text-white transition hover:bg-amber-600 disabled:opacity-50">{searching ? "搜索中" : "搜索"}</button>
      </form>

      <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
        {cityResults.map((result) => (
          <button key={result.id} type="button" onClick={() => onSelectLocation(result.location)} className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-amber-500/10">
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-stone-700 dark:text-stone-200">{result.location.name}</span>
              <span className="mt-0.5 block truncate text-[9px] text-stone-400 dark:text-stone-500">{result.detail || "城市位置"}</span>
            </span>
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
          </button>
        ))}
        {searchMessage && <p className="py-3 text-center text-[10px] text-stone-400 dark:text-stone-500">{searchMessage}</p>}
      </div>

      <button type="button" onClick={onRestoreAutomatic} className="mt-2 flex w-full items-center justify-center gap-1.5 border-t border-stone-900/[0.06] pt-3 text-[10px] font-bold text-stone-500 transition-colors hover:text-amber-600 dark:border-white/[0.06] dark:text-stone-400 dark:hover:text-amber-400">
        <RotateCcw aria-hidden="true" className="h-3 w-3" />
        恢复自动定位
      </button>
    </div>
  );
}
