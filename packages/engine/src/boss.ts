import { XP_BY_DIFFICULTY } from './engine';
import type { BossState, Difficulty, Reward } from './types';

/** HP боса = сума XP усіх його квестів. */
export function createBoss(
  id: string,
  title: string,
  quests: Difficulty[],
): BossState {
  if (quests.length === 0) {
    throw new Error('Boss needs at least one quest');
  }
  const maxHp = quests.reduce((sum, d) => sum + XP_BY_DIFFICULTY[d], 0);
  return { id, title, maxHp, hp: maxHp, defeated: false };
}

/**
 * Удар по босу за виконаний квест. Чиста функція: повертає новий стан
 * і список нагород. Переможений бос ударів більше не приймає.
 */
export function hitBoss(
  boss: BossState,
  difficulty: Difficulty,
): { boss: BossState; rewards: Reward[] } {
  if (boss.defeated) return { boss, rewards: [] };

  const damage = Math.min(XP_BY_DIFFICULTY[difficulty], boss.hp);
  const hp = boss.hp - damage;
  const defeated = hp === 0;

  const rewards: Reward[] = [
    { type: 'boss_damaged', bossId: boss.id, damage, hp },
  ];
  if (defeated) rewards.push({ type: 'boss_defeated', bossId: boss.id });

  return { boss: { ...boss, hp, defeated }, rewards };
}