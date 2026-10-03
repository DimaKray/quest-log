"use client";

import { useRef, useState } from "react";
import type { Difficulty } from "@questlog/engine";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { ArchiveTab } from "@/components/ArchiveTab";
import { BossCard } from "@/components/BossCard";
import { BossesTab } from "@/components/BossesTab";
import { DesktopLayout } from "@/components/DesktopLayout";
import { HeroPanel } from "@/components/HeroPanel";
import { MobileLayout } from "@/components/MobileLayout";
import type { QuestDraft } from "@/components/NewBossForm";
import { QuestForm } from "@/components/QuestForm";
import { QuestList } from "@/components/QuestList";
import { RewardsPanel } from "@/components/RewardsPanel";
import type { Avatar, BossArtId, Mood } from "@/assets/registry";
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
import type { ContentTab, ContentView, TabId } from "@/lib/tabs";
import type { Quest } from "@/lib/types";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { usePersistentState } from "@/lib/usePersistentState";

export default function Home() {
  // Увесь стан в одному ключі. Якщо його ще немає, loadInitialState
  // підтягне дані зі старих ключів (міграція v1/v2 -> v3).
  const [app, setApp, ready] = usePersistentState<AppState>(
    STATE_KEY,
    loadInitialState,
  );

  // Один стан вкладки керує і вкладками десктопа, і нижньою панеллю мобільного.
  // null = користувач ще не вибирав: на мобільному головна це «Герой», на ПК «Квести».
  const [tab, setTab] = useState<TabId | null>(null);
  const [happy, setHappy] = useState(false);
  // який бос зараз показаний у картці (UI-стан, не зберігається)
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);
  const happyTimer = useRef<number | undefined>(undefined);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // на низьких екранах бічні колонки стискаємо, щоб вони не потребували скролу
  const roomy = useMediaQuery("(min-height: 820px)");
  const activeTab: TabId = tab ?? (isDesktop ? "quests" : "hero");

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
    deadline: string | null,
  ) {
    const next = createBossWithQuests(
      app,
      { title, art, deadline, drafts },
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

  // Вміст вкладок: спільний для обох розкладок, розкладка лише розставляє.
  const views: Record<ContentTab, ContentView> = {
    quests: {
      form: <QuestForm onAdd={handleAddQuest} />,
      body: (
        <QuestList
          quests={activeRegular}
          onFinish={handleFinish}
          emptyText={
            allRegular.length === 0
              ? "Квестів ще немає. Додай перший!"
              : "Усі квести виконано. Час для нового!"
          }
        />
      ),
    },
    bosses: {
      form:
        bosses.length > 0 ? (
          <QuestForm bosses={bosses} onAdd={handleAddQuest} />
        ) : null,
      body: (
        <BossesTab
          bosses={bosses}
          quests={app.quests}
          onFinish={handleFinish}
          onCreateBoss={handleCreateBoss}
        />
      ),
    },
    archive: {
      form: null,
      body: (
        <ArchiveTab
          defeatedBosses={defeatedBosses(app)}
          completedQuests={completedQuests(app)}
          bossTitleById={bossTitleById}
        />
      ),
    },
  };

  const counts = { quests: activeRegular.length, bosses: bosses.length };

  const heroPanel = (
    <HeroPanel
      hero={hero}
      totalQuests={game.stats.totalQuests}
      avatar={app.avatar}
      mood={mood}
      onAvatarChange={(avatar: Avatar) => setApp({ ...app, avatar })}
    />
  );
  const achievements = <AchievementsPanel unlocked={game.stats.unlocked} />;

  if (isDesktop) {
    return (
      <DesktopLayout
        // «Герой» є лише на мобільному: на десктопі герой завжди ліворуч
        tab={activeTab === "hero" ? "quests" : activeTab}
        onTabChange={setTab}
        counts={counts}
        views={views}
        hero={heroPanel}
        achievements={achievements}
        boss={
          bosses.length > 0 ? (
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
          )
        }
        rewards={<RewardsPanel log={app.log} limit={roomy ? 3 : 2} />}
        showLogo={roomy}
        onReset={handleReset}
      />
    );
  }

  return (
    <MobileLayout
      tab={activeTab}
      onTabChange={setTab}
      counts={counts}
      views={views}
      hero={heroPanel}
      achievements={achievements}
      rewards={<RewardsPanel log={app.log} limit={5} />}
      onReset={handleReset}
    />
  );
}
