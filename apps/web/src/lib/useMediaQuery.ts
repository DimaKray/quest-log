"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Чи збігається медіа-запит. На сервері й під час гідрації дає false,
 * тому використовувати лише для невеликих відмінностей розмітки.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}