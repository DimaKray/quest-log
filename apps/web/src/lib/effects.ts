import type { AchievementId, Reward } from "@questlog/engine";

export interface RewardSummary {
  /** загальний досвід за квест */
  xp: number;
  /** новий рівень, якщо квест його підняв (останній, якщо піднявся на кілька) */
  levelUp: number | null;
}

/** Зводить нагороди до того, що показують вильоти «+XP» та спалах рівня. */
export function summarizeRewards(rewards: Reward[]): RewardSummary {
  let xp = 0;
  let levelUp: number | null = null;
  for (const r of rewards) {
    if (r.type === "xp_gained") xp += r.amount;
    if (r.type === "level_up") levelUp = r.level;
  }
  return { xp, levelUp };
}

/** Досягнення, відкриті цим квестом, у порядку відкриття. */
export function achievementsFromRewards(rewards: Reward[]): AchievementId[] {
  return rewards.flatMap((r) => (r.type === "achievement_unlocked" ? [r.id] : []));
}

/**
 * Через скільки секунд показати тост досягнення, щоб він не накрив
 * інші ефекти: манга-панель (2,1 с, з перемогою 3,1 с) або банер рівня (2 с).
 */
export function toastDelay(opts: { boss: "hit" | "defeat" | null; levelUp: boolean }): number {
  if (opts.boss === "defeat") return 3.1;
  if (opts.boss === "hit") return 2.1;
  return opts.levelUp ? 2.0 : 0.6;
}