/**
 * Звуки гри: синтезуються на льоту (Web Audio), тож жодних аудіофайлів.
 * Кожен звук це дані (SoundDef): набір голосів-тонів і шуму. Планувальник
 * scheduleSound працює і зі звичайним AudioContext, і з OfflineAudioContext,
 * тому звуки можна перевіряти без прослуховування.
 */

export type SoundName =
  | "click"
  | "add"
  | "complete"
  | "whoosh"
  | "swing"
  | "impact"
  | "victory"
  | "levelUp"
  | "achievement"
  | "reset";

export type Voice =
  | {
      kind: "tone";
      wave: "square" | "triangle" | "sawtooth" | "sine";
      /** Гц на початку */
      freq: number;
      /** Гц наприкінці (плавний зсув), необов'язково */
      endFreq?: number;
      /** секунди від початку звуку */
      at: number;
      dur: number;
      gain: number;
    }
  | {
      kind: "noise";
      at: number;
      dur: number;
      gain: number;
      /** частота зрізу фільтра на початку й наприкінці (Гц) */
      from: number;
      to: number;
    };

export interface SoundDef {
  voices: Voice[];
}

/** Частота ноти: hz("A4") = 440, hz("C#5"), hz("Bb3"). */
export function hz(note: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(note);
  if (!m) throw new Error(`Bad note: ${note}`);
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const [, letter, accidental, octave] = m as unknown as [string, string, string, string];
  const semitone = (base[letter] ?? 0) + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
  const midi = (Number(octave) + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const tone = (
  wave: Extract<Voice, { kind: "tone" }>["wave"],
  note: string | number,
  at: number,
  dur: number,
  gain: number,
  endNote?: string | number,
): Voice => ({
  kind: "tone",
  wave,
  freq: typeof note === "string" ? hz(note) : note,
  ...(endNote !== undefined ? { endFreq: typeof endNote === "string" ? hz(endNote) : endNote } : {}),
  at,
  dur,
  gain,
});

const noise = (at: number, dur: number, gain: number, from: number, to: number): Voice => ({
  kind: "noise",
  at,
  dur,
  gain,
  from,
  to,
});

/** Арпеджіо: послідовність нот однакової довжини. */
const arpeggio = (
  notes: string[],
  step: number,
  dur: number,
  gain: number,
  wave: Extract<Voice, { kind: "tone" }>["wave"] = "square",
): Voice[] => notes.map((n, i) => tone(wave, n, i * step, dur, gain));

export const SOUNDS: Record<SoundName, SoundDef> = {
  // ледь чутний тік на натискання кнопок
  click: { voices: [tone("square", 1400, 0, 0.04, 0.23, 900)] },

  // новий квест або бос: дві ноти вгору
  add: { voices: [tone("square", "C5", 0, 0.07, 0.2), tone("square", "G5", 0.07, 0.12, 0.2)] },

  // квест виконано: «монетка»
  complete: {
    voices: [tone("square", "B5", 0, 0.07, 0.25), tone("square", "E6", 0.07, 0.28, 0.25)],
  },

  // панель влітає (шум після фільтра тихий, тому його гейн високий)
  whoosh: { voices: [noise(0, 0.38, 0.8, 300, 3500)] },

  // герой кидається з мечем
  swing: { voices: [noise(0, 0.16, 0.5, 600, 4500)] },

  // удар: шумовий тріск, низький стук і «бас»
  impact: {
    voices: [
      noise(0, 0.28, 0.75, 3000, 150),
      tone("square", 160, 0, 0.22, 0.5, 45),
      tone("triangle", 90, 0, 0.3, 0.5, 40),
    ],
  },

  // перемога над босом: фанфара
  victory: {
    voices: [
      ...arpeggio(["C5", "E5", "G5", "C6"], 0.11, 0.11, 0.15),
      tone("triangle", "C6", 0.5, 0.7, 0.11),
      tone("triangle", "E6", 0.5, 0.7, 0.11),
      tone("triangle", "G6", 0.5, 0.7, 0.11),
    ],
  },

  // новий рівень: швидке арпеджіо вгору й блискіт
  levelUp: {
    voices: [
      ...arpeggio(["C5", "E5", "G5", "C6", "E6", "G6"], 0.07, 0.09, 0.2),
      tone("triangle", "G6", 0.42, 0.35, 0.14, "C7"),
    ],
  },

  // досягнення: три ноти й дзвіночок
  achievement: {
    voices: [
      tone("square", "G5", 0, 0.09, 0.21),
      tone("square", "C6", 0.09, 0.09, 0.21),
      tone("square", "E6", 0.18, 0.3, 0.21),
      tone("triangle", "E7", 0.2, 0.25, 0.09),
    ],
  },

  // скидання прогресу: спадний тон
  reset: { voices: [tone("sawtooth", 440, 0, 0.4, 0.38, 110)] },
};

/** Тривалість звуку в секундах (до кінця найдовшого голосу). */
export function soundDuration(def: SoundDef): number {
  return Math.max(...def.voices.map((v) => v.at + v.dur));
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buf);
  }
  return buf;
}

/** Планує голоси звуку на час `when` (секунди контексту). */
export function scheduleSound(
  ctx: BaseAudioContext,
  destination: AudioNode,
  def: SoundDef,
  when: number,
): void {
  for (const v of def.voices) {
    const t0 = when + v.at;
    const t1 = t0 + v.dur;

    // швидкий вхід і спадна експонента: без клацань на початку й кінці
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(v.gain, t0 + Math.min(0.004, v.dur / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    if (v.kind === "tone") {
      const osc = ctx.createOscillator();
      osc.type = v.wave;
      osc.frequency.setValueAtTime(v.freq, t0);
      if (v.endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(v.endFreq, t1);
      osc.connect(gain);
      gain.connect(destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    } else {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(v.from, t0);
      filter.frequency.exponentialRampToValueAtTime(v.to, t1);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      src.start(t0);
      src.stop(t1 + 0.02);
    }
  }
}

/** Загальний ланцюг: гучність і компресор, щоб накладені звуки не клацали. */
export function createMasterChain(ctx: BaseAudioContext, volume = 0.6): GainNode {
  const master = ctx.createGain();
  master.gain.value = volume;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 12;
  compressor.ratio.value = 6;
  master.connect(compressor);
  compressor.connect(ctx.destination);
  return master;
}

// ───────── живий рушій (лише в браузері) ─────────

let engine: { ctx: AudioContext; master: GainNode } | null = null;
let enabled = true;

/** Увімкнути/вимкнути всі звуки (налаштування користувача). */
export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function getEngine() {
  if (typeof window === "undefined") return null;
  if (!engine) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    engine = { ctx, master: createMasterChain(ctx) };
  }
  // браузери стартують контекст призупиненим, доки не було жесту користувача
  if (engine.ctx.state === "suspended") void engine.ctx.resume();
  return engine;
}

/** Грає звук. Безпечно викликати будь-де: на сервері, у фоновій вкладці й при вимкненому звуку нічого не робить. */
export function playSound(name: SoundName, delay = 0): void {
  if (!enabled || typeof document === "undefined") return;
  if (document.visibilityState === "hidden") return;
  const e = getEngine();
  if (!e) return;
  scheduleSound(e.ctx, e.master, SOUNDS[name], e.ctx.currentTime + 0.005 + delay);
}