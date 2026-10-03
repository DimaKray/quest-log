"use client";

import { useRef, useState } from "react";
import type { Difficulty } from "@questlog/engine";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { ArchiveTab } from "@/components/ArchiveTab";
import { BossCard } from "@/components/BossCard";
import { BossesTab } from "@/components/BossesTab";
import { HeroPanel } from "@/components/HeroPanel";
import type { QuestDraft } from "@/components/NewBossForm";
import { QuestForm } from "@/components/QuestForm";
import { QuestList } from "@/components/QuestList";
import { RewardsPanel } from "@/components/RewardsPanel";
import { Sprite } from "@/components/Sprite";
import { TabBar, type TabDef } from "@/components/TabBar";
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
  completedQuests,
  createBossWithQuests,
  defeatedBosses,
  finishQuest,
  loadInitialState,
  regularQuests,
  resetProgress,
  type AppState,
} from "@/lib/appState";
import { todayLocal } from "@/lib/date";
import type { Quest } from "@/lib/types";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { usePersistentState } from "@/lib/usePersistentState";

type TabId = "quests" | "bosses" | "archive";

export default function Home() {
  // Увесь стан в одному ключі. Якщо його ще немає, loadInitialState
  // підтягне дані зі старих ключів (міграція v1/v2 -> v3).
  const [app, setApp, ready] = usePersistentState<AppState>(
    STATE_KEY,
    loadInitialState,
  );

  const [tab, setTab] = useState<TabId>("quests");
  const [happy, setHappy] = useState(false);
  // який бос зараз показаний у картці (UI-стан, не зберігається)
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);
  const happyTimer = useRef<number | undefined>(undefined);
  // на низьких екранах бічні колонки стискаємо, щоб вони не потребували скролу
  const roomy = useMediaQuery("(min-height: 820px)");

  if (!ready) return null;

  const { game } = app;
  const { hero } = game;
  const bosses = activeBosses(app);
  const allRegular = regularQuests(app);
  const activeRegular = allRegular.filter((q) => !q.done);
  const bossTitleById = Object.fromEntries(
    app.bosses.map((b) => [b.id, b.title]),
  );
  const mood: Mood = happy
    ? "happy"
    : hero.lastActiveDate && hero.lastActiveDate !== todayLocal()
      ? "tired"
      : "idle";

  const tabs: TabDef<TabId>[] = [
    { id: "quests", label: "Квести", count: activeRegular.length },
    { id: "bosses", label: "Боси", count: bosses.length },
    { id: "archive", label: "Архів" },
  ];

  function handleAddQuest(
    title: string,
    difficulty: Difficulty,
    bossId: string | null,
  ) {
    setApp(addQuest(app, { title, difficulty, bossId }, browserEnv()));
    if (bossId) setSelectedBossId(bossId);
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

  function handleReset() {
    if (window.confirm("Скинути весь прогрес? Це не можна скасувати.")) {
      setApp(resetProgress(app));
    }
  }

  /*
   * Десктоп (lg): оболонка рівно на висоту вікна, сторінка не скролиться.
   * Прокручується лише одна зона: список у центральній колонці.
   * Нижче 40rem заввишки оболонка перестає стискатися (запобіжник для
   * дуже низьких вікон: краще скрол сторінки, ніж відрізаний інтерфейс).
   * Мобільний: звичайна одна колонка в порядку order-1…5.
   * `contents` змушує <aside> «зникнути» на мобільному.
   */
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1280px] flex-col gap-4 p-4 lg:h-dvh lg:min-h-[40rem] lg:gap-6 lg:p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {roomy && <Sprite sprite={LOGO} />}
          <h1 className="text-xl">Квест-лог</h1>
        </div>
        <button className="pixel-btn min-h-11 opacity-80" onClick={handleReset}>
          Скинути прогрес
        </button>
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[300px_minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)]">
        <aside className="contents lg:flex lg:min-h-0 lg:flex-col lg:gap-6">
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

        <div className="order-3 flex flex-col gap-4 lg:order-none lg:min-h-0">
          <TabBar tabs={tabs} active={tab} onChange={setTab} />

          {tab === "quests" && <QuestForm onAdd={handleAddQuest} />}
          {tab === "bosses" && bosses.length > 0 && (
            <QuestForm bosses={bosses} onAdd={handleAddQuest} />
          )}

          {/* єдина зона скролу на десктопі */}
          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2 lg:pb-2"
          >
            {tab === "quests" && (
              <QuestList
                quests={activeRegular}
                onFinish={handleFinish}
                emptyText={
                  allRegular.length === 0
                    ? "Квестів ще немає. Додай перший!"
                    : "Усі квести виконано. Час для нового!"
                }
              />
            )}

            {tab === "bosses" && (
              <BossesTab
                bosses={bosses}
                quests={app.quests}
                onFinish={handleFinish}
                onCreateBoss={handleCreateBoss}
              />
            )}

            {tab === "archive" && (
              <ArchiveTab
                defeatedBosses={defeatedBosses(app)}
                completedQuests={completedQuests(app)}
                bossTitleById={bossTitleById}
              />
            )}
          </div>
        </div>

        <aside className="contents lg:flex lg:min-h-0 lg:flex-col lg:gap-6">
          <div className="order-2">
            {bosses.length > 0 ? (
              <BossCard
                bosses={bosses}
                selectedId={selectedBossId}
                onSelect={setSelectedBossId}
                compact={!roomy}
              />
            ) : (
              <section className="pixel-panel flex flex-col gap-3">
                <p>Активних босів немає. Створи першого на вкладці «Боси».</p>
                <button
                  className="pixel-btn min-h-11"
                  onClick={() => setTab("bosses")}
                >
                  До босів
                </button>
              </section>
            )}
          </div>
          <div className="order-5">
            <RewardsPanel log={app.log} limit={roomy ? 3 : 2} />
          </div>
        </aside>
      </div>
    </main>
  );
}
