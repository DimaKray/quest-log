import { describe, expect, it } from "vitest";
import { cursorValue, findTip } from "./cursor";

describe("findTip", () => {
  it("знаходить непрозорий піксель, найближчий до лівого верхнього кута", () => {
    // 4x3, непрозорі: (2,1) і (1,2)
    const alpha = [0, 0, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0];
    expect(findTip(alpha, 4, 3)).toEqual({ x: 2, y: 1 });
  });

  it("при рівній відстані бере верхній рядок", () => {
    // (1,0) і (0,1) однаково далеко; перший у порядку обходу це (1,0)
    const alpha = [0, 255, 0, 255, 0, 0];
    expect(findTip(alpha, 3, 2)).toEqual({ x: 1, y: 0 });
  });

  it("порожня картинка: (0,0), а не помилка", () => {
    expect(findTip([0, 0, 0, 0], 2, 2)).toEqual({ x: 0, y: 0 });
  });
});

describe("cursorValue", () => {
  const img = { url1x: "data:a", url2x: "data:b", tip: { x: 1, y: 2 } };

  it("надає перевагу -webkit-image-set, потім image-set, потім url()", () => {
    expect(cursorValue(img, (v) => v.startsWith("-webkit-image-set"), "auto")).toBe(
      '-webkit-image-set(url("data:a") 1x, url("data:b") 2x) 1 2, auto',
    );
    expect(cursorValue(img, (v) => v.startsWith("image-set"), "pointer")).toBe(
      'image-set(url("data:a") 1x, url("data:b") 2x) 1 2, pointer',
    );
    expect(cursorValue(img, () => false, "auto")).toBe('url("data:a") 1 2, auto');
  });
});