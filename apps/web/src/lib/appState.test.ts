import { describe, expect, it } from "vitest";
import { XP_BY_DIFFICULTY } from "@questlog/engine";
import {
  activeBosses,
  addQuest,
  createBossWithQuests,
  createInitialState,
  finishQuest,
  migrateLegacy,
  resetProgress,
  type AppState,
  type Env,
} from "./appState";

// ───────── допоміжне ─────────

let counter = 0;
const env = (today = "2026-10-01"): Env => ({
  newId: () => `id${++counter}`,
  now: `${today}T10:00:00.000Z`,
  today,
});

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Головний інваріант: hp боса = сума XP його невиконаних квестів. */
function expectBossInvariant(state: AppState) {
  for (const boss of state.bosses) {
    const mine = state.quests.filter((q) => q.bossId === boss.id);
    expect(boss.maxHp).toBe(sum(mine.map((q) => XP_BY_DIFFICULTY[q.difficulty])));
    expect(boss.hp).toBe(
      sum(mine.filter((q) => !q.done).map((q) => XP_BY_DIFFICULTY[q.difficulty])),
    );
    expect(boss.defeated).toBe(boss.hp === 0);
  }
}

function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);
  for (const v of Object.values(obj as object)) {
    if (typeof v === "object" && v !== null && !Object.isFrozen(v)) deepFreeze(v);
  }
  return obj;
}

const drafts = (...d: ("easy" | "medium" | "hard")[]) =>
  d.map((difficulty, i) => ({ title: `крок ${i + 1}`, difficulty }));

function withBoss(state = createInitialState(), ...d: ("easy" | "medium" | "hard")[]) {
  return createBossWithQuests(
    state,
    { title: "Диплом", art: "thesis_owl", deadline: "2026-12-15", drafts: drafts(...d) },
    env(),
  );
}

// ───────── дії ─────────

describe("addQuest", () => {
  it("додає звичайний квест на початок списку", () => {
    let s = createInitialState();
    s = addQuest(s, { title: "A", difficulty: "easy", bossId: null }, env());
    s = addQuest(s, { title: "B", difficulty: "hard", bossId: null }, env());
    expect(s.quests.map((q) => q.title)).toEqual(["B", "A"]);
    expect(s.quests[0]).toMatchObject({ bossId: null, done: false, completedAt: null });
    expect(s.bosses).toEqual([]);
  });

  it("квест для боса збільшує його HP і максимум", () => {
    let s = withBoss(createInitialState(), "medium"); // 25
    const bossId = s.bosses[0]!.id;
    s = addQuest(s, { title: "ще крок", difficulty: "hard", bossId }, env());
    expect(s.bosses[0]).toMatchObject({ maxHp: 85, hp: 85 });
    expect(s.quests[0]!.bossId).toBe(bossId);
    expectBossInvariant(s);
  });

  it("не дозволяє додати квест до переможеного або неіснуючого боса", () => {
    let s = withBoss(createInitialState(), "easy");
    const bossId = s.bosses[0]!.id;
    s = finishQuest(s, s.quests[0]!.id, env()).state; // бос переможений
    expect(s.bosses[0]!.defeated).toBe(true);
    expect(() => addQuest(s, { title: "x", difficulty: "easy", bossId }, env())).toThrow();
    expect(() =>
      addQuest(s, { title: "x", difficulty: "easy", bossId: "немає" }, env()),
    ).toThrow();
  });
});

describe("createBossWithQuests", () => {
  it("створює боса з HP з квестів і прив'язує квести", () => {
    const s = withBoss(createInitialState(), "easy", "medium", "hard");
    const boss = s.bosses[0]!;
    expect(boss).toMatchObject({
      title: "Диплом",
      art: "thesis_owl",
      deadline: "2026-12-15",
      maxHp: 95,
      hp: 95,
      defeated: false,
      defeatedAt: null,
    });
    expect(s.quests).toHaveLength(3);
    expect(s.quests.every((q) => q.bossId === boss.id)).toBe(true);
    expectBossInvariant(s);
  });

  it("можна мати кілька босів; activeBosses віддає лише активних", () => {
    let s = withBoss(createInitialState(), "easy");
    s = withBoss(s, "hard", "hard");
    expect(s.bosses).toHaveLength(2);
    expect(activeBosses(s)).toHaveLength(2);
    s = finishQuest(s, s.quests.find((q) => q.bossId === s.bosses[0]!.id)!.id, env()).state;
    expect(activeBosses(s).map((b) => b.id)).toEqual([s.bosses[1]!.id]);
  });
});

