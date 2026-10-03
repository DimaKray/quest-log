import type { Quest } from "@/lib/types";
import { QuestRow } from "./QuestRow";

/** Список активних квестів. Без обмеження довжини: активні завжди видно всі. */
export function QuestList({
  quests,
  onFinish,
  emptyText,
  title = "Активні квести",
}: {
  quests: Quest[];
  onFinish: (quest: Quest) => void;
  emptyText: string;
  title?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm">
        {title} ({quests.length})
      </h2>
      {quests.length === 0 ? (
        <p className="pixel-panel text-center opacity-80">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {quests.map((q) => (
            <QuestRow key={q.id} quest={q} onFinish={onFinish} />
          ))}
        </ul>
      )}
    </section>
  );
}
