"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} });
const THEME_TRANSITION_MS = 640;
const THEME_TRANSITION_CLASS = 'theme-transitioning';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The inline <head> script already applied the `dark` class before first paint,
  // so we NEVER hide content here. We just sync state and handle toggles.
  const [isDark, setIsDark] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
      document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }

    root.classList.add(THEME_TRANSITION_CLASS);
    root.classList.toggle('dark', next);
    setIsDark(next);

    try {
      localStorage.setItem('blog-theme', next ? 'dark' : 'light');
    } catch {}

    transitionTimerRef.current = window.setTimeout(() => {
      root.classList.remove(THEME_TRANSITION_CLASS);
      transitionTimerRef.current = null;
    }, THEME_TRANSITION_MS + 80);
  }, []);

  const value = useMemo(() => ({ isDark, toggleTheme }), [isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
