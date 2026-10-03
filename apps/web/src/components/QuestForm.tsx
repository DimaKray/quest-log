"use client";

import { useState } from "react";
import type { Difficulty } from "@questlog/engine";
import type { Boss } from "@/lib/appState";
import { DIFFICULTY_LABEL } from "@/lib/types";

/**
 * Форма додавання квесту.
 * Без `bosses`: звичайний квест (bossId = null).
 * З `bosses`: «режим боса», потрібно вибрати боса зі списку активних.
 */
export function QuestForm({
  bosses = [],
  onAdd,
}: {
  bosses?: Boss[];
  onAdd: (title: string, difficulty: Difficulty, bossId: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [pickedBossId, setPickedBossId] = useState<string | null>(null);

  // вибраний бос може зникнути зі списку (його переможено): тоді беремо першого
  const first = bosses[0];
  const bossId = first
    ? (bosses.find((b) => b.id === pickedBossId) ?? first).id
    : null;

  function submit() {
    const text = title.trim();
    if (!text) return;
    onAdd(text, difficulty, bossId);
    setTitle("");
  }

  return (
    <div className="pixel-card flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <input
        className={`pixel-input min-w-0 ${
          bossId ? "sm:basis-full" : "sm:flex-1 sm:basis-48"
        }`}
        aria-label={bossId ? "Назва кроку" : "Назва квесту"}
        placeholder={bossId ? "Новий крок для боса..." : "Новий квест..."}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      {bossId && (
        <select
          className="pixel-input min-w-0 sm:flex-1"
          aria-label="Бос"
          value={bossId}
          onChange={(e) => setPickedBossId(e.target.value)}
        >
          {bosses.map((b) => (
            <option key={b.id} value={b.id}>
              ⚔ {b.title}
            </option>
          ))}
        </select>
      )}
      <select
        className="pixel-input"
        aria-label="Складність"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
      >
        {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
          <option key={d} value={d}>
            {DIFFICULTY_LABEL[d]}
          </option>
        ))}
      </select>
      <button className="pixel-btn" onClick={submit}>
        Додати
      </button>
    </div>
  );
}
