import { describe, expect, it } from "vitest";
import { formatDay } from "./date";

describe("formatDay", () => {
  it("перетворює YYYY-MM-DD на ДД.ММ.РРРР", () => {
    expect(formatDay("2026-12-05")).toBe("05.12.2026");
  });
});