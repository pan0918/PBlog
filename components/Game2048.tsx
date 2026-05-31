"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const SIZE = 4;

// --- Pure game logic ---

function createGrid(): number[][] {
  const grid: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  addRandomTile(grid);
  addRandomTile(grid);
  return grid;
}

function addRandomTile(grid: number[][]) {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function slideRow(row: number[]): { row: number[]; points: number; changed: boolean } {
  const original = [...row];
  // 1. Remove zeros
  const filtered = row.filter((v) => v !== 0);
  // 2. Merge adjacent equal tiles (each tile can only merge once per move)
  const merged: boolean[] = [];
  let points = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1] && !merged[i]) {
      filtered[i] *= 2;
      points += filtered[i];
      merged[i] = true;
      filtered[i + 1] = 0;
      i++; // skip next (already merged)
    }
  }
  // 3. Remove zeros again, pad to SIZE
  const result = filtered.filter((v) => v !== 0);
  while (result.length < SIZE) result.push(0);
  return { row: result, points, changed: JSON.stringify(result) !== JSON.stringify(original) };
}

function transpose(grid: number[][]): number[][] {
  const n = SIZE;
  const result: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      result[c][r] = grid[r][c];
  return result;
}

function reverseRows(grid: number[][]): number[][] {
  return grid.map((row) => [...row].reverse());
}

function moveGrid(grid: number[][], dir: "left" | "right" | "up" | "down"): { grid: number[][]; points: number; changed: boolean } {
  let g = grid.map((r) => [...r]);

  // Normalize all directions to "slide left"
  if (dir === "right") g = reverseRows(g);
  else if (dir === "up") g = transpose(g);
  else if (dir === "down") { g = transpose(g); g = reverseRows(g); }

  let totalPoints = 0;
  let anyChanged = false;
  const newGrid = g.map((row) => {
    const { row: newRow, points, changed } = slideRow(row);
    totalPoints += points;
    if (changed) anyChanged = true;
    return newRow;
  });

  // Rotate back
  let result = newGrid;
  if (dir === "right") result = reverseRows(result);
  else if (dir === "up") result = transpose(result);
  else if (dir === "down") { result = reverseRows(result); result = transpose(result); }

  return { grid: result, points: totalPoints, changed: anyChanged };
}

function hasMovesAvailable(grid: number[][]): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  return true;
}

function hasWon(grid: number[][]): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 2048) return true;
  return false;
}

// --- Tile colors ---

const TILE_STYLES: Record<number, { bg: string; text: string }> = {
  0:    { bg: "bg-slate-200/50 dark:bg-slate-700/50", text: "" },
  2:    { bg: "bg-slate-100 dark:bg-slate-600", text: "text-slate-700 dark:text-slate-200" },
  4:    { bg: "bg-slate-200 dark:bg-slate-500", text: "text-slate-700 dark:text-slate-200" },
  8:    { bg: "bg-amber-200 dark:bg-amber-700", text: "text-amber-800 dark:text-amber-50" },
  16:   { bg: "bg-amber-300 dark:bg-amber-600", text: "text-amber-800 dark:text-amber-50" },
  32:   { bg: "bg-orange-300 dark:bg-orange-600", text: "text-white" },
  64:   { bg: "bg-orange-400 dark:bg-orange-500", text: "text-white" },
  128:  { bg: "bg-yellow-300 dark:bg-yellow-600", text: "text-yellow-900 dark:text-yellow-50" },
  256:  { bg: "bg-yellow-400 dark:bg-yellow-500", text: "text-yellow-900 dark:text-yellow-50" },
  512:  { bg: "bg-yellow-500 dark:bg-yellow-400", text: "text-white" },
  1024: { bg: "bg-yellow-400 dark:bg-yellow-300", text: "text-yellow-900" },
  2048: { bg: "bg-gradient-to-br from-yellow-400 to-amber-500", text: "text-white" },
};

function getTileStyle(value: number) {
  return TILE_STYLES[value] || { bg: "bg-indigo-500", text: "text-white" };
}

function getFontSize(value: number): string {
  if (value >= 1024) return "text-base";
  if (value >= 128) return "text-lg";
  return "text-xl";
}

