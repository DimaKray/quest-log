"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ICONS } from "@/assets/registry";
import { playSound } from "@/lib/sound";
import { Sprite } from "./Sprite";

export interface XpFloat {
  id: number;
  amount: number;
  /** координати вікна, звідки вилітає число (центр натиснутої кнопки) */
  x: number;
  y: number;
}

export interface LevelUpEvent {
  id: number;
  level: number;
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Один виліт «+XP»: підстрибує над кнопкою, піднімається й згасає. */
function XpFloatView({
  float,
  onDone,
}: {
  float: XpFloat;
  onDone: (id: number) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => doneRef.current(float.id) });
      if (prefersReducedMotion()) {
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }).to(
          el,
          { autoAlpha: 0, duration: 0.2 },
          0.8,
        );
        return;
      }
      tl.fromTo(
        el,
        { autoAlpha: 0, y: 0, scale: 0.5 },
        {
          autoAlpha: 1,
          y: -16,
          scale: 1.15,
          duration: 0.18,
          ease: "back.out(3)",
        },
      )
        .to(el, { y: -72, duration: 0.75, ease: "power1.out" }, 0.1)
        .to(el, { autoAlpha: 0, duration: 0.3 }, 0.6);
    }, el);
    return () => ctx.revert();
  }, [float.id]);

  // зовнішній div лише ставить точку, анімується внутрішній span
  return (
    <div
      className="fx-xp"
      style={{ left: float.x, top: float.y }}
      aria-hidden="true"
    >
      <span ref={ref}>+{float.amount} XP</span>
    </div>
  );
}

const STARS = 10;

/** Спалах і банер «РІВЕНЬ N!» із зірками, що розлітаються. */
function LevelUpView({
  event,
  onDone,
}: {
  event: LevelUpEvent;
  onDone: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => doneRef.current() });
      tl.call(() => playSound("levelUp"), [], 0.05);
      if (prefersReducedMotion()) {
        gsap.set(".fx-level__burst, .fx-level__flash, .fx-level__star", {
          autoAlpha: 0,
        });
        tl.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }).to(
          root,
          { autoAlpha: 0, duration: 0.2 },
          1.3,
        );
        return;
      }

      tl.fromTo(
        ".fx-level__flash",
        { autoAlpha: 0.6 },
        { autoAlpha: 0, duration: 0.6, ease: "power2.out" },
        0,
      );
      tl.fromTo(
        ".fx-level__burst",
        { scale: 0, rotation: -30 },
        { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2)" },
        0.05,
      );
      tl.fromTo(
        ".fx-level__banner",
        { scale: 0, rotation: -12, autoAlpha: 0 },
        {
          scale: 1,
          rotation: -3,
          autoAlpha: 1,
          duration: 0.45,
          ease: "back.out(2.4)",
        },
        0.1,
      );
      // зірки розлітаються з центру в різні боки
      tl.fromTo(
        ".fx-level__star",
        { x: 0, y: 0, scale: 0.5, autoAlpha: 1 },
        {
          x: (i: number) =>
            Math.cos((Math.PI * 2 * i) / STARS) * (150 + (i % 3) * 30),
          y: (i: number) =>
            Math.sin((Math.PI * 2 * i) / STARS) * (110 + (i % 3) * 25),
          scale: 1.2,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power2.out",
          immediateRender: false,
        },
        0.15,
      );
      tl.to(
        ".fx-level__banner",
        {
          scale: 1.08,
          duration: 0.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: 1,
        },
        0.6,
      );
      tl.to(root, { autoAlpha: 0, duration: 0.3 }, 1.7);
    }, root);
    return () => ctx.revert();
  }, [event.id]);

  return (
    <>
      <div role="status" className="sr-only">
        Новий рівень: {event.level}
      </div>
      <div ref={rootRef} className="fx-level" aria-hidden="true">
        <div className="fx-level__flash" />
        <div className="fx-level__stage">
          <svg className="fx-level__burst" viewBox="0 0 150 150">
            <polygon points={BURST_POINTS} />
          </svg>
          {Array.from({ length: STARS }, (_, i) => (
            <Sprite
              key={i}
              sprite={ICONS.xp}
              scale={2}
              className="fx-level__star"
            />
          ))}
          <div className="fx-level__banner">РІВЕНЬ {event.level}!</div>
        </div>
      </div>
    </>
  );
}

/** Нерівна зірка-вибух (та сама форма, що й у манга-панелі). */
function burstPoints(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  spikes: number,
) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const wobble = 1 + 0.18 * Math.sin(i * 2.7);
    const r = (i % 2 === 0 ? outer : inner) * wobble;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`,
    );
  }
  return pts.join(" ");
}
const BURST_POINTS = burstPoints(75, 75, 72, 38, 11);

/**
 * Ефекти для звичайних квестів (для ударів по босу є манга-панель):
 * вильоти «+XP» з натиснутої кнопки та спалах із банером нового рівня.
 * Нічого не перехоплює: кліки проходять крізь ефекти.
 */
export function RewardEffects({
  floats,
  levelUp,
  onFloatDone,
  onLevelUpDone,
}: {
  floats: XpFloat[];
  levelUp: LevelUpEvent | null;
  onFloatDone: (id: number) => void;
  onLevelUpDone: () => void;
}) {
  return (
    <>
      {floats.map((f) => (
        <XpFloatView key={f.id} float={f} onDone={onFloatDone} />
      ))}
      {levelUp && (
        <LevelUpView key={levelUp.id} event={levelUp} onDone={onLevelUpDone} />
      )}
    </>
  );
}
