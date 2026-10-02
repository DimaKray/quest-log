import type { Difficulty } from "@questlog/engine";

export interface Quest {
  id: string;
  title: string;
  difficulty: Difficulty;
  /** null = звичайний квест; інакше виконання б'є відповідного боса */
  bossId: string | null;
  done: boolean;
  /** ISO-час виконання; null, якщо квест ще активний (або виконаний до v3) */
  completedAt: string | null;
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Легка",
  medium: "Середня",
  hard: "Важка",
};