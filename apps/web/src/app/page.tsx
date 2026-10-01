"use client";

import { useState } from "react";
import {
  completeQuest,
  createBoss,
  createGame,
  xpToNextLevel,
  type BossState,
  type Difficulty,
  type GameState,
} from "@questlog/engine";
import { BossCard } from "@/components/BossCard";
import { NewBossForm, type QuestDraft } from "@/components/NewBossForm";
import { todayLocal } from "@/lib/date";
import { describeReward } from "@/lib/rewards";
import { DIFFICULTY_LABEL, type Quest } from "@/lib/types";
import { usePersistentState } from "@/lib/usePersistentState";

export default function Home() {
  const [game, setGame, gameReady] = usePersistentState<GameState>(
    "questlog:v1:game",
    createGame,
  );
  const [quests, setQuests, questsReady] = usePersistentState<Quest[]>(
    "questlog:v1:quests",
    () => [],
  );
  const [boss, setBoss, bossReady] = usePersistentState<BossState | null>(
    "questlog:v1:boss",
    () => null,
  );
  // журнал нагород: кожен елемент це один виконаний квест
  const [log, setLog, logReady] = usePersistentState<string[][]>(
    "questlog:v2:log",
    () => [],
  );
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  if (!(gameReady && questsReady && bossReady && logReady)) return null;

  const { hero } = game;
  const need = xpToNextLevel(hero.level);
  const percent = Math.round((hero.xp / need) * 100);

  function addQuest() {
    const text = title.trim();
    if (!text) return;
    setQuests((qs) => [
      { id: crypto.randomUUID(), title: text, difficulty, done: false },
      ...qs,
    ]);
    setTitle("");
  }

  function createBossWithQuests(bossTitle: string, drafts: QuestDraft[]) {
    const id = crypto.randomUUID();
    setBoss(
      createBoss(
        id,
        bossTitle,
        drafts.map((d) => d.difficulty),
      ),
    );
    setQuests((qs) => [
      ...drafts.map((d) => ({
        id: crypto.randomUUID(),
        title: d.title,
        difficulty: d.difficulty,
        done: false,
        bossId: id,
      })),
      ...qs,
    ]);
  }

  function finish(quest: Quest) {
    const target =
      boss && !boss.defeated && quest.bossId === boss.id ? boss : undefined;

    const res = completeQuest(
      game,
      {
        type: "QUEST_COMPLETED",
        difficulty: quest.difficulty,
        date: todayLocal(),
      },
      target,
    );

    setGame(res.game);
    if (res.boss) setBoss(res.boss);
    setQuests((qs) =>
      qs.map((q) => (q.id === quest.id ? { ...q, done: true } : q)),
    );
    setLog((l) => [res.rewards.map(describeReward), ...l].slice(0, 5));
  }

  function reset() {
    setGame(createGame());
    setQuests([]);
    setBoss(null);
    setLog([]);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <h1 className="text-xl">Квест-лог</h1>

      <section className="pixel-panel flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm">Рівень {hero.level}</h2>
          <span>🔥 Стрик: {hero.streak}</span>
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
        <p className="text-base">
          {hero.xp} / {need} XP · виконано квестів: {game.stats.totalQuests}
        </p>
      </section>

      {boss && <BossCard boss={boss} onDismiss={() => setBoss(null)} />}

      {(!boss || boss.defeated) && (
        <NewBossForm onCreate={createBossWithQuests} />
      )}

      <section className="pixel-card flex flex-col gap-3 sm:flex-row">
        <input
          className="pixel-input flex-1"
          placeholder="Новий квест..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addQuest()}
        />
        <select
          className="pixel-input"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        >
          {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>
        <button className="pixel-btn" onClick={addQuest}>
          Додати
        </button>
      </section>

      <section className="flex flex-col gap-3">
        {quests.length === 0 && (
          <p className="text-center opacity-70">
            Квестів ще немає. Додай перший!
          </p>
        )}
        {quests.map((q) => (
          <div
            key={q.id}
            className="pixel-card flex items-center justify-between gap-3"
          >
            <div className={q.done ? "line-through opacity-60" : ""}>
              <div>{q.title}</div>
              <div className="text-base opacity-70">
                {DIFFICULTY_LABEL[q.difficulty]}
                {q.bossId ? " · ⚔ бос" : ""}
              </div>
            </div>
            <button
              className="pixel-btn"
              disabled={q.done}
              onClick={() => finish(q)}
            >
              {q.done ? "Готово" : "Виконати"}
            </button>
          </div>
        ))}
      </section>

      {log.length > 0 && (
        <section className="pixel-panel flex flex-col gap-3">
          <h2 className="text-sm">Нагороди</h2>
          {log.map((group, i) => (
            <ul
              key={i}
              className="flex flex-col gap-1 border-t-4 border-[var(--outline)] pt-2 first:border-t-0 first:pt-0"
            >
              {group.map((line, j) => (
                <li key={j}>{line}</li>
              ))}
            </ul>
          ))}
        </section>
      )}

      <button className="pixel-btn self-start opacity-80" onClick={reset}>
        Скинути прогрес
      </button>
    </main>
  );
}
