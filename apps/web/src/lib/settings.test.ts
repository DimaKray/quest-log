import { describe, expect, it } from "vitest";
import { defaultSettings, soundOn } from "./settings";

describe("soundOn", () => {
  it("за замовчуванням звук увімкнений", () => {
    expect(soundOn(defaultSettings())).toBe(true);
    expect(soundOn(undefined)).toBe(true);
    expect(soundOn(null)).toBe(true);
  });

  it("вимикається лише явним false", () => {
    expect(soundOn({ sound: false })).toBe(false);
    expect(soundOn({})).toBe(true);
    expect(soundOn({ sound: "no" as unknown as boolean })).toBe(true);
  });
});