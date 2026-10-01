import type { Difficulty, GameEvent, HeroState, Reward } from './types';

export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 60,
};

export const createHero = (): HeroState => ({
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
});

/** Скільки XP треба, щоб перейти з рівня `level` на наступний. */
export const xpToNextLevel = (level: number): number =>
  Math.round(100 * Math.pow(level, 1.5));

const MS_PER_DAY = 86_400_000;

/** Різниця в днях між двома датами 'YYYY-MM-DD' (парситься як UTC, тому без проблем з DST). */
export const dayDiff = (from: string, to: string): number =>
  Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);

/**
 * Чиста функція: не мутує вхідний стан, не залежить від БД чи UI.
 * Повертає новий стан і список нагород, який клієнт програє анімаціями.
 */
export function applyEvent(
  state: HeroState,
  event: GameEvent,
): { state: HeroState; rewards: Reward[] } {
  const rewards: Reward[] = [];
  let { xp, level, streak } = state;

  // XP і рівні (цикл, бо за раз можна піднятися на кілька рівнів)
  const gained = XP_BY_DIFFICULTY[event.difficulty];
  rewards.push({ type: 'xp_gained', amount: gained });
  xp += gained;
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    rewards.push({ type: 'level_up', level });
  }

  // Стрик: рахується раз на день
  if (state.lastActiveDate !== event.date) {
    const gap =
      state.lastActiveDate === null
        ? null
        : dayDiff(state.lastActiveDate, event.date);
    streak = gap === 1 ? streak + 1 : 1;
    rewards.push({ type: 'streak_updated', streak });
  }

  return {
    state: { xp, level, streak, lastActiveDate: event.date },
    rewards,
  };
}
