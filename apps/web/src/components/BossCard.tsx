import { BOSSES, ICONS } from "@/assets/registry";
import type { Boss } from "@/lib/appState";
import { todayLocal } from "@/lib/date";
import { Sprite } from "./Sprite";

/** 'YYYY-MM-DD' -> 'ДД.ММ.РРРР' */
const formatDate = (iso: string) => iso.split("-").reverse().join(".");

/**
 * Картка активного боса з перемикачем між босами.
 * Нічого не знає про розмітку: отримує список активних босів і id вибраного.
 * Якщо вибраного боса немає в списку (його переможено), показує першого.
 */
export function BossCard({
  bosses,
  selectedId,
  onSelect,
}: {
  bosses: Boss[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const first = bosses[0];
  if (!first) return null;

  const boss = bosses.find((b) => b.id === selectedId) ?? first;
  const index = bosses.indexOf(boss);
  const count = bosses.length;
  const def = BOSSES[boss.art];
  const percent = Math.round((boss.hp / boss.maxHp) * 100);
  const overdue = boss.deadline !== null && boss.deadline < todayLocal();

  function step(delta: number) {
    const target = bosses[(index + delta + count) % count];
    if (target) onSelect(target.id);
  }

  return (
    <section className="pixel-panel flex flex-col gap-3">
      {count > 1 && (
        <nav
          aria-label="Перемикач босів"
          className="flex items-center justify-between gap-3"
        >
          <button
            className="pixel-btn min-h-11 min-w-11"
            aria-label="Попередній бос"
            onClick={() => step(-1)}
          >
            ‹
          </button>
          <span aria-live="polite">
            Бос {index + 1} з {count}
          </span>
          <button
            className="pixel-btn min-h-11 min-w-11"
            aria-label="Наступний бос"
            onClick={() => step(1)}
          >
            ›
          </button>
        </nav>
      )}

      <h2 className="text-sm break-words">{boss.title}</h2>

      <div className="flex flex-col items-center gap-1">
        <Sprite sprite={def.sprite} scale={3} alt={def.name} />
        <p className="opacity-70">{def.name}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Sprite sprite={ICONS.heart} />
          {boss.hp} / {boss.maxHp}
        </span>
        {boss.deadline && (
          <span className={overdue ? "text-[var(--hp-coral)]" : "opacity-70"}>
            до {formatDate(boss.deadline)}
            {overdue ? " (прострочено)" : ""}
          </span>
        )}
      </div>

      <div
        className="hp-bar"
        role="progressbar"
        aria-label={`HP боса «${boss.title}»`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="hp-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
