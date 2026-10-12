import { describe, expect, it } from "vitest";
import { SOUNDS, hz, scheduleSound, soundDuration, type SoundName, type Voice } from "./sound";

const names = Object.keys(SOUNDS) as SoundName[];

describe("hz", () => {
  it("рахує частоти нот за рівномірно темперованим ладом", () => {
    expect(hz("A4")).toBeCloseTo(440, 5);
    expect(hz("C5")).toBeCloseTo(523.2511, 3);
    expect(hz("C4")).toBeCloseTo(261.6256, 3);
    expect(hz("C#5")).toBeCloseTo(554.3653, 3);
    expect(hz("Bb4")).toBeCloseTo(466.1638, 3);
    expect(hz("A5")).toBeCloseTo(880, 5);
  });

  it("кидає помилку для неіснуючої ноти", () => {
    expect(() => hz("H4")).toThrow();
    expect(() => hz("C")).toThrow();
  });
});

describe("визначення звуків", () => {
  it("кожен звук має голоси з коректними параметрами", () => {
    for (const name of names) {
      const { voices } = SOUNDS[name];
      expect(voices.length, name).toBeGreaterThan(0);
      for (const v of voices) {
        expect(v.at, name).toBeGreaterThanOrEqual(0);
        expect(v.dur, name).toBeGreaterThan(0);
        expect(v.gain, name).toBeGreaterThan(0);
        // шум після низькочастотного фільтра тихий, тому його гейн може бути вищим за 0,5
        expect(v.gain, name).toBeLessThanOrEqual(1);
        if (v.kind === "tone") {
          expect(v.freq, name).toBeGreaterThanOrEqual(40);
          expect(v.freq, name).toBeLessThanOrEqual(9000);
          if (v.endFreq !== undefined) {
            expect(v.endFreq, name).toBeGreaterThanOrEqual(20);
            expect(v.endFreq, name).toBeLessThanOrEqual(9000);
          }
        } else {
          expect(v.from, name).toBeGreaterThanOrEqual(100);
          expect(v.to, name).toBeGreaterThanOrEqual(100);
          expect(Math.max(v.from, v.to), name).toBeLessThanOrEqual(12000);
        }
      }
    }
  });

  it("звуки короткі: не довші за 1,4 с, а інтерфейсні (click, add, complete) ще коротші", () => {
    for (const name of names) expect(soundDuration(SOUNDS[name]), name).toBeLessThanOrEqual(1.4);
    expect(soundDuration(SOUNDS.click)).toBeLessThanOrEqual(0.1);
    expect(soundDuration(SOUNDS.add)).toBeLessThanOrEqual(0.4);
    expect(soundDuration(SOUNDS.complete)).toBeLessThanOrEqual(0.5);
  });

  it("мелодії піднімаються, а скидання спадає", () => {
    const tones = (n: SoundName) =>
      SOUNDS[n].voices.filter((v): v is Extract<Voice, { kind: "tone" }> => v.kind === "tone");
    const add = tones("add");
    expect(add[1]!.freq).toBeGreaterThan(add[0]!.freq);
    const lvl = tones("levelUp").slice(0, 6).map((v) => v.freq);
    expect([...lvl].sort((a, b) => a - b)).toEqual(lvl);
    const reset = tones("reset")[0]!;
    expect(reset.endFreq!).toBeLessThan(reset.freq);
  });
});

/** Мінімальний фальшивий AudioContext, що запам'ятовує, що саме запланували. */
function fakeContext() {
  const log = { osc: [] as { type: string; start: number; stop: number }[], noise: 0, gains: 0 };
  const param = () => ({
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    value: 0,
  });
  const node = () => ({ connect() {}, disconnect() {} });
  const ctx = {
    sampleRate: 8000,
    createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
    createGain: () => {
      log.gains++;
      return { ...node(), gain: param() };
    },
    createOscillator: () => {
      const o = {
        ...node(),
        type: "",
        frequency: param(),
        start(t: number) { entry.start = t; },
        stop(t: number) { entry.stop = t; },
      };
      const entry = { type: "", start: 0, stop: 0 };
      log.osc.push(entry);
      Object.defineProperty(o, "type", { set: (v: string) => { entry.type = v; }, get: () => entry.type });
      return o;
    },
    createBufferSource: () => {
      log.noise++;
      return { ...node(), buffer: null, loop: false, start() {}, stop() {} };
    },
    createBiquadFilter: () => ({ ...node(), type: "", frequency: param() }),
  };
  return { ctx: ctx as unknown as BaseAudioContext, log };
}

describe("scheduleSound", () => {
  it("створює по голосу на кожен тон і шум, з правильним часом", () => {
    const { ctx, log } = fakeContext();
    const dest = { connect() {} } as unknown as AudioNode;
    scheduleSound(ctx, dest, SOUNDS.impact, 10);
    expect(log.osc).toHaveLength(2); // два тони
    expect(log.noise).toBe(1); // і шум
    expect(log.gains).toBe(3); // кожному голосу своя обвідна
    for (const o of log.osc) {
      expect(o.start).toBeGreaterThanOrEqual(10);
      expect(o.stop).toBeGreaterThan(o.start);
    }
  });

  it("звук зі зсувом починається не раніше `when + at`", () => {
    const { ctx, log } = fakeContext();
    const dest = { connect() {} } as unknown as AudioNode;
    scheduleSound(ctx, dest, SOUNDS.add, 5);
    expect(log.osc.map((o) => o.start)).toEqual([5, 5.07]);
  });
});