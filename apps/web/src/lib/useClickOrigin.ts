"use client";

import { useCallback, useEffect, useRef } from "react";

export interface Point {
  x: number;
  y: number;
}

/**
 * Запам'ятовує, де користувач востаннє натискав, щоб ефекти вилітали з кнопки.
 * Якщо кнопку активували з клавіатури, береться центр елемента у фокусі.
 */
export function useClickOrigin(): () => Point {
  const last = useRef<{ x: number; y: number; at: number } | null>(null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      last.current = { x: e.clientX, y: e.clientY, at: performance.now() };
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, []);

  return useCallback((): Point => {
    const p = last.current;
    if (p && performance.now() - p.at < 1500) return { x: p.x, y: p.y };
    const el = document.activeElement;
    if (el instanceof HTMLElement && el !== document.body) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }, []);
}