import { describe, expect, it } from "vitest";
import type { Reward } from "@questlog/engine";
import { achievementsFromRewards, summarizeRewards, toastDelay } from "./effects";

describe("summarizeRewards", () => {
  it("порожні нагороди: нуль досвіду, рівня немає", () => {
    expect(summarizeRewards([])).toEqual({ xp: 0, levelUp: null });
  });

  it("сумує досвід і ігнорує решту нагород", () => {
    const rewards: Reward[] = [
      { type: "xp_gained", amount: 10 },
      { type: "streak_updated", streak: 3 },
      { type: "achievement_unlocked", id: "first_quest" },
    ];
    expect(summarizeRewards(rewards)).toEqual({ xp: 10, levelUp: null });
  });

  it("при кількох підвищеннях бере останній рівень", () => {
    const rewards: Reward[] = [
      { type: "xp_gained", amount: 60 },
      { type: "level_up", level: 3 },
      { type: "level_up", level: 4 },
    ];
    expect(summarizeRewards(rewards)).toEqual({ xp: 60, levelUp: 4 });
  });
});

describe("achievementsFromRewards", () => {
  it("віддає лише відкриті досягнення, у порядку відкриття", () => {
    const rewards: Reward[] = [
      { type: "xp_gained", amount: 10 },
      { type: "achievement_unlocked", id: "first_quest" },
      { type: "streak_updated", streak: 7 },
      { type: "achievement_unlocked", id: "streak_7" },
    ];
    expect(achievementsFromRewards(rewards)).toEqual(["first_quest", "streak_7"]);
    expect(achievementsFromRewards([{ type: "xp_gained", amount: 5 }])).toEqual([]);
  });
});

describe("toastDelay", () => {
  it("тост чекає, поки закінчаться інші ефекти", () => {
    const defeat = toastDelay({ boss: "defeat", levelUp: false });
    const hit = toastDelay({ boss: "hit", levelUp: false });
    const lvl = toastDelay({ boss: null, levelUp: true });
    const plain = toastDelay({ boss: null, levelUp: false });
    expect(defeat).toBeGreaterThan(hit);
    expect(hit).toBeGreaterThan(plain);
    expect(lvl).toBeGreaterThan(plain);
    expect(plain).toBeGreaterThan(0);
  });
});