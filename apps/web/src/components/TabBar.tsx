"use client";

import type { KeyboardEvent } from "react";

export interface TabDef<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/**
 * Вкладки за патерном ARIA tabs: стрілки ←/→ перемикають і переносять фокус.
 * Панель вмісту має мати id="panel-<id>" та aria-labelledby="tab-<id>".
 */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  label = "Розділи",
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  label?: string;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    if (!next) return;
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-3">
      {tabs.map((t, i) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          role="tab"
          aria-selected={active === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          className="pixel-btn min-h-11"
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {t.label}
          {t.count !== undefined ? ` (${t.count})` : ""}
        </button>
      ))}
    </div>
  );
}
