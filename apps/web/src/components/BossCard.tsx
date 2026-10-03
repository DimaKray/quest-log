import { BOSSES, ICONS } from "@/assets/registry";
import type { Boss } from "@/lib/appState";
import { formatDay, todayLocal } from "@/lib/date";
import { HpBar } from "./HpBar";
import { Sprite } from "./Sprite";

/**
 * Картка активного боса з перемикачем між босами.
 * Нічого не знає про розмітку: отримує список активних босів і id вибраного.
 * Якщо вибраного боса немає в списку (його переможено), показує першого.
 * `compact`: для низьких екранів, спрайт збоку замість спрайта зверху.
 */
export function BossCard({
  bosses,
  selectedId,
  onSelect,
  compact = false,
}: {
  bosses: Boss[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const first = bosses[0];
  if (!first) return null;

  const boss = bosses.find((b) => b.id === selectedId) ?? first;
  const index = bosses.indexOf(boss);
  const count = bosses.length;
  const def = BOSSES[boss.art];
  const overdue = boss.deadline !== null && boss.deadline < todayLocal();

  function step(delta: number) {
    const target = bosses[(index + delta + count) % count];
    if (target) onSelect(target.id);
  }

  const details = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <span className="flex items-center gap-2">
          <Sprite sprite={ICONS.heart} />
          {boss.hp} / {boss.maxHp}
        </span>
        {boss.deadline && (
          <span className={overdue ? "text-[var(--hp-coral)]" : "opacity-70"}>
            до {formatDay(boss.deadline)}
            {overdue ? " (прострочено)" : ""}
          </span>
        )}
      </div>
      <HpBar
        hp={boss.hp}
        maxHp={boss.maxHp}
        label={`HP боса «${boss.title}»`}
      />
    </>
  );

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

      {compact ? (
        <div className="flex items-center gap-3">
          <Sprite sprite={def.sprite} alt={def.name} className="shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="text-sm break-words">{boss.title}</h2>
            <p className="opacity-70">{def.name}</p>
            {details}
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-sm break-words">{boss.title}</h2>
          <div className="flex flex-col items-center gap-1">
            <Sprite sprite={def.sprite} scale={2} alt={def.name} />
            <p className="opacity-70">{def.name}</p>
          </div>
          {details}
        </>
      )}
    </section>
  );
}
