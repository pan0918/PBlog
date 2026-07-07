"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

export type AdminToast = { type: 'success' | 'error'; message: string } | null;

export function useAdminToast() {
  const [toast, setToast] = useState<AdminToast>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast({ type, message });
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setToast(null);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return { toast, showToast, clearToast };
}
