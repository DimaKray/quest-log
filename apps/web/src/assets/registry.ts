import type { AchievementId, Difficulty } from "@questlog/engine";

export interface SpriteDef {
  src: string;
  /** справжній розмір у пікселях (1 клітинка = 1 піксель) */
  w: number;
  h: number;
}

const s = (path: string, w: number, h: number): SpriteDef => ({
  src: `/assets/${path}`,
  w,
  h,
});

export type Mood = "idle" | "happy" | "tired";
export type Avatar = "hero" | "heroine";

export const AVATARS: Record<
  Avatar,
  { label: string; mood: Record<Mood, SpriteDef> }
> = {
  hero: {
    label: "Герой",
    mood: {
      idle: s("characters/hero/hero_idle.png", 42, 64),
      happy: s("characters/hero/hero_happy.png", 42, 64),
      tired: s("characters/hero/hero_tired.png", 42, 64),
    },
  },
  heroine: {
    label: "Героїня",
    mood: {
      idle: s("characters/heroine/heroine_idle.png", 44, 76),
      happy: s("characters/heroine/heroine_happy.png", 44, 76),
      tired: s("characters/heroine/heroine_tired.png", 44, 76),
    },
  },
};

export const MOOD_LABEL: Record<Mood, string> = {
  idle: "спокійний",
  happy: "радіє",
  tired: "втомлений",
};

export const BOSSES = {
  deadline_dragon: {
    name: "Дракон дедлайнів",
    sprite: s("bosses/deadline_dragon.png", 78, 79),
  },
  inbox_hydra: {
    name: "Гідра вхідних",
    sprite: s("bosses/inbox_hydra.png", 86, 81),
  },
  legacy_golem: {
    name: "Голем легасі",
    sprite: s("bosses/legacy_golem.png", 90, 89),
  },
  spaghetti_bug: {
    name: "Спагеті-баг",
    sprite: s("bosses/spaghetti_bug.png", 89, 88),
  },
  gym_ogre: {
    name: "Огр із залу",
    sprite: s("bosses/gym_ogre.png", 88, 83),
  },
  laundry_golem: {
    name: "Голем прання",
    sprite: s("bosses/laundry_golem.png", 88, 86),
  },
  thesis_owl: {
    name: "Сова-дипломниця",
    sprite: s("bosses/thesis_owl.png", 77, 83),
  },
  slime_sleepy: {
    name: "Слиз прокрастинації",
    sprite: s("mobs/slime_sleepy.png", 86, 79),
  },
  sticky_goblin: {
    name: "Гоблін зі стікерами",
    sprite: s("mobs/sticky_goblin.png", 58, 82),
  },
  coffee_minotaur: {
    name: "Мінотавр кави",
    sprite: s("mobs/coffee_minotaur.png", 71, 115),
  },
} satisfies Record<string, { name: string; sprite: SpriteDef }>;

export type BossArtId = keyof typeof BOSSES;
export const BOSS_IDS = Object.keys(BOSSES) as BossArtId[];

export const DIFFICULTY_ICON: Record<Difficulty, SpriteDef> = {
  easy: s("items/sword_mint.png", 22, 22),
  medium: s("items/sword_bronze.png", 22, 22),
  hard: s("items/sword_dark_fire.png", 22, 22),
};

export const ICONS = {
  xp: s("icons/xp_star.png", 22, 22),
  heart: s("icons/heart.png", 22, 22),
  streak: s("icons/streak_flame.png", 22, 22),
};

export const BADGES: Record<AchievementId, SpriteDef> = {
  first_quest: s("badges/badge_flag.png", 22, 22),
  ten_in_a_day: s("badges/badge_lightning.png", 22, 22),
  streak_7: s("badges/badge_flame.png", 22, 22),
  first_boss: s("badges/badge_crown.png", 22, 22),
  level_10: s("badges/badge_laurel.png", 22, 22),
};

export const LOGO = s("branding/logo_questlog.png", 86, 87);