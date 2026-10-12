/** Вістря курсора: найближчий до лівого верхнього кута непрозорий піксель. */
export function findTip(
  alpha: ArrayLike<number>,
  width: number,
  height: number,
): { x: number; y: number } {
  let best = { x: 0, y: 0 };
  let bestScore = Infinity;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((alpha[y * width + x] ?? 0) > 0 && x + y < bestScore) {
        bestScore = x + y;
        best = { x, y };
      }
    }
  }
  return best;
}

export interface CursorImage {
  url1x: string;
  url2x: string;
  tip: { x: number; y: number };
}

/**
 * Значення CSS `cursor` у найкращому синтаксисі, який підтримує браузер:
 * image-set для чіткості на екранах із високою щільністю, інакше звичайний url().
 * `supports` це CSS.supports("cursor", значення), винесено для тестів.
 */
export function cursorValue(
  img: CursorImage,
  supports: (value: string) => boolean,
  fallback: string,
): string {
  const { url1x, url2x, tip } = img;
  const hot = `${tip.x} ${tip.y}`;
  const set = `url("${url1x}") 1x, url("${url2x}") 2x`;
  const prefixed = `-webkit-image-set(${set}) ${hot}, ${fallback}`;
  const standard = `image-set(${set}) ${hot}, ${fallback}`;
  if (supports(prefixed)) return prefixed;
  if (supports(standard)) return standard;
  return `url("${url1x}") ${hot}, ${fallback}`;
}