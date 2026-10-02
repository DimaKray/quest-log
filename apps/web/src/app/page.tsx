"use client";

import { useRef, useState } from "react";
import type { Difficulty } from "@questlog/engine";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { BossCard } from "@/components/BossCard";
import { HeroPanel } from "@/components/HeroPanel";
import { NewBossForm, type QuestDraft } from "@/components/NewBossForm";
import { QuestPanel } from "@/components/QuestPanel";
import { RewardsPanel } from "@/components/RewardsPanel";
import { Sprite } from "@/components/Sprite";
import {
  LOGO,
  type Avatar,
  type BossArtId,
  type Mood,
} from "@/assets/registry";
import {
  STATE_KEY,
  activeBosses,
  addQuest,
  browserEnv,
  createBossWithQuests,
  finishQuest,
  loadInitialState,
  resetProgress,
  type AppState,
} from "@/lib/appState";
import { todayLocal } from "@/lib/date";
import type { Quest } from "@/lib/types";
import { usePersistentState } from "@/lib/usePersistentState";

export default function Home() {
  // Увесь стан в одному ключі. Якщо його ще немає, loadInitialState
  // підтягне дані зі старих ключів (міграція v1/v2 -> v3).
  const [app, setApp, ready] = usePersistentState<AppState>(
    STATE_KEY,
    loadInitialState,
  );

  const [happy, setHappy] = useState(false);
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);
  const happyTimer = useRef<number | undefined>(undefined);

  if (!ready) return null;

  const { game } = app;
  const { hero } = game;
  const bosses = activeBosses(app);
  const mood: Mood = happy
    ? "happy"
    : hero.lastActiveDate && hero.lastActiveDate !== todayLocal()
      ? "tired"
      : "idle";

  function handleAddQuest(title: string, difficulty: Difficulty) {
    setApp(addQuest(app, { title, difficulty, bossId: null }, browserEnv()));
  }

  function handleCreateBoss(
    title: string,
    drafts: QuestDraft[],
    art: BossArtId,
  ) {
    const next = createBossWithQuests(
      app,
      { title, art, deadline: null, drafts },
      browserEnv(),
    );
    setApp(next);
    // новий бос додається в кінець: одразу показуємо його
    const created = next.bosses[next.bosses.length - 1];
    if (created) setSelectedBossId(created.id);
  }

  function handleFinish(quest: Quest) {
    const res = finishQuest(app, quest.id, browserEnv());
    setApp(res.state);

    // герой радіє пару секунд після виконання квесту
    setHappy(true);
    window.clearTimeout(happyTimer.current);
    happyTimer.current = window.setTimeout(() => setHappy(false), 2500);
  }

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-6 p-4 lg:p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Sprite sprite={LOGO} />
          <h1 className="text-xl">Квест-лог</h1>
        </div>
        <button
          className="pixel-btn opacity-80"
          onClick={() => setApp(resetProgress(app))}
        >
          Скинути прогрес
        </button>
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)_320px] lg:items-start">
        <aside className="contents lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-3rem)] lg:flex-col lg:gap-6 lg:overflow-y-auto lg:pr-2 lg:pb-2">
          <div className="order-1">
            <HeroPanel
              hero={hero}
              totalQuests={game.stats.totalQuests}
              avatar={app.avatar}
              mood={mood}
              onAvatarChange={(avatar: Avatar) => setApp({ ...app, avatar })}
            />
          </div>
          <div className="order-4">
            <AchievementsPanel unlocked={game.stats.unlocked} />
          </div>
        </aside>

        <div className="order-3 lg:order-none">
          <QuestPanel
            quests={app.quests}
            onAdd={handleAddQuest}
            onFinish={handleFinish}
          />
        </div>

        <aside className="contents lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-3rem)] lg:flex-col lg:gap-6 lg:overflow-y-auto lg:pr-2 lg:pb-2">
          <div className="order-2 flex flex-col gap-6">
            {bosses.length > 0 ? (
              <>
                <BossCard
                  bosses={bosses}
                  selectedId={selectedBossId}
                  onSelect={setSelectedBossId}
                />
                <NewBossForm onCreate={handleCreateBoss} />
              </>
            ) : (
              <section className="pixel-panel flex flex-col gap-3">
                <p>
                  Активного боса немає. Розбий велику ціль на кроки й дай їй
                  обличчя.
                </p>
                <NewBossForm onCreate={handleCreateBoss} />
              </section>
            )}
          </div>
          <div className="order-5">
            <RewardsPanel log={app.log} />
          </div>
        </aside>
      </div>
    </main>
  );
}
