import type { ReactNode } from "react";

/** Вкладки, що є на обох розкладках. */
export type ContentTab = "quests" | "bosses" | "archive";

/** На мобільному додається вкладка «Герой». */
export type TabId = ContentTab | "hero";

/** Вміст вкладки: форма (закріплена над списком на десктопі) і сам список. */
export interface ContentView {
  form: ReactNode;
  body: ReactNode;
}