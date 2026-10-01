import type { BossState } from "@questlog/engine";
import { BOSSES, ICONS, type BossArtId } from "@/assets/registry";
import { Sprite } from "./Sprite";

export function BossCard({
  boss,
  art,
  onDismiss,
}: {
  boss: BossState;
  art: BossArtId;
  onDismiss: () => void;
}) {
  const percent = Math.round((boss.hp / boss.maxHp) * 100);
  const def = BOSSES[art];

  return (
    <section className="pixel-panel flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm">{boss.title}</h2>
        <span className="flex items-center gap-2">
          <Sprite sprite={ICONS.heart} />
          {boss.hp} / {boss.maxHp}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Sprite
          sprite={def.sprite}
          scale={3}
          alt={def.name}
          className={boss.defeated ? "opacity-50 grayscale" : ""}
        />
        <p className="opacity-70">{def.name}</p>
      </div>

      <div
        className="hp-bar"
        role="progressbar"
        aria-label="HP боса"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="hp-bar__fill" style={{ width: `${percent}%` }} />
      </div>

      {boss.defeated && (
        <div className="flex items-center justify-between gap-3">
          <p>🏆 Боса переможено!</p>
          <button className="pixel-btn" onClick={onDismiss}>
            Прибрати
          </button>
        </div>
      )}
    </section>
  );
}
