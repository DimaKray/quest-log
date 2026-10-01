import { describe, expect, it } from 'vitest';
import { createBoss, hitBoss } from './boss';

describe('createBoss', () => {
  it('HP дорівнює сумі XP усіх квестів', () => {
    const boss = createBoss('b1', 'Дракон', ['easy', 'medium', 'hard']);
    expect(boss.maxHp).toBe(95); // 10 + 25 + 60
    expect(boss.hp).toBe(95);
    expect(boss.defeated).toBe(false);
  });

  it('бос без квестів неможливий', () => {
    expect(() => createBoss('b1', 'Порожній', [])).toThrow();
  });
});

describe('hitBoss', () => {
  it('удар зменшує HP на XP квеста', () => {
    const boss = createBoss('b1', 'Дракон', ['medium', 'hard']);
    const { boss: after, rewards } = hitBoss(boss, 'medium');
    expect(after.hp).toBe(60);
    expect(rewards).toEqual([
      { type: 'boss_damaged', bossId: 'b1', damage: 25, hp: 60 },
    ]);
  });

  it('останній удар перемагає боса', () => {
    const boss = createBoss('b1', 'Слиз', ['easy']);
    const { boss: after, rewards } = hitBoss(boss, 'easy');
    expect(after.hp).toBe(0);
    expect(after.defeated).toBe(true);
    expect(rewards).toContainEqual({ type: 'boss_defeated', bossId: 'b1' });
  });

  it('удар з надлишком не опускає HP нижче нуля', () => {
    const boss = createBoss('b1', 'Слиз', ['easy']); // 10 HP
    const { boss: after, rewards } = hitBoss(boss, 'hard'); // 60 урону
    expect(after.hp).toBe(0);
    expect(rewards[0]).toEqual({
      type: 'boss_damaged',
      bossId: 'b1',
      damage: 10,
      hp: 0,
    });
  });

  it('переможений бос ігнорує удари', () => {
    const boss = createBoss('b1', 'Слиз', ['easy']);
    const dead = hitBoss(boss, 'easy').boss;
    const again = hitBoss(dead, 'hard');
    expect(again.boss).toEqual(dead);
    expect(again.rewards).toEqual([]);
  });

  it('не мутує вхідний стан', () => {
    const boss = Object.freeze(createBoss('b1', 'Дракон', ['hard']));
    expect(() => hitBoss(boss, 'hard')).not.toThrow();
    expect(boss.hp).toBe(60);
  });
});