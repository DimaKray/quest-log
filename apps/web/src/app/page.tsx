"use client";

import { useEffect, useRef, useState } from "react";
import type { Difficulty } from "@questlog/engine";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import {
  AchievementToasts,
  type ToastEvent,
} from "@/components/AchievementToasts";
import { ArchiveTab } from "@/components/ArchiveTab";
import { BossCard } from "@/components/BossCard";
import { BattlePanel } from "@/components/BattlePanel";
import { BossesTab } from "@/components/BossesTab";
import { DesktopLayout } from "@/components/DesktopLayout";
import { HeroPanel } from "@/components/HeroPanel";
import { MobileLayout } from "@/components/MobileLayout";
import type { QuestDraft } from "@/components/NewBossForm";
import { QuestForm } from "@/components/QuestForm";
import { QuestList } from "@/components/QuestList";
import {
  RewardEffects,
  type LevelUpEvent,
  type XpFloat,
} from "@/components/RewardEffects";
import { RewardsPanel } from "@/components/RewardsPanel";
import { SoundToggle } from "@/components/SoundToggle";
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
import { battleFromRewards, type BattleEvent } from "@/lib/battle";
import { todayLocal } from "@/lib/date";
import {
  achievementsFromRewards,
  summarizeRewards,
  toastDelay,
} from "@/lib/effects";
import {
  SETTINGS_KEY,
  defaultSettings,
  soundOn,
  type Settings,
} from "@/lib/settings";
import { playSound, setSoundEnabled } from "@/lib/sound";
import type { ContentTab, ContentView, TabId } from "@/lib/tabs";
import type { Quest } from "@/lib/types";
import { useClickOrigin } from "@/lib/useClickOrigin";
import { useThemedCursor } from "@/lib/useThemedCursor";
import { useUiSounds } from "@/lib/useUiSounds";
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
  // поточний удар для манга-панелі; лічильник дає кожному удару новий id
  const [battle, setBattle] = useState<BattleEvent | null>(null);
  const battleCount = useRef(0);
  // ефекти для звичайних квестів: вильоти +XP з кнопки та спалах нового рівня
  const [floats, setFloats] = useState<XpFloat[]>([]);
  const [levelUp, setLevelUp] = useState<LevelUpEvent | null>(null);
  const fxCount = useRef(0);
  const getOrigin = useClickOrigin();
  // тости досягнень
  const [toasts, setToasts] = useState<ToastEvent[]>([]);
  const toastCount = useRef(0);
  // налаштування окремо від прогресу: скидання прогресу їх не чіпає
  const [settings, setSettings] = usePersistentState<Settings>(
    SETTINGS_KEY,
    defaultSettings,
  );
  const sound = soundOn(settings);
  useEffect(() => {
    setSoundEnabled(sound);
  }, [sound]);
  useUiSounds();
  useThemedCursor();
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
    playSound("add");
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
    playSound("add");
    // новий бос додається в кінець: одразу показуємо його
    const created = next.bosses[next.bosses.length - 1];
    if (created) setSelectedBossId(created.id);
  }

  function handleFinish(quest: Quest) {
    const res = finishQuest(app, quest.id, browserEnv());
    setApp(res.state);

    // удар по босу: показуємо манга-панель (boss беремо до виконання квесту)
    battleCount.current += 1;
    const strike = battleFromRewards(
      res.rewards,
      app.bosses.find((b) => b.id === quest.bossId),
      app.avatar,
      battleCount.current,
      new Date().getHours(),
    );
    const { xp, levelUp: newLevel } = summarizeRewards(res.rewards);
    if (strike) {
      // звуки удару грає сама манга-панель
      setBattle(strike);
    } else {
      // звичайний квест: «монетка», число +XP з кнопки і, якщо вийшов новий рівень, спалах
      playSound("complete");
      fxCount.current += 1;
      const id = fxCount.current;
      if (xp > 0) {
        const origin = getOrigin();
        setFloats((list) => [
          ...list,
          { id, amount: xp, x: origin.x, y: origin.y },
        ]);
      }
      if (newLevel !== null) setLevelUp({ id, level: newLevel });
    }

    // нові досягнення: тост після інших ефектів, щоб нічого не накрило
    const unlocked = achievementsFromRewards(res.rewards);
    if (unlocked.length > 0) {
      const base = toastDelay({
        boss: strike ? (strike.defeated ? "defeat" : "hit") : null,
        levelUp: !strike && newLevel !== null,
      });
      const fresh = unlocked.map((achievement, i) => ({
        id: (toastCount.current += 1),
        achievement,
        delay: base + i * 0.5,
      }));
      setToasts((list) => [...list, ...fresh]);
    }

    // герой радіє пару секунд після виконання квесту
    setHappy(true);
    window.clearTimeout(happyTimer.current);
    happyTimer.current = window.setTimeout(() => setHappy(false), 2500);
  }

  function handleToggleSound() {
    const next = !sound;
    setSettings({ sound: next });
    setSoundEnabled(next);
    if (next) playSound("click"); // відгук, що звук увімкнено
  }

  function handleReset() {
    if (window.confirm("Скинути весь прогрес? Це не можна скасувати.")) {
      setApp(resetProgress(app));
      playSound("reset");
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
  const toolbar = <SoundToggle enabled={sound} onToggle={handleToggleSound} />;

  const layout = isDesktop ? (
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
      toolbar={toolbar}
      onReset={handleReset}
    />
  ) : (
    <MobileLayout
      tab={activeTab}
      onTabChange={setTab}
      counts={counts}
      views={views}
      hero={heroPanel}
      achievements={achievements}
      rewards={<RewardsPanel log={app.log} limit={5} />}
      toolbar={toolbar}
      onReset={handleReset}
    />
  );

  return (
    <>
      {layout}
      <BattlePanel event={battle} onDone={() => setBattle(null)} />
      <RewardEffects
        floats={floats}
        levelUp={levelUp}
        onFloatDone={(id) =>
          setFloats((list) => list.filter((f) => f.id !== id))
        }
        onLevelUpDone={() => setLevelUp(null)}
      />
      <AchievementToasts
        toasts={toasts}
        onDone={(id) => setToasts((list) => list.filter((t) => t.id !== id))}
      />
    </>
  );
}
