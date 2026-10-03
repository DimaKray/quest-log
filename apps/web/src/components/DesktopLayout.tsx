import type { ReactNode } from "react";
import { LOGO } from "@/assets/registry";
import type { ContentTab, ContentView } from "@/lib/tabs";
import { Sprite } from "./Sprite";
import { TabBar, type TabDef } from "./TabBar";

/**
 * Десктоп: оболонка рівно на висоту вікна, сторінка не скролиться.
 * Прокручується лише одна зона: список у центральній колонці.
 * Нижче 40rem заввишки оболонка перестає стискатися (запобіжник для
 * дуже низьких вікон: краще скрол сторінки, ніж відрізаний інтерфейс).
 * Не знає, що саме показує: усе приходить готовими слотами.
 */
export function DesktopLayout({
  tab,
  onTabChange,
  counts,
  views,
  hero,
  achievements,
  boss,
  rewards,
  showLogo,
  onReset,
}: {
  tab: ContentTab;
  onTabChange: (tab: ContentTab) => void;
  counts: { quests: number; bosses: number };
  views: Record<ContentTab, ContentView>;
  hero: ReactNode;
  achievements: ReactNode;
  boss: ReactNode;
  rewards: ReactNode;
  showLogo: boolean;
  onReset: () => void;
}) {
  const tabs: TabDef<ContentTab>[] = [
    { id: "quests", label: "Квести", count: counts.quests },
    { id: "bosses", label: "Боси", count: counts.bosses },
    { id: "archive", label: "Архів" },
  ];
  const view = views[tab];

  return (
    <main className="mx-auto flex h-dvh min-h-[40rem] max-w-[1280px] flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {showLogo && <Sprite sprite={LOGO} />}
          <h1 className="text-xl">Квест-лог</h1>
        </div>
        <button className="pixel-btn min-h-11 opacity-80" onClick={onReset}>
          Скинути прогрес
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_320px] grid-rows-[minmax(0,1fr)] gap-6">
        <aside className="flex min-h-0 flex-col gap-6">
          {hero}
          {achievements}
        </aside>

        <div className="flex min-h-0 flex-col gap-4">
          <TabBar tabs={tabs} active={tab} onChange={onTabChange} />
          {view.form}
          {/* єдина зона скролу */}
          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-2 pb-2"
          >
            {view.body}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-6">
          {boss}
          {rewards}
        </aside>
      </div>
    </main>
  );
}
