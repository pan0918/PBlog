"use client";

import { memo } from "react";
import { useMusic, useMusicPlayback } from "./MusicProvider";
import { formatTime } from "../lib/utils";

interface MusicProgressBarProps {
  accentColor?: string;
  trackColor?: string;
  rangeClassName?: string;
  containerClassName?: string;
  timeClassName?: string;
}

function MusicProgressBar({
  accentColor = "#d68a3a",
  trackColor = "rgba(184,111,43,0.22)",
  rangeClassName = "h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/40 shadow-inner outline-none dark:bg-stone-700/50",
  containerClassName = "flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mb-3",
  timeClassName = "w-10 tabular-nums",
}: MusicProgressBarProps) {
  const { seekToPercent } = useMusic();
  const { progress, currentTime, duration } = useMusicPlayback();

  return (
    <div className={containerClassName}>
      <span className={`${timeClassName} text-right`}>{formatTime(currentTime)}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={(e) => seekToPercent(Number(e.target.value))}
        className={rangeClassName}
        style={{ background: `linear-gradient(to right, ${accentColor} ${progress}%, ${trackColor} ${progress}%)` }}
      />
      <span className={timeClassName}>{formatTime(duration)}</span>
    </div>
  );
}

export default memo(MusicProgressBar);
