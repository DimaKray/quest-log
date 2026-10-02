import {
  XP_BY_DIFFICULTY,
  addQuestToBoss,
  completeQuest,
  createBoss,
  createGame,
  type BossState,
  type Difficulty,
  type GameState,
  type Reward,
} from "@questlog/engine";
import { BOSSES, type Avatar, type BossArtId } from "@/assets/registry";
import { todayLocal } from "./date";
import { describeReward } from "./rewards";
import type { Quest } from "./types";

/** Бос у застосунку: стан з рушія + те, що потрібно інтерфейсу. */
export interface Boss extends BossState {
  art: BossArtId;
  /** 'YYYY-MM-DD' або null */
  deadline: string | null;
  createdAt: string;
  /** null для активних (і для босів, переможених до v3) */
  defeatedAt: string | null;
}

export interface AppState {
  version: 3;
  game: GameState;
  /** найновіші першими */
  quests: Quest[];
  /** найстарші першими */
  bosses: Boss[];
  avatar: Avatar;
  /** кожен елемент: нагороди за один виконаний квест */
  log: string[][];
}

/** Усе «зовнішнє» (id, час), що потрібне діям. У тестах підставляється вручну. */
export interface Env {
  newId: () => string;
  /** ISO-час */
  now: string;
  /** 'YYYY-MM-DD' за часовим поясом користувача */
  today: string;
}

export const STATE_KEY = "questlog:v3:state";
export const DEFAULT_ART: BossArtId = "deadline_dragon";
const LOG_LIMIT = 5;

export function createInitialState(): AppState {
  return {
    version: 3,
    game: createGame(),
    quests: [],
    bosses: [],
    avatar: "hero",
    log: [],
  };
}

export function browserEnv(): Env {
  return {
    newId: () => crypto.randomUUID(),
    now: new Date().toISOString(),
    today: todayLocal(),
  };
}

export const activeBosses = (state: AppState): Boss[] =>
  state.bosses.filter((b) => !b.defeated);

// ───────────────────────── дії ─────────────────────────

export function addQuest(
  state: AppState,
  input: { title: string; difficulty: Difficulty; bossId: string | null },
  env: Env,
): AppState {
  let bosses = state.bosses;

  if (input.bossId !== null) {
    const target = state.bosses.find((b) => b.id === input.bossId);
    if (!target) throw new Error(`Boss ${input.bossId} not found`);
    // для переможеного боса addQuestToBoss кидає помилку
    bosses = state.bosses.map((b) =>
      b.id === target.id ? addQuestToBoss(b, input.difficulty) : b,
    );
  }

  const quest: Quest = {
    id: env.newId(),
    title: input.title,
    difficulty: input.difficulty,
    bossId: input.bossId,
    done: false,
    completedAt: null,
  };
  return { ...state, bosses, quests: [quest, ...state.quests] };
}

export function createBossWithQuests(
  state: AppState,
  input: {
    title: string;
    art: BossArtId;
    deadline: string | null;
    drafts: { title: string; difficulty: Difficulty }[];
  },
  env: Env,
): AppState {
  const id = env.newId();
  const base = createBoss(
    id,
    input.title,
    input.drafts.map((d) => d.difficulty),
  );
  const boss: Boss = {
    ...base,
    art: input.art,
    deadline: input.deadline,
    createdAt: env.now,
    defeatedAt: null,
  };
  const quests: Quest[] = input.drafts.map((d) => ({
    id: env.newId(),
    title: d.title,
    difficulty: d.difficulty,
    bossId: id,
    done: false,
    completedAt: null,
  }));
  return {
    ...state,
    bosses: [...state.bosses, boss],
    quests: [...quests, ...state.quests],
  };
}

/** Виконати квест: герой, статистика, досягнення і (якщо є) удар по його босу. */
export function finishQuest(
  state: AppState,
  questId: string,
  env: Env,
): { state: AppState; rewards: Reward[] } {
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest || quest.done) return { state, rewards: [] };

  const boss =
    quest.bossId === null
      ? undefined
      : state.bosses.find((b) => b.id === quest.bossId && !b.defeated);

  const res = completeQuest(
    state.game,
    { type: "QUEST_COMPLETED", difficulty: quest.difficulty, date: env.today },
    boss,
  );

  const updatedBoss = res.boss;
  const bosses = state.bosses.map((b) =>
    updatedBoss && b.id === updatedBoss.id
      ? {
          ...b,
          hp: updatedBoss.hp,
          defeated: updatedBoss.defeated,
          defeatedAt: updatedBoss.defeated ? env.now : null,
        }
      : b,
  );

  return {
    state: {
      ...state,
      game: res.game,
      bosses,
      quests: state.quests.map((q) =>
        q.id === questId ? { ...q, done: true, completedAt: env.now } : q,
      ),
      log: [res.rewards.map(describeReward), ...state.log].slice(0, LOG_LIMIT),
    },
    rewards: res.rewards,
  };
}

