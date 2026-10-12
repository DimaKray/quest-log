import type { Reward } from "@questlog/engine";
import type { Avatar, BossArtId, Sky } from "@/assets/registry";
import type { Boss } from "./appState";

/** Усе, що потрібно манга-панелі, щоб показати один удар по босу. */
export interface BattleEvent {
  /** унікальний номер: новий удар перезапускає анімацію */
  id: number;
  avatar: Avatar;
  bossArt: BossArtId;
  bossTitle: string;
  /** небо за місцевим часом удару */
  sky: Sky;
  damage: number;
  hpBefore: number;
  hpAfter: number;
  maxHp: number;
  xp: number;
  /** новий рівень, якщо цей квест його підняв */
  levelUp: number | null;
  defeated: boolean;
}

type Of<T extends Reward["type"]> = Extract<Reward, { type: T }>;

/**
 * Перетворює нагороди за квест на подію бою.
 * `boss` це стан боса ДО виконання квесту, `hour` місцева година (0-23).
 * Повертає null, якщо удару не було (звичайний квест).
 */
export function battleFromRewards(
  rewards: Reward[],
  boss: Boss | undefined,
  avatar: Avatar,
  id: number,
  hour: number,
): BattleEvent | null {
  const hit = rewards.find((r): r is Of<"boss_damaged"> => r.type === "boss_damaged");
  if (!hit || !boss || hit.bossId !== boss.id) return null;

  const xp = rewards.find((r): r is Of<"xp_gained"> => r.type === "xp_gained");
  const levels = rewards.filter((r): r is Of<"level_up"> => r.type === "level_up");
  const lastLevel = levels[levels.length - 1];

  return {
    id,
    avatar,
    bossArt: boss.art,
    bossTitle: boss.title,
    sky: skyForHour(hour),
    damage: hit.damage,
    hpBefore: hit.hp + hit.damage,
    hpAfter: hit.hp,
    maxHp: boss.maxHp,
    xp: xp?.amount ?? 0,
    levelUp: lastLevel ? lastLevel.level : null,
    defeated: rewards.some((r) => r.type === "boss_defeated"),
  };
}

/** Розмір манга-панелі в «дизайнерських» пікселях. */
export const PANEL_W = 360;
export const PANEL_H = 300;

/**
 * Де і в якому масштабі показати панель (координати вікна `vw`×`vh`).
 * ПК: по центру, більша (×2 на високих вікнах, ×1,5 на середніх, ×1 на низьких).
 * Мобільний: угорі по центру, стискається під ширину екрана.
 */
export function battleLayout(vw: number, vh: number): { x: number; y: number; scale: number } {
  if (vw >= 1024) {
    const scale = vh >= 720 ? 2 : vh >= 550 ? 1.5 : 1;
    return {
      scale,
      x: Math.round((vw - PANEL_W * scale) / 2),
      y: Math.max(16, Math.round((vh - PANEL_H * scale) / 2 - 24)),
    };
  }
  const scale = Math.min(1, (vw * 0.94) / PANEL_W);
  return { scale, x: Math.round((vw - PANEL_W * scale) / 2), y: 64 };
}

/** Небо за місцевою годиною: світанок 5-8, день 8-17, вечір 17-21, інакше ніч. */
export function skyForHour(hour: number): Sky {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

const SFX = ["БАХ!", "ТРЕСЬ!", "ВЖУХ!", "ЧАХ!"];

/** Звукове слово з манги: за номером удару, а для перемоги окреме. */
export function sfxFor(event: Pick<BattleEvent, "id" | "defeated">): string {
  if (event.defeated) return "ПЕРЕМОГА!";
  return SFX[event.id % SFX.length] ?? "БАХ!";
}

/** Текст для скрінрідерів: сама панель суто декоративна. */
export function announce(event: BattleEvent): string {
  const parts = [
    `Удар по босу «${event.bossTitle}»: мінус ${event.damage}, лишилось ${event.hpAfter} з ${event.maxHp}.`,
  ];
  if (event.xp > 0) parts.push(`Плюс ${event.xp} досвіду.`);
  if (event.levelUp !== null) parts.push(`Новий рівень: ${event.levelUp}.`);
  if (event.defeated) parts.push("Боса переможено!");
  return parts.join(" ");
}