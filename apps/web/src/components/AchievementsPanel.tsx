import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  type AchievementId,
} from "@questlog/engine";
import { BADGES } from "@/assets/registry";
import { Sprite } from "./Sprite";

export function AchievementsPanel({ unlocked }: { unlocked: AchievementId[] }) {
  return (
    <section className="pixel-panel flex flex-col gap-3">
      <h2 className="text-sm">
        Досягнення ({unlocked.length}/{ACHIEVEMENT_IDS.length})
      </h2>
      <ul className="grid grid-cols-3 gap-3">
        {ACHIEVEMENT_IDS.map((id) => {
          const done = unlocked.includes(id);
          const info = ACHIEVEMENTS[id];
          return (
            <li
              key={id}
              title={info.description}
              className={`flex flex-col items-center gap-1 text-center ${
                done ? "" : "opacity-40 grayscale"
              }`}
            >
              <Sprite sprite={BADGES[id]} scale={3} />
              <span className="text-sm leading-tight">{info.title}</span>
              <span className="sr-only">{done ? "відкрито" : "закрито"}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
