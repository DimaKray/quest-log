import type { ReactNode } from "react";
import { TAB_ICONS } from "@/assets/registry";
import type { ContentTab, ContentView, TabId } from "@/lib/tabs";
import { TabBar, type TabDef } from "./TabBar";

/**
 * Мобільний: один екран за раз і нижня панель вкладок.
 * Прокручується лише сам екран (сторінка); панель закріплена знизу
 * й враховує safe-area. Вкладка «Герой» збирає героя, досягнення й нагороди.
 */
export function MobileLayout({
  tab,
  onTabChange,
  counts,
  views,
  hero,
  achievements,
  rewards,
  onReset,
}: {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  counts: { quests: number; bosses: number };
  views: Record<ContentTab, ContentView>;
  hero: ReactNode;
  achievements: ReactNode;
  rewards: ReactNode;
  onReset: () => void;
}) {
  const tabs: TabDef<TabId>[] = [
    { id: "hero", label: "Герой", icon: TAB_ICONS.hero },
    {
      id: "quests",
      label: "Квести",
      count: counts.quests,
      icon: TAB_ICONS.quests,
    },
    {
      id: "bosses",
      label: "Боси",
      count: counts.bosses,
      icon: TAB_ICONS.bosses,
    },
    { id: "archive", label: "Архів", icon: TAB_ICONS.archive },
  ];

  function change(id: TabId) {
    onTabChange(id);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <h1 className="text-xl">Квест-лог</h1>

        <div
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          className="flex flex-col gap-6"
        >
          {tab === "hero" ? (
            <>
              {hero}
              {achievements}
              {rewards}
              <button
                className="pixel-btn min-h-11 self-start opacity-80"
                onClick={onReset}
              >
                Скинути прогрес
              </button>
            </>
          ) : (
            <>
              {views[tab].form}
              {views[tab].body}
            </>
          )}
        </div>
      </main>

      <TabBar variant="bottom" tabs={tabs} active={tab} onChange={change} />
    </>
  );
}
