"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  // подія 'storage' спрацьовує, коли сховище змінили в іншій вкладці
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

const noopSubscribe = () => () => {};

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null, initial: () => T): T {
  if (raw !== null) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      // пошкоджені дані: використовуємо початкове значення
    }
  }
  return initial();
}

/**
 * Як useState, але значення зберігається в localStorage.
 * `ready` дорівнює false на сервері й під час гідрації та true після неї,
 * тому UI не рендериться з неправильними даними.
 */
export function usePersistentState<T>(key: string, initial: () => T) {
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // рядок з localStorage: порівнюється за значенням, тому кеш стабільний
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => parse<T>(raw, initial), [raw]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parse<T>(readRaw(key), initial);
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // сховище повне або недоступне: просто не зберігаємо
      }
      notify();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, setValue, ready] as const;
}