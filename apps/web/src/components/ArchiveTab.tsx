import { BOSSES, DIFFICULTY_ICON } from "@/assets/registry";
import type { Boss } from "@/lib/appState";
import { formatTimestamp } from "@/lib/date";
import { DIFFICULTY_LABEL, type Quest } from "@/lib/types";
import { Limited } from "./Limited";
import { Sprite } from "./Sprite";

/** Вкладка «Архів»: переможені боси та виконані квести (по 7, решта за кнопкою). */
export function ArchiveTab({
  defeatedBosses,
  completedQuests,
  bossTitleById,
}: {
  defeatedBosses: Boss[];
  completedQuests: Quest[];
  /** щоб показувати, до якого боса належав виконаний квест */
  bossTitleById: Record<string, string>;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="pixel-panel flex flex-col gap-3">
        <h2 className="text-sm">Переможені боси ({defeatedBosses.length})</h2>
        {defeatedBosses.length === 0 ? (
          <p className="opacity-70">Тут з&apos;являтимуться переможені боси.</p>
        ) : (
          <Limited items={defeatedBosses}>
            {(shown) => (
              <ul className="flex flex-col gap-3">
                {shown.map((b) => (
                  <li key={b.id} className="flex items-center gap-4">
                    <Sprite
                      sprite={BOSSES[b.art].sprite}
                      alt={BOSSES[b.art].name}
                      className="shrink-0 grayscale"
                    />
                    <div className="min-w-0">
                      <div className="break-words">{b.title}</div>
                      <div className="opacity-70">
                        {BOSSES[b.art].name}
                        {b.defeatedAt
                          ? ` · ${formatTimestamp(b.defeatedAt)}`
                          : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Limited>
        )}
      </div>

      <div className="pixel-panel flex flex-col gap-3">
        <h2 className="text-sm">Виконані квести ({completedQuests.length})</h2>
        {completedQuests.length === 0 ? (
          <p className="opacity-70">Тут з&apos;являться виконані квести.</p>
        ) : (
          <Limited items={completedQuests}>
            {(shown) => (
              <ul className="flex flex-col gap-2">
                {shown.map((q) => (
                  <li key={q.id} className="flex items-center gap-3">
                    <Sprite sprite={DIFFICULTY_ICON[q.difficulty]} />
                    <div className="min-w-0 flex-1">
                      <div className="break-words">{q.title}</div>
                      <div className="opacity-70">
                        {DIFFICULTY_LABEL[q.difficulty]}
                        {q.bossId && bossTitleById[q.bossId]
                          ? ` · ⚔ ${bossTitleById[q.bossId]}`
                          : ""}
                        {q.completedAt
                          ? ` · ${formatTimestamp(q.completedAt)}`
                          : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Limited>
        )}
      </div>
    </section>
  );
}
