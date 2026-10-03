import { BOSSES, ICONS, type BossArtId } from "@/assets/registry";
import type { Boss } from "@/lib/appState";
import { formatDay, todayLocal } from "@/lib/date";
import type { Quest } from "@/lib/types";
import { HpBar } from "./HpBar";
import { NewBossForm, type QuestDraft } from "./NewBossForm";
import { QuestRow } from "./QuestRow";
import { Sprite } from "./Sprite";

/** Вкладка «Боси»: кожен активний бос із чеклістом його квестів. */
export function BossesTab({
  bosses,
  quests,
  onFinish,
  onCreateBoss,
}: {
  bosses: Boss[];
  quests: Quest[];
  onFinish: (quest: Quest) => void;
  onCreateBoss: (
    title: string,
    drafts: QuestDraft[],
    art: BossArtId,
    deadline: string | null,
  ) => void;
}) {
  const today = todayLocal();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm">Активні боси ({bosses.length})</h2>
        <NewBossForm onCreate={onCreateBoss} />
      </div>

      {bosses.length === 0 && (
        <p className="pixel-panel text-center opacity-80">
          Активних босів немає. Створи першого!
        </p>
      )}

      {bosses.map((boss) => {
        const mine = quests.filter((q) => q.bossId === boss.id);
        const open = mine.filter((q) => !q.done);
        const done = mine.filter((q) => q.done);
        const def = BOSSES[boss.art];
        const overdue = boss.deadline !== null && boss.deadline < today;

        return (
          <article
            key={boss.id}
            aria-labelledby={`boss-${boss.id}`}
            className="pixel-panel flex flex-col gap-3"
          >
            <div className="flex items-center gap-4">
              <Sprite sprite={def.sprite} alt={def.name} className="shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <h3 id={`boss-${boss.id}`} className="text-sm break-words">
                  {boss.title}
                </h3>
                <p className="opacity-70">{def.name}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Sprite sprite={ICONS.heart} />
                    {boss.hp} / {boss.maxHp}
                  </span>
                  {boss.deadline && (
                    <span
                      className={
                        overdue ? "text-[var(--hp-coral)]" : "opacity-70"
                      }
                    >
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
              </div>
            </div>

            <ul className="flex flex-col gap-2">
              {[...open, ...done].map((q) => (
                <QuestRow key={q.id} quest={q} onFinish={onFinish} compact />
              ))}
            </ul>
            <p className="opacity-70">
              Виконано {done.length} з {mine.length}
            </p>
          </article>
        );
      })}
    </section>
  );
}
