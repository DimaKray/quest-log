import { xpToNextLevel, type HeroState } from "@questlog/engine";
import {
  AVATARS,
  ICONS,
  MOOD_LABEL,
  type Avatar,
  type Mood,
} from "@/assets/registry";
import { Sprite } from "./Sprite";

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
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm">
          <Sprite sprite={ICONS.xp} />
          Рівень {hero.level}
        </h2>
        <span className="flex items-center gap-1">
          <Sprite sprite={ICONS.streak} />
          {hero.streak} дн.
        </span>
      </div>

      <div className="flex justify-center py-2">
        <Sprite
          sprite={def.mood[mood]}
          scale={3}
          alt={`${def.label}, ${MOOD_LABEL[mood]}`}
        />
      </div>

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
      <p className="opacity-70">Виконано квестів: {totalQuests}</p>

      <div
        className="grid grid-cols-2 gap-2"
        role="group"
        aria-label="Вибір персонажа"
      >
        {(Object.keys(AVATARS) as Avatar[]).map((a) => (
          <button
            key={a}
            className="pixel-btn"
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
