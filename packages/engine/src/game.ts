import { applyEvent, createHero } from './engine';
import { hitBoss } from './boss';
import { checkAchievements, createStats } from './achievements';
import type { BossState, GameEvent, HeroState, Reward, Stats } from './types';

export interface GameState {
  hero: HeroState;
  stats: Stats;
}

export const createGame = (): GameState => ({
  hero: createHero(),
  stats: createStats(),
});

/**
 * Єдина точка входу для «квест виконано»: герой, (опційно) бос, статистика
 * та досягнення. Саме її викликатиме бекенд, а клієнт покаже нагороди.
 */
export function completeQuest(
  game: GameState,
  event: GameEvent,
  boss?: BossState,
): { game: GameState; boss: BossState | undefined; rewards: Reward[] } {
  const heroResult = applyEvent(game.hero, event);
  const rewards: Reward[] = [...heroResult.rewards];

  let nextBoss = boss;
  if (boss) {
    const bossResult = hitBoss(boss, event.difficulty);
    nextBoss = bossResult.boss;
    rewards.push(...bossResult.rewards);
  }

  const defeatedNow = rewards.some((r) => r.type === 'boss_defeated');
  const sameDay = game.stats.today.date === event.date;
  const statsBefore: Stats = {
    ...game.stats,
    totalQuests: game.stats.totalQuests + 1,
    bossesDefeated: game.stats.bossesDefeated + (defeatedNow ? 1 : 0),
    today: {
      date: event.date,
      count: sameDay ? game.stats.today.count + 1 : 1,
    },
  };

  const achievements = checkAchievements(heroResult.state, statsBefore);
  rewards.push(...achievements.rewards);

  return {
    game: { hero: heroResult.state, stats: achievements.stats },
    boss: nextBoss,
    rewards,
  };
}