export function HpBar({
  hp,
  maxHp,
  label,
}: {
  hp: number;
  maxHp: number;
  label: string;
}) {
  const percent = Math.round((hp / maxHp) * 100);
  return (
    <div
      className="hp-bar"
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="hp-bar__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
