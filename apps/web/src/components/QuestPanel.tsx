"use client";

import { useState } from "react";
import type { Difficulty } from "@questlog/engine";
import { DIFFICULTY_ICON } from "@/assets/registry";
import { DIFFICULTY_LABEL, type Quest } from "@/lib/types";
import { Sprite } from "./Sprite";

export function QuestPanel({
  quests,
  onAdd,
  onFinish,
}: {
  quests: Quest[];
  onAdd: (title: string, difficulty: Difficulty) => void;
  onFinish: (quest: Quest) => void;
}) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  const active = quests.filter((q) => !q.done);
  const done = quests.filter((q) => q.done);

  function submit() {
    const text = title.trim();
    if (!text) return;
    onAdd(text, difficulty);
    setTitle("");
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="pixel-card flex flex-col gap-3 sm:flex-row">
        <input
          className="pixel-input flex-1"
          aria-label="Назва квесту"
          placeholder="Новий квест..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
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

      <div className="flex flex-col gap-3">
        <h2 className="text-sm">Активні квести ({active.length})</h2>
        {active.length === 0 && (
          <p className="pixel-panel text-center opacity-80">
            {quests.length === 0
              ? "Квестів ще немає. Додай перший!"
              : "Усі квести виконано. Час для нового!"}
          </p>
        )}
        {active.map((q) => (
          <div
            key={q.id}
            className="pixel-card flex items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Sprite sprite={DIFFICULTY_ICON[q.difficulty]} scale={2} />
              <div className="min-w-0">
                <div className="break-words">{q.title}</div>
                <div className="opacity-70">
                  {DIFFICULTY_LABEL[q.difficulty]}
                  {q.bossId ? " · ⚔ бос" : ""}
                </div>
              </div>
            </div>
            <button className="pixel-btn shrink-0" onClick={() => onFinish(q)}>
              Виконати
            </button>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm">Виконано ({done.length})</h2>
          {done.map((q) => (
            <div
              key={q.id}
              className="pixel-panel flex items-center gap-3 py-2 opacity-70"
            >
              <Sprite sprite={DIFFICULTY_ICON[q.difficulty]} />
              <span className="min-w-0 break-words line-through">
                {q.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
