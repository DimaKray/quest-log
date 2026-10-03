import { xpToNextLevel, type HeroState } from "@questlog/engine";
import {
  AVATARS,
  ICONS,
  MOOD_LABEL,
  type Avatar,
  type Mood,
} from "@/assets/registry";
import { Sprite } from "./Sprite";

/** Компактна картка героя: спрайт ліворуч, рівень і XP праворуч. */
export function HeroPanel({
  hero,
  totalQuests,
  avatar,
  mood,
  onAvatarChange,
}: {
  hero: HeroState;
  totalQuests: number;
  avatar: Avatar;
  mood: Mood;
  onAvatarChange: (avatar: Avatar) => void;
}) {
  const need = xpToNextLevel(hero.level);
  const percent = Math.round((hero.xp / need) * 100);
  const def = AVATARS[avatar];

  return (
    <section className="pixel-panel flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <Sprite
          sprite={def.mood[mood]}
          scale={2}
          alt={`${def.label}, ${MOOD_LABEL[mood]}`}
          className="shrink-0"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="flex items-center gap-2 text-sm">
            <Sprite sprite={ICONS.xp} />
            Рівень {hero.level}
          </h2>

          <div
            className="xp-bar"
            role="progressbar"
            aria-label="Досвід героя"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="xp-bar__fill" style={{ width: `${percent}%` }} />
          </div>

          <p>
            {hero.xp} / {need} XP
          </p>
          <p className="flex items-center gap-1">
            <Sprite sprite={ICONS.streak} />
            Стрик: {hero.streak}
          </p>
          <p className="opacity-70">Квестів: {totalQuests}</p>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-2"
        role="group"
        aria-label="Вибір персонажа"
      >
        {(Object.keys(AVATARS) as Avatar[]).map((a) => (
          <button
            key={a}
            className="pixel-btn min-h-11"
            aria-pressed={avatar === a}
            onClick={() => onAvatarChange(a)}
          >
            {AVATARS[a].label}
          </button>
        ))}
      </div>
    </section>
  );
}
