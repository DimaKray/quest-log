"use client";

import { useState, type ReactNode } from "react";

/**
 * Показує перші `limit` елементів і кнопку «Показати всі».
 * Вкладати у flex-колонку: кнопка стає окремим рядком під списком.
 */
export function Limited<T>({
  items,
  limit = 7,
  children,
}: {
  items: T[];
  limit?: number;
  children: (shown: T[]) => ReactNode;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, limit);
  const canToggle = items.length > limit;

  return (
    <>
      {children(shown)}
      {canToggle && (
        <button
          className="pixel-btn min-h-11 self-start"
          onClick={() => setAll((v) => !v)}
        >
          {all ? "Згорнути" : `Показати всі (${items.length})`}
        </button>
      )}
    </>
  );
}