/** Новий прогрес з нуля; вибраний персонаж лишається. */
export function resetProgress(state: AppState): AppState {
  return { ...createInitialState(), avatar: state.avatar };
}

// ───────────────────────── міграція ─────────────────────────

const LEGACY = {
  game: "questlog:v1:game",
  quests: "questlog:v1:quests",
  boss: "questlog:v1:boss",
  bossArt: "questlog:v1:bossArt",
  avatar: "questlog:v1:avatar",
  log: "questlog:v2:log",
} as const;

type Reader = (key: string) => string | null;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isDifficulty = (v: unknown): v is Difficulty =>
  typeof v === "string" && Object.keys(XP_BY_DIFFICULTY).includes(v);

const isBossArt = (v: unknown): v is BossArtId =>
  typeof v === "string" && Object.keys(BOSSES).includes(v);

function readJson(read: Reader, key: string): unknown {
  const raw = read(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined; // пошкоджені дані ігноруємо
  }
}

function asGame(v: unknown): GameState | null {
  if (!isRecord(v) || !isRecord(v.hero) || !isRecord(v.stats)) return null;
  const { hero, stats } = v;
  const ok =
    typeof hero.xp === "number" &&
    typeof hero.level === "number" &&
    typeof hero.streak === "number" &&
    typeof stats.totalQuests === "number" &&
    typeof stats.bossesDefeated === "number" &&
    isRecord(stats.today) &&
    Array.isArray(stats.unlocked);
  return ok ? (v as unknown as GameState) : null;
}

function asBoss(v: unknown, art: unknown, nowIso: string): Boss | null {
  if (
    !isRecord(v) ||
    typeof v.id !== "string" ||
    typeof v.title !== "string" ||
    typeof v.maxHp !== "number" ||
    typeof v.hp !== "number" ||
    typeof v.defeated !== "boolean"
  ) {
    return null;
  }
  return {
    id: v.id,
    title: v.title,
    maxHp: v.maxHp,
    hp: v.hp,
    defeated: v.defeated,
    art: isBossArt(art) ? art : DEFAULT_ART,
    deadline: null,
    createdAt: nowIso,
    defeatedAt: null,
  };
}

function asQuests(v: unknown, bossId: string | null): Quest[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((q): Quest[] => {
    if (
      !isRecord(q) ||
      typeof q.id !== "string" ||
      typeof q.title !== "string" ||
      !isDifficulty(q.difficulty) ||
      typeof q.done !== "boolean"
    ) {
      return [];
    }
    return [
      {
        id: q.id,
        title: q.title,
        difficulty: q.difficulty,
        done: q.done,
        completedAt: null,
        // квести боса, якого вже немає (його колись «прибрали»), стають звичайними
        bossId:
          bossId !== null && q.bossId === bossId ? bossId : null,
      },
    ];
  });
}

function asLog(v: unknown): string[][] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (g): g is string[] =>
        Array.isArray(g) && g.every((line) => typeof line === "string"),
    )
    .slice(0, LOG_LIMIT);
}

/**
 * Збирає v3 зі старих ключів (v1/v2). Нічого не видаляє.
 * Повертає null, якщо старих даних немає зовсім (новий користувач).
 */
export function migrateLegacy(read: Reader, nowIso: string): AppState | null {
  const game = readJson(read, LEGACY.game);
  const quests = readJson(read, LEGACY.quests);
  const boss = readJson(read, LEGACY.boss);
  if (game === undefined && quests === undefined && boss === undefined) {
    return null;
  }

  const migratedBoss = asBoss(boss, readJson(read, LEGACY.bossArt), nowIso);
  return {
    version: 3,
    game: asGame(game) ?? createGame(),
    quests: asQuests(quests, migratedBoss?.id ?? null),
    bosses: migratedBoss ? [migratedBoss] : [],
    avatar: readJson(read, LEGACY.avatar) === "heroine" ? "heroine" : "hero",
    log: asLog(readJson(read, LEGACY.log)),
  };
}

/**
 * Початкове значення для usePersistentState: коли v3 ще не збережено,
 * намагаємось підтягнути старі дані. Безпечно викликається на сервері.
 */
export function loadInitialState(): AppState {
  if (typeof window === "undefined") return createInitialState();
  const read: Reader = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  return migrateLegacy(read, new Date().toISOString()) ?? createInitialState();
}