describe("finishQuest", () => {
  it("звичайний квест нараховує XP і не чіпає босів", () => {
    let s = withBoss(createInitialState(), "hard");
    s = addQuest(s, { title: "чай", difficulty: "easy", bossId: null }, env());
    const hpBefore = s.bosses[0]!.hp;
    const res = finishQuest(s, s.quests[0]!.id, env());
    expect(res.state.game.hero.xp).toBe(10);
    expect(res.state.bosses[0]!.hp).toBe(hpBefore);
    expect(res.state.quests[0]).toMatchObject({
      done: true,
      completedAt: "2026-10-01T10:00:00.000Z",
    });
    expect(res.rewards).toContainEqual({ type: "xp_gained", amount: 10 });
    expectBossInvariant(res.state);
  });

  it("удар отримує лише бос, до якого належить квест", () => {
    let s = withBoss(createInitialState(), "easy", "medium"); // бос A
    s = withBoss(s, "hard", "hard"); // бос B
    const [a, b] = s.bosses;
    const questOfA = s.quests.find((q) => q.bossId === a!.id && q.difficulty === "medium")!;
    const res = finishQuest(s, questOfA.id, env());
    expect(res.state.bosses[0]!.hp).toBe(a!.hp - 25);
    expect(res.state.bosses[1]!.hp).toBe(b!.hp);
    expectBossInvariant(res.state);
  });

  it("останній квест перемагає боса: архівний час, нагороди, досягнення", () => {
    let s = withBoss(createInitialState(), "easy", "medium");
    for (const q of [...s.quests]) {
      s = finishQuest(s, q.id, env("2026-10-02")).state;
    }
    expect(s.bosses[0]).toMatchObject({
      hp: 0,
      defeated: true,
      defeatedAt: "2026-10-02T10:00:00.000Z",
    });
    expect(s.game.stats.bossesDefeated).toBe(1);
    expect(s.game.stats.unlocked).toContain("first_boss");
    expectBossInvariant(s);
  });

  it("повторне виконання або невідомий id нічого не міняє", () => {
    let s = addQuest(createInitialState(), { title: "A", difficulty: "easy", bossId: null }, env());
    const id = s.quests[0]!.id;
    s = finishQuest(s, id, env()).state;
    const again = finishQuest(s, id, env());
    expect(again.state).toBe(s);
    expect(again.rewards).toEqual([]);
    expect(finishQuest(s, "немає", env()).state).toBe(s);
  });

  it("журнал нагород обмежений п'ятьма записами, найновіший перший", () => {
    let s = createInitialState();
    for (let i = 0; i < 7; i++) {
      s = addQuest(s, { title: `q${i}`, difficulty: "easy", bossId: null }, env());
      s = finishQuest(s, s.quests[0]!.id, env()).state;
    }
    expect(s.log).toHaveLength(5);
    expect(s.log[0]).toContain("+10 XP");
  });

  it("не мутує вхідний стан", () => {
    let s = withBoss(createInitialState(), "easy", "hard");
    s = addQuest(s, { title: "x", difficulty: "easy", bossId: null }, env());
    deepFreeze(s);
    expect(() => finishQuest(s, s.quests[0]!.id, env())).not.toThrow();
    expect(() => addQuest(s, { title: "y", difficulty: "easy", bossId: null }, env())).not.toThrow();
  });
});

describe("resetProgress", () => {
  it("стирає прогрес, але лишає вибраного персонажа", () => {
    let s = withBoss(createInitialState(), "easy");
    s = { ...s, avatar: "heroine" };
    s = finishQuest(s, s.quests[0]!.id, env()).state;
    const fresh = resetProgress(s);
    expect(fresh).toEqual({ ...createInitialState(), avatar: "heroine" });
  });
});

// ───────── міграція зі старих ключів ─────────

const reader = (data: Record<string, unknown>) => (key: string) =>
  key in data ? JSON.stringify(data[key]) : null;

const NOW = "2026-10-02T09:00:00.000Z";

const legacyGame = {
  hero: { xp: 30, level: 2, streak: 3, lastActiveDate: "2026-10-01" },
  stats: {
    totalQuests: 5,
    bossesDefeated: 0,
    today: { date: "2026-10-01", count: 2 },
    unlocked: ["first_quest"],
  },
};

