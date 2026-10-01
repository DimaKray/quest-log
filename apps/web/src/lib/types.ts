import type { Difficulty } from "@questlog/engine";

export interface Quest {
  id: string;
  title: string;
  difficulty: Difficulty;
  done: boolean;
  /** якщо заповнено, квест належить босу і виконання б'є його */
  bossId?: string;
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Легка",
  medium: "Середня",
  hard: "Важка",
};