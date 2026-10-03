import { DIFFICULTY_ICON } from "@/assets/registry";
import { DIFFICULTY_LABEL, type Quest } from "@/lib/types";
import { Sprite } from "./Sprite";

/**
 * Один квест у списку. `compact` це рядок без рамки (для чеклістів усередині
 * картки боса); без нього рядок сам є карткою. Виконаний квест без кнопки.
 */
export function QuestRow({
  quest,
  onFinish,
  compact = false,
}: {
  quest: Quest;
  onFinish: (quest: Quest) => void;
  compact?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between gap-3 ${
        compact ? "" : "pixel-card"
      } ${quest.done ? "opacity-60" : ""}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Sprite
          sprite={DIFFICULTY_ICON[quest.difficulty]}
          scale={compact ? 1 : 2}
        />
        <div className="min-w-0">
          <div className={`break-words ${quest.done ? "line-through" : ""}`}>
            {quest.title}
          </div>
          <div className="opacity-70">{DIFFICULTY_LABEL[quest.difficulty]}</div>
        </div>
      </div>

      {quest.done ? (
        <span className="shrink-0" aria-label="Виконано">
          ✓
        </span>
      ) : (
        <button className="pixel-btn shrink-0" onClick={() => onFinish(quest)}>
          Виконати
        </button>
      )}
    </li>
  );
}