// --- Component ---

export default function Game2048() {
  const [grid, setGrid] = useState<number[][]>(() => createGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const isMoving = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Load best score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("2048-best");
      if (saved) setBest(parseInt(saved, 10));
    } catch {}
  }, []);

  const saveBest = useCallback((newScore: number) => {
    setBest((prev) => {
      const newBest = Math.max(prev, newScore);
      try { localStorage.setItem("2048-best", String(newBest)); } catch {}
      return newBest;
    });
  }, []);

  const resetGame = useCallback(() => {
    setGrid(createGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  const continueGame = useCallback(() => {
    setWon(false);
  }, []);

  const move = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (gameOver) return;

      setGrid((prev) => {
        const { grid: newGrid, points, changed } = moveGrid(prev, direction);
        if (!changed) return prev;

        addRandomTile(newGrid);

        setScore((s) => {
          const newScore = s + points;
          saveBest(newScore);
          return newScore;
        });

        if (hasWon(newGrid) && !won) setWon(true);
        if (hasMovesAvailable(newGrid)) setGameOver(true);

        return newGrid;
      });
    },
    [gameOver, won, saveBest]
  );

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":  move("left");  e.preventDefault(); break;
        case "ArrowRight": move("right"); e.preventDefault(); break;
        case "ArrowUp":    move("up");    e.preventDefault(); break;
        case "ArrowDown":  move("down");  e.preventDefault(); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else move(dy > 0 ? "down" : "up");
    touchStart.current = null;
  };

  return (
    <div className="w-full select-none">
      {/* Score bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-center min-w-[60px]">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Score</div>
            <div className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{score}</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-center min-w-[60px]">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Best</div>
            <div className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{best}</div>
          </div>
        </div>
        <button onClick={resetGame} className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 active:scale-95 transition-all">
          New Game
        </button>
      </div>

      {/* Grid */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative grid grid-cols-4 gap-1.5 p-2 bg-slate-300/60 dark:bg-slate-700/60 rounded-xl touch-none"
        style={{ aspectRatio: "1" }}
        tabIndex={0}
      >
        {grid.map((row, r) =>
          row.map((value, c) => {
            const style = getTileStyle(value);
            return (
              <div
                key={`${r}-${c}`}
                className={`rounded-lg flex items-center justify-center font-black transition-all duration-100 ${style.bg}`}
              >
                {value !== 0 && (
                  <span className={`${style.text} ${getFontSize(value)} tabular-nums`}>{value}</span>
                )}
              </div>
            );
          })
        )}

        {/* Game Over overlay */}
        {gameOver && (
          <div className="absolute inset-0 rounded-xl bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
            <p className="text-xl font-black text-white drop-shadow-lg">Game Over</p>
            <button onClick={resetGame} className="px-5 py-2.5 bg-white rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 active:scale-95 transition-all shadow-lg">
              Try Again
            </button>
          </div>
        )}

        {/* Won overlay */}
        {won && !gameOver && (
          <div className="absolute inset-0 rounded-xl bg-yellow-500/30 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
            <p className="text-xl font-black text-white drop-shadow-lg">You Win!</p>
            <div className="flex gap-2">
              <button onClick={continueGame} className="px-4 py-2 bg-white rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 active:scale-95 transition-all shadow-lg">
                Keep Going
              </button>
              <button onClick={resetGame} className="px-4 py-2 bg-indigo-500 rounded-xl text-sm font-bold text-white hover:bg-indigo-600 active:scale-95 transition-all shadow-lg">
                New Game
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile direction buttons */}
      <div className="grid grid-cols-3 gap-1 mt-3 w-28 mx-auto md:hidden">
        <div />
        <button onClick={() => move("up")} className="p-2 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-600 transition-colors">
          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
        <div />
        <button onClick={() => move("left")} className="p-2 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-600 transition-colors">
          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={() => move("down")} className="p-2 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-600 transition-colors">
          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button onClick={() => move("right")} className="p-2 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-600 transition-colors">
          <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <div />
      </div>
    </div>
  );
}
