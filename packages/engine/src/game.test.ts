import { describe, expect, it } from 'vitest';
import { createBoss } from './boss';
import { completeQuest, createGame } from './game';
import type { BossState, GameEvent, Reward } from './types';
import type { GameState } from './game';

const quest = (date = '2026-10-01', difficulty: GameEvent['difficulty'] = 'easy'): GameEvent => ({
  type: 'QUEST_COMPLETED',
  difficulty,
  date,
});

const unlockedIn = (rewards: Reward[]) =>
  rewards.flatMap((r) => (r.type === 'achievement_unlocked' ? [r.id] : []));

/** Виконує n квестів поспіль в одну дату. */
function doQuests(game: GameState, n: number, date = '2026-10-01') {
  let state = game;
  let last: Reward[] = [];
  for (let i = 0; i < n; i++) {
    const res = completeQuest(state, quest(date));
    state = res.game;
    last = res.rewards;
  }
  return { game: state, rewards: last };
}

describe('completeQuest: досягнення', () => {
  it('перший квест відкриває «first_quest» лише один раз', () => {
    const first = completeQuest(createGame(), quest());
    expect(unlockedIn(first.rewards)).toEqual(['first_quest']);
    expect(first.game.stats.unlocked).toEqual(['first_quest']);

    const second = completeQuest(first.game, quest());
    expect(unlockedIn(second.rewards)).toEqual([]);
  });

  it('рахує загальну кількість квестів', () => {
    const { game } = doQuests(createGame(), 3);
    expect(game.stats.totalQuests).toBe(3);
  });

  it('10 квестів за день відкривають «ten_in_a_day» саме на десятому', () => {
    const nine = doQuests(createGame(), 9);
    expect(nine.game.stats.unlocked).not.toContain('ten_in_a_day');

    const tenth = completeQuest(nine.game, quest());
    expect(unlockedIn(tenth.rewards)).toContain('ten_in_a_day');
  });

  it('лічильник «сьогодні» скидається в новий день', () => {
    const nine = doQuests(createGame(), 9, '2026-10-01');
    const next = completeQuest(nine.game, quest('2026-10-02'));
    expect(next.game.stats.today).toEqual({ date: '2026-10-02', count: 1 });
    expect(next.game.stats.unlocked).not.toContain('ten_in_a_day');
  });

  it('стрик 7 днів відкриває «streak_7»', () => {
    const game = createGame();
    game.hero = { ...game.hero, streak: 6, lastActiveDate: '2026-10-01' };
    const res = completeQuest(game, quest('2026-10-02'));
    expect(res.game.hero.streak).toBe(7);
    expect(unlockedIn(res.rewards)).toContain('streak_7');
  });

  it('10 рівень відкриває «level_10»', () => {
    const game = createGame();
    game.hero = { ...game.hero, level: 10 };
    const res = completeQuest(game, quest());
    expect(unlockedIn(res.rewards)).toContain('level_10');
  });
});

describe('completeQuest: боси', () => {
  it('без боса нагород за боса немає', () => {
    const res = completeQuest(createGame(), quest());
    expect(res.boss).toBeUndefined();
    expect(res.rewards.some((r) => r.type === 'boss_damaged')).toBe(false);
  });

  it('удар по босу повертає оновленого боса й нагороду', () => {
    const boss = createBoss('b1', 'Дракон', ['easy', 'hard']);
    const res = completeQuest(createGame(), quest('2026-10-01', 'easy'), boss);
    expect(res.boss?.hp).toBe(60);
    expect(res.rewards).toContainEqual({
      type: 'boss_damaged',
      bossId: 'b1',
      damage: 10,
      hp: 60,
    });
  });

  it('перемога над босом відкриває «first_boss» і рахує статистику', () => {
    const boss: BossState = createBoss('b1', 'Слиз', ['easy']);
    const res = completeQuest(createGame(), quest(), boss);
    expect(res.boss?.defeated).toBe(true);
    expect(res.rewards).toContainEqual({ type: 'boss_defeated', bossId: 'b1' });
    expect(unlockedIn(res.rewards)).toContain('first_boss');
    expect(res.game.stats.bossesDefeated).toBe(1);
  });
});

describe('completeQuest: чистота', () => {
  it('не мутує вхідний стан', () => {
    const game = createGame();
    Object.freeze(game);
    Object.freeze(game.hero);
    Object.freeze(game.stats);
    Object.freeze(game.stats.today);
    Object.freeze(game.stats.unlocked);
    expect(() => completeQuest(game, quest())).not.toThrow();
    expect(game.stats.totalQuests).toBe(0);
  });
});