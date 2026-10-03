import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  type AchievementId,
} from "@questlog/engine";
import { BADGES } from "@/assets/registry";
import { Sprite } from "./Sprite";

/** Досягнення одним рядом іконок; назва й опис у підказці та для скрінрідерів. */
export function AchievementsPanel({ unlocked }: { unlocked: AchievementId[] }) {
  return (
    <section className="pixel-panel flex flex-col gap-3">
      <h2 className="text-sm">
        Досягнення ({unlocked.length}/{ACHIEVEMENT_IDS.length})
      </h2>
      <ul className="flex justify-between gap-2">
        {ACHIEVEMENT_IDS.map((id) => {
          const done = unlocked.includes(id);
          const info = ACHIEVEMENTS[id];
          return (
            <li
              key={id}
              title={`${info.title}: ${info.description}`}
              className={done ? "" : "opacity-40 grayscale"}
            >
              <Sprite sprite={BADGES[id]} scale={2} />
              <span className="sr-only">
                {info.title}: {info.description} (
                {done ? "відкрито" : "закрито"})
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
