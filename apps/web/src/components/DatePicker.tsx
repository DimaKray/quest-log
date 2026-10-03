"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  MONTHS,
  MONTHS_GENITIVE,
  WEEKDAYS,
  addDays,
  addMonths,
  monthGrid,
  parseIso,
  shiftMonth,
  toIso,
  type MonthView,
} from "@/lib/calendar";
import { formatDay, todayLocal } from "@/lib/date";

/**
 * Календар українською у піксельному стилі: нативний <input type="date">
 * показує мову браузера, а не сайту.
 *
 * Рендерить кнопку й (відкритий) календар як сусідні елементи: батько має бути
 * `flex flex-wrap`, календар займає окремий рядок (w-full).
 *
 * Клавіатура: ↑↓←→ по днях, PageUp/PageDown по місяцях, Esc закриває
 * лише календар (не діалог навколо).
 */
export function DatePicker({
  value,
  onChange,
  min,
  label = "Дедлайн",
}: {
  /** 'YYYY-MM-DD' або '' (не вказано) */
  value: string;
  onChange: (value: string) => void;
  /** найраніша дозволена дата 'YYYY-MM-DD' */
  min?: string;
  label?: string;
}) {
  const uid = useId();
  const panelId = `${uid}-panel`;
  const dayId = (iso: string) => `${uid}-day-${iso}`;
  const today = todayLocal();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MonthView>(() => startView(value, today));
  // день, на якому зараз клавіатурний фокус (roving tabindex)
  const [focusIso, setFocusIso] = useState<string | null>(null);
  const wantFocus = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const cells = monthGrid(view.year, view.month0);
  const isDisabled = (iso: string) => min !== undefined && iso < min;
  const inView = (iso: string) => cells.some((c) => c.iso === iso && c.inMonth);

  // Єдиний день, на який потрапляє Tab: фокусний, вибраний, сьогодні або перший доступний
  const tabbable =
    [focusIso, value, today].find(
      (iso): iso is string => !!iso && inView(iso) && !isDisabled(iso),
    ) ??
    cells.find((c) => c.inMonth && !isDisabled(c.iso))?.iso ??
    null;

  // Переносимо фокус на день лише після дій користувача (відкриття, стрілки),
  // інакше фокус «тікав» би з кнопок місяця при кожному кліку.
  useEffect(() => {
    if (wantFocus.current && tabbable) {
      wantFocus.current = false;
      document.getElementById(`${uid}-day-${tabbable}`)?.focus();
    }
  });

  const firstOfView = toIso({ y: view.year, m0: view.month0, d: 1 });
  const prevDisabled = min !== undefined && addDays(firstOfView, -1) < min;

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setView(startView(value, today));
    setFocusIso(null);
    wantFocus.current = true;
    setOpen(true);
  }

  function closeAndReturnFocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function choose(iso: string) {
    if (isDisabled(iso)) return;
    onChange(iso);
    closeAndReturnFocus();
  }

  function onDayKeyDown(e: KeyboardEvent<HTMLButtonElement>, iso: string) {
    let next: string;
    switch (e.key) {
      case "ArrowLeft":
        next = addDays(iso, -1);
        break;
      case "ArrowRight":
        next = addDays(iso, 1);
        break;
      case "ArrowUp":
        next = addDays(iso, -7);
        break;
      case "ArrowDown":
        next = addDays(iso, 7);
        break;
      case "PageUp":
        next = shiftMonth(iso, -1);
        break;
      case "PageDown":
        next = shiftMonth(iso, 1);
        break;
      default:
        return;
    }
    e.preventDefault();
    const p = parseIso(next);
    if (!p || isDisabled(next)) return;
    wantFocus.current = true;
    setFocusIso(next);
    setView({ year: p.y, month0: p.m0 });
  }

  function onPanelKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Escape") return;
    // не даємо Esc закрити весь діалог: спершу закривається лише календар
    e.preventDefault();
    e.stopPropagation();
    closeAndReturnFocus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="pixel-input min-h-11 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        {label}: {value ? formatDay(value) : "не вказано"}
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={`Календар: ${MONTHS[view.month0]} ${view.year}`}
          className="calendar w-full"
          onKeyDown={onPanelKeyDown}
        >
          <div className="calendar__head">
            <button
              type="button"
              className="pixel-btn min-h-11 min-w-11"
              aria-label="Попередній місяць"
              disabled={prevDisabled}
              onClick={() => setView((v) => addMonths(v, -1))}
            >
              ‹
            </button>
            <span className="calendar__title" aria-live="polite">
              {MONTHS[view.month0]} {view.year}
            </span>
            <button
              type="button"
              className="pixel-btn min-h-11 min-w-11"
              aria-label="Наступний місяць"
              onClick={() => setView((v) => addMonths(v, 1))}
            >
              ›
            </button>
          </div>

          <div className="calendar__grid">
            {WEEKDAYS.map((w) => (
              <span key={w} className="calendar__weekday" aria-hidden="true">
                {w}
              </span>
            ))}
            {cells.map((c) => {
              const day = Number(c.iso.slice(8, 10));
              const month0 = Number(c.iso.slice(5, 7)) - 1;
              const selected = c.iso === value;
              const isToday = c.iso === today;
              return (
                <button
                  key={c.iso}
                  id={dayId(c.iso)}
                  type="button"
                  tabIndex={c.iso === tabbable ? 0 : -1}
                  disabled={isDisabled(c.iso)}
                  aria-label={`${day} ${MONTHS_GENITIVE[month0]} ${c.iso.slice(0, 4)}`}
                  aria-pressed={selected}
                  aria-current={isToday ? "date" : undefined}
                  className={[
                    "calendar__day",
                    c.inMonth ? "" : "is-outside",
                    selected ? "is-selected" : "",
                    isToday ? "is-today" : "",
                  ].join(" ")}
                  onClick={() => choose(c.iso)}
                  onKeyDown={(e) => onDayKeyDown(e, c.iso)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="calendar__foot">
            <button
              type="button"
              className="pixel-btn min-h-11"
              disabled={isDisabled(today)}
              onClick={() => choose(today)}
            >
              Сьогодні
            </button>
            <button
              type="button"
              className="pixel-btn min-h-11"
              onClick={() => {
                onChange("");
                closeAndReturnFocus();
              }}
            >
              Очистити
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Місяць, який показуємо при відкритті: вибраної дати або поточний. */
function startView(value: string, today: string): MonthView {
  const p = parseIso(value) ?? parseIso(today);
  return { year: p?.y ?? 2026, month0: p?.m0 ?? 0 };
}
