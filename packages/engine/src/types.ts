export type Difficulty = 'easy' | 'medium' | 'hard';

export interface HeroState {
  /** XP у межах поточного рівня */
  xp: number;
  level: number;
  streak: number;
  /** 'YYYY-MM-DD' або null, якщо героя ще не було активним */
  lastActiveDate: string | null;
}

export interface BossState {
  id: string;
  title: string;
  maxHp: number;
  hp: number;
  defeated: boolean;
}

export const ACHIEVEMENT_IDS = [
  'first_quest',
  'ten_in_a_day',
  'streak_7',
  'first_boss',
  'level_10',
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

/** Лічильники, з яких обчислюються досягнення. */
export interface Stats {
  totalQuests: number;
  bossesDefeated: number;
  /** Скільки квестів виконано за останню активну дату */
  today: { date: string | null; count: number };
  unlocked: AchievementId[];
}

export type GameEvent = {
  type: 'QUEST_COMPLETED';
  difficulty: Difficulty;
  /** 'YYYY-MM-DD' (дата за часовим поясом користувача) */
  date: string;
};

export type Reward =
  | { type: 'xp_gained'; amount: number }
  | { type: 'level_up'; level: number }
  | { type: 'streak_updated'; streak: number }
  | { type: 'boss_damaged'; bossId: string; damage: number; hp: number }
  | { type: 'boss_defeated'; bossId: string }
  | { type: 'achievement_unlocked'; id: AchievementId };