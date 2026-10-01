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
  | { type: 'boss_defeated'; bossId: string };