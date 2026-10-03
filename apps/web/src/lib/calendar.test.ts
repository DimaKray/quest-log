import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  monthGrid,
  parseIso,
  shiftMonth,
  toIso,
} from "./calendar";

describe("parseIso / toIso", () => {
  it("розбирає й збирає назад", () => {
    expect(parseIso("2026-10-03")).toEqual({ y: 2026, m0: 9, d: 3 });
    expect(toIso({ y: 2026, m0: 9, d: 3 })).toBe("2026-10-03");
  });

  it("відкидає сміття й неіснуючі дати", () => {
    expect(parseIso("")).toBeNull();
    expect(parseIso("2026-1-3")).toBeNull();
    expect(parseIso("2026-02-30")).toBeNull();
    expect(parseIso("2026-13-01")).toBeNull();
    expect(parseIso("2027-02-29")).toBeNull();
    expect(parseIso("2028-02-29")).not.toBeNull(); // високосний рік
  });
});

describe("addDays", () => {
  it("переходить через межі місяців і років", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDays("2026-10-03", 7)).toBe("2026-10-10");
  });

  it("не ламається на переході на літній час", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  });

  it("кидає помилку для поганої дати", () => {
    expect(() => addDays("абетка", 1)).toThrow();
  });
});

describe("addMonths", () => {
  it("гортає через межу року в обидва боки", () => {
    expect(addMonths({ year: 2026, month0: 11 }, 1)).toEqual({ year: 2027, month0: 0 });
    expect(addMonths({ year: 2026, month0: 0 }, -1)).toEqual({ year: 2025, month0: 11 });
    expect(addMonths({ year: 2026, month0: 5 }, 0)).toEqual({ year: 2026, month0: 5 });
    expect(addMonths({ year: 2026, month0: 0 }, -13)).toEqual({ year: 2024, month0: 11 });
  });
});

describe("shiftMonth", () => {
  it("зберігає день або бере останній день місяця", () => {
    expect(shiftMonth("2026-03-15", -3)).toBe("2025-12-15");
    expect(shiftMonth("2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftMonth("2028-01-31", 1)).toBe("2028-02-29");
    expect(shiftMonth("2026-12-31", 1)).toBe("2027-01-31");
  });
});

describe("monthGrid", () => {
  it("завжди 42 клітинки, тиждень з понеділка (жовтень 2026)", () => {
    const grid = monthGrid(2026, 9); // 1 жовтня 2026 це четвер
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ iso: "2026-09-28", inMonth: false }); // понеділок
    expect(grid[3]).toEqual({ iso: "2026-10-01", inMonth: true });
    expect(grid[41]).toEqual({ iso: "2026-11-08", inMonth: false });
    expect(grid.filter((c) => c.inMonth)).toHaveLength(31);
  });

  it("місяць, що починається з неділі, має 6 днів попереднього (лютий 2026)", () => {
    const grid = monthGrid(2026, 1); // 1 лютого 2026 це неділя
    expect(grid[0]?.iso).toBe("2026-01-26");
    expect(grid[6]).toEqual({ iso: "2026-02-01", inMonth: true });
    expect(grid.filter((c) => c.inMonth)).toHaveLength(28);
  });

  it("високосний лютий має 29 днів", () => {
    expect(monthGrid(2028, 1).filter((c) => c.inMonth)).toHaveLength(29);
  });

  it("місяць, що починається з понеділка, не має днів попереднього (вересень 2025)", () => {
    const grid = monthGrid(2025, 8); // 1 вересня 2025 це понеділок
    expect(grid[0]).toEqual({ iso: "2025-09-01", inMonth: true });
  });
});