describe("migrateLegacy", () => {
  it("повертає null, якщо старих даних немає (новий користувач)", () => {
    expect(migrateLegacy(() => null, NOW)).toBeNull();
  });

  it("переносить героя, квести, активного боса, персонажа та журнал", () => {
    const state = migrateLegacy(
      reader({
        "questlog:v1:game": legacyGame,
        "questlog:v1:quests": [
          { id: "q1", title: "крок", difficulty: "hard", done: false, bossId: "b1" },
          { id: "q2", title: "чай", difficulty: "easy", done: true },
        ],
        "questlog:v1:boss": { id: "b1", title: "Диплом", maxHp: 60, hp: 60, defeated: false },
        "questlog:v1:bossArt": "gym_ogre",
        "questlog:v1:avatar": "heroine",
        "questlog:v2:log": [["+10 XP"], ["+60 XP", "Боса переможено!"]],
      }),
      NOW,
    )!;

    expect(state.version).toBe(3);
    expect(state.game).toEqual(legacyGame);
    expect(state.avatar).toBe("heroine");
    expect(state.log).toEqual([["+10 XP"], ["+60 XP", "Боса переможено!"]]);
    expect(state.bosses).toEqual([
      {
        id: "b1",
        title: "Диплом",
        maxHp: 60,
        hp: 60,
        defeated: false,
        art: "gym_ogre",
        deadline: null,
        createdAt: NOW,
        defeatedAt: null,
      },
    ]);
    expect(state.quests).toEqual([
      { id: "q1", title: "крок", difficulty: "hard", done: false, bossId: "b1", completedAt: null },
      { id: "q2", title: "чай", difficulty: "easy", done: true, bossId: null, completedAt: null },
    ]);
    expectBossInvariant(state);
  });

  it("квести «прибраного» боса стають звичайними", () => {
    const state = migrateLegacy(
      reader({
        "questlog:v1:game": legacyGame,
        "questlog:v1:quests": [
          { id: "q1", title: "старий крок", difficulty: "easy", done: true, bossId: "давно-прибраний" },
        ],
        "questlog:v1:boss": null,
      }),
      NOW,
    )!;
    expect(state.bosses).toEqual([]);
    expect(state.quests[0]!.bossId).toBeNull();
  });

  it("переможений, але не прибраний бос лишається в списку як переможений", () => {
    const state = migrateLegacy(
      reader({
        "questlog:v1:game": legacyGame,
        "questlog:v1:quests": [
          { id: "q1", title: "крок", difficulty: "easy", done: true, bossId: "b1" },
        ],
        "questlog:v1:boss": { id: "b1", title: "Слиз", maxHp: 10, hp: 0, defeated: true },
        "questlog:v1:bossArt": "slime_sleepy",
      }),
      NOW,
    )!;
    expect(state.bosses[0]).toMatchObject({ defeated: true, art: "slime_sleepy" });
    expect(activeBosses(state)).toEqual([]);
    expectBossInvariant(state);
  });

  it("ігнорує пошкоджені дані й невідомий вигляд боса", () => {
    const read = (key: string) =>
      ({
        "questlog:v1:game": "{ це не json",
        "questlog:v1:quests": JSON.stringify([
          { id: 1, title: "зламаний" },
          { id: "q1", title: "цілий", difficulty: "easy", done: false },
        ]),
        "questlog:v1:boss": JSON.stringify({ id: "b1", title: "Бос", maxHp: 10, hp: 10, defeated: false }),
        "questlog:v1:bossArt": JSON.stringify("не-існує"),
        "questlog:v2:log": JSON.stringify("не масив"),
      })[key] ?? null;

    const state = migrateLegacy(read, NOW)!;
    expect(state.game).toEqual(createInitialState().game);
    expect(state.quests.map((q) => q.id)).toEqual(["q1"]);
    expect(state.bosses[0]!.art).toBe("deadline_dragon");
    expect(state.log).toEqual([]);
  });

  it("читає лише власні ключі questlog", () => {
    const keys: string[] = [];
    const read = (key: string) => {
      keys.push(key);
      return null;
    };
    migrateLegacy(read, NOW);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => k.startsWith("questlog:v"))).toBe(true);
  });
});