import type { BossState } from "@questlog/engine";

export function BossCard({
  boss,
  onDismiss,
}: {
  boss: BossState;
  onDismiss: () => void;
}) {
  const percent = Math.round((boss.hp / boss.maxHp) * 100);

  return (
    <section className="pixel-panel flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm">🐉 {boss.title}</h2>
        <span>
          {boss.hp} / {boss.maxHp} HP
        </span>
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
