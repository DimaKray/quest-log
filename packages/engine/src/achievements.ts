import { ACHIEVEMENT_IDS } from './types';
import type { AchievementId, HeroState, Reward, Stats } from './types';

interface AchievementDef {
  title: string;
  description: string;
  check: (hero: HeroState, stats: Stats) => boolean;
}

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  first_quest: {
    title: 'Перший крок',
    description: 'Виконай свій перший квест',
    check: (_h, s) => s.totalQuests >= 1,
  },
  ten_in_a_day: {
    title: 'День-марафон',
    description: 'Виконай 10 квестів за один день',
    check: (_h, s) => s.today.count >= 10,
  },
  streak_7: {
    title: 'Тиждень без пропусків',
    description: 'Стрик 7 днів поспіль',
    check: (h) => h.streak >= 7,
  },
  first_boss: {
    title: 'Мисливець на босів',
    description: 'Переможи свого першого боса',
    check: (_h, s) => s.bossesDefeated >= 1,
  },
  level_10: {
    title: 'Ветеран',
    description: 'Досягни 10 рівня',
    check: (h) => h.level >= 10,
  },
};

export const createStats = (): Stats => ({
  totalQuests: 0,
  bossesDefeated: 0,
  today: { date: null, count: 0 },
  unlocked: [],
});

/** Додає нагороди за щойно розблоковані досягнення. Кожне видається лише раз. */
export function checkAchievements(
  hero: HeroState,
  stats: Stats,
): { stats: Stats; rewards: Reward[] } {
  const rewards: Reward[] = [];
  const unlocked = [...stats.unlocked];

  for (const id of ACHIEVEMENT_IDS) {
    if (!unlocked.includes(id) && ACHIEVEMENTS[id].check(hero, stats)) {
      unlocked.push(id);
      rewards.push({ type: 'achievement_unlocked', id });
    }
  }

  return { stats: { ...stats, unlocked }, rewards };
}