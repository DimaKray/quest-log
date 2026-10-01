import { ACHIEVEMENTS, type Reward } from "@questlog/engine";

export function describeReward(r: Reward): string {
  switch (r.type) {
    case "xp_gained":
      return `+${r.amount} XP`;
    case "level_up":
      return `Новий рівень: ${r.level}!`;
    case "streak_updated":
      return `Стрик: ${r.streak} дн.`;
    case "boss_damaged":
      return `Удар по босу: −${r.damage} (лишилось ${r.hp})`;
    case "boss_defeated":
      return "Боса переможено!";
    case "achievement_unlocked":
      return `Досягнення: ${ACHIEVEMENTS[r.id].title}`;
  }
}