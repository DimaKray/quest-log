/** Останні нагороди: за замовчуванням три останні виконані квести. */
export function RewardsPanel({
  log,
  limit = 3,
}: {
  log: string[][];
  limit?: number;
}) {
  const recent = log.slice(0, limit);

  return (
    <section className="pixel-panel flex flex-col gap-3">
      <h2 className="text-sm">Нагороди</h2>
      {recent.length === 0 ? (
        <p className="opacity-70">
          Виконай квест, і тут з&apos;являться нагороди.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((group, i) => (
            <ul
              key={i}
              className="flex flex-col gap-1 border-t-4 border-[var(--outline)] pt-2 first:border-t-0 first:pt-0"
            >
              {group.map((line, j) => (
                <li key={j}>{line}</li>
              ))}
            </ul>
          ))}
        </div>
      )}
    </section>
  );
}
