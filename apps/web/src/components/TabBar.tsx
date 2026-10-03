"use client";

import type { KeyboardEvent } from "react";
import type { SpriteDef } from "@/assets/registry";
import { Sprite } from "./Sprite";

export interface TabDef<T extends string> {
  id: T;
  label: string;
  count?: number;
  /** показується лише у варіанті "bottom" */
  icon?: SpriteDef;
}

/**
 * Вкладки за патерном ARIA tabs: стрілки ←/→ перемикають і переносять фокус.
 * Панель вмісту має мати id="panel-<id>" та aria-labelledby="tab-<id>".
 * variant "top": ряд кнопок над вмістом (десктоп);
 * variant "bottom": нижня панель на всю ширину з іконками (мобільний).
 */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  label = "Розділи",
  variant = "top",
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  label?: string;
  variant?: "top" | "bottom";
}) {
  const bottom = variant === "bottom";

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
    <div
      role="tablist"
      aria-label={label}
      className={bottom ? "bottom-bar" : "flex flex-wrap gap-3"}
    >
      {tabs.map((t, i) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          role="tab"
          aria-selected={active === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          className={bottom ? "bottom-bar__item" : "pixel-btn min-h-11"}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {bottom ? (
            <>
              {t.icon && (
                // фіксована висота, щоб підписи стояли на одній лінії
                <span className="flex h-7 items-center">
                  <Sprite sprite={t.icon} />
                </span>
              )}
              <span>{t.label}</span>
              {t.count ? (
                <span className="bottom-bar__badge">{t.count}</span>
              ) : null}
            </>
          ) : (
            <>
              {t.label}
              {t.count !== undefined ? ` (${t.count})` : ""}
            </>
          )}
        </button>
      ))}
    </div>
  );
}
