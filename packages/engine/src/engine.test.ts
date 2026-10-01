import { describe, expect, it } from 'vitest';
import {
  applyEvent,
  createHero,
  dayDiff,
  xpToNextLevel,
  XP_BY_DIFFICULTY,
} from './engine';
import type { GameEvent, HeroState } from './types';

const done = (difficulty: GameEvent['difficulty'], date: string): GameEvent => ({
  type: 'QUEST_COMPLETED',
  difficulty,
  date,
});

describe('createHero', () => {
  it('стартує з рівня 1 без XP і стрику', () => {
    expect(createHero()).toEqual({
      xp: 0,
      level: 1,
      streak: 0,
      lastActiveDate: null,
    });
  });
});

describe('XP', () => {
  it('легка задача дає 10 XP', () => {
    const { state, rewards } = applyEvent(createHero(), done('easy', '2026-10-01'));
    expect(state.xp).toBe(XP_BY_DIFFICULTY.easy);
    expect(rewards).toContainEqual({ type: 'xp_gained', amount: 10 });
  });

  it('складніша задача дає більше XP', () => {
    expect(XP_BY_DIFFICULTY.hard).toBeGreaterThan(XP_BY_DIFFICULTY.medium);
    expect(XP_BY_DIFFICULTY.medium).toBeGreaterThan(XP_BY_DIFFICULTY.easy);
  });
});

describe('рівні', () => {
  it('перехід через поріг піднімає рівень, залишок XP переноситься', () => {
    const need = xpToNextLevel(1); // 100
    const hero: HeroState = { ...createHero(), xp: need - 5 };
    const { state, rewards } = applyEvent(hero, done('easy', '2026-10-01'));
    expect(state.level).toBe(2);
    expect(state.xp).toBe(5); // (need - 5) + 10 - need
    expect(rewards).toContainEqual({ type: 'level_up', level: 2 });
  });

  it('точно на порозі теж піднімає рівень з xp = 0', () => {
    const hero: HeroState = { ...createHero(), xp: xpToNextLevel(1) - 10 };
    const { state } = applyEvent(hero, done('easy', '2026-10-01'));
    expect(state.level).toBe(2);
    expect(state.xp).toBe(0);
  });

  it('великий запас XP піднімає одразу кілька рівнів і дає окрему нагороду на кожен', () => {
    // Стан "з боргом" (наприклад, після зміни правил гри): 400 XP на рівні 1.
    const hero: HeroState = { ...createHero(), xp: 400 };
    const { state, rewards } = applyEvent(hero, done('easy', '2026-10-01'));
    // 410 - 100 (рівень 1) = 310; 310 - 283 (рівень 2) = 27 -> рівень 3
    expect(state.level).toBe(3);
    expect(state.xp).toBe(27);
    expect(rewards.filter((r) => r.type === 'level_up')).toEqual([
      { type: 'level_up', level: 2 },
      { type: 'level_up', level: 3 },
    ]);
  });

  it('xpToNextLevel зростає з рівнем', () => {
    expect(xpToNextLevel(2)).toBeGreaterThan(xpToNextLevel(1));
    expect(xpToNextLevel(10)).toBeGreaterThan(xpToNextLevel(5));
  });
});

describe('стрик', () => {
  it('перша задача починає стрик з 1', () => {
    const { state, rewards } = applyEvent(createHero(), done('easy', '2026-10-01'));
    expect(state.streak).toBe(1);
    expect(rewards).toContainEqual({ type: 'streak_updated', streak: 1 });
  });

  it('друга задача в той самий день не збільшує стрик', () => {
    const first = applyEvent(createHero(), done('easy', '2026-10-01'));
    const second = applyEvent(first.state, done('easy', '2026-10-01'));
    expect(second.state.streak).toBe(1);
    expect(second.rewards.some((r) => r.type === 'streak_updated')).toBe(false);
  });

  it('задача наступного дня продовжує стрик', () => {
    const d1 = applyEvent(createHero(), done('easy', '2026-10-01'));
    const d2 = applyEvent(d1.state, done('easy', '2026-10-02'));
    expect(d2.state.streak).toBe(2);
  });

  it('пропуск дня скидає стрик до 1', () => {
    const d1 = applyEvent(createHero(), done('easy', '2026-10-01'));
    const d3 = applyEvent(d1.state, done('easy', '2026-10-03'));
    expect(d3.state.streak).toBe(1);
  });

  it('працює на межі місяців і року', () => {
    const a = applyEvent(createHero(), done('easy', '2026-12-31'));
    const b = applyEvent(a.state, done('easy', '2027-01-01'));
    expect(b.state.streak).toBe(2);
  });

  it('dayDiff коректний при переході на літній час', () => {
    expect(dayDiff('2026-03-28', '2026-03-29')).toBe(1);
    expect(dayDiff('2026-03-29', '2026-03-30')).toBe(1);
  });
});

describe('чистота функції', () => {
  it('не мутує вхідний стан', () => {
    const hero = Object.freeze(createHero());
    expect(() => applyEvent(hero, done('hard', '2026-10-01'))).not.toThrow();
    expect(hero).toEqual(createHero());
  });
});
