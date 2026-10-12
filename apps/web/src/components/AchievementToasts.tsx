"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ACHIEVEMENTS, type AchievementId } from "@questlog/engine";
import { BADGES } from "@/assets/registry";
import { playSound } from "@/lib/sound";
import { Sprite } from "./Sprite";

export interface ToastEvent {
  id: number;
  achievement: AchievementId;
  /** через скільки секунд показати (щоб не накрити манга-панель чи банер рівня) */
  delay: number;
}

function ToastView({
  toast,
  onDone,
}: {
  toast: ToastEvent;
  onDone: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ctx = gsap.context(() => {
      gsap.set(el, { autoAlpha: 0 });
      const tl = gsap.timeline({
        delay: toast.delay,
        onComplete: () => doneRef.current(toast.id),
      });
      tl.call(() => playSound("achievement"), [], 0);
      if (reduce) {
        tl.to(el, { autoAlpha: 1, duration: 0.15 }, 0).to(
          el,
          { autoAlpha: 0, duration: 0.2 },
          3,
        );
        return;
      }
      tl.fromTo(
        el,
        { y: -70, scale: 0.9, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.45,
          ease: "back.out(1.8)",
          immediateRender: false,
        },
        0,
      )
        .fromTo(
          ".toast__badge",
          { rotation: -25, scale: 0.3 },
          {
            rotation: 0,
            scale: 1,
            duration: 0.5,
            ease: "back.out(3)",
            immediateRender: false,
          },
          0.1,
        )
        .to(
          el,
          { y: -40, autoAlpha: 0, duration: 0.3, ease: "power2.in" },
          3.2,
        );
    }, el);
    return () => ctx.revert();
  }, [toast.id, toast.delay]);

  const info = ACHIEVEMENTS[toast.achievement];

  return (
    <div ref={ref} className="toast" aria-hidden="true">
      <span className="toast__badge">
        <Sprite sprite={BADGES[toast.achievement]} scale={2} />
      </span>
      <div className="toast__text">
        <span className="toast__label">Нове досягнення!</span>
        <strong className="toast__title">{info.title}</strong>
        <span className="toast__desc">{info.description}</span>
      </div>
    </div>
  );
}

/** Тости нових досягнень: з'їжджають зверху, тримаються ~3 с і зникають. Кліки проходять крізь них. */
export function AchievementToasts({
  toasts,
  onDone,
}: {
  toasts: ToastEvent[];
  onDone: (id: number) => void;
}) {
  return (
    <>
      <div role="status" className="sr-only">
        {toasts
          .map((t) => `Нове досягнення: ${ACHIEVEMENTS[t.achievement].title}. `)
          .join("")}
      </div>
      <div className="toast-stack">
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} onDone={onDone} />
        ))}
      </div>
    </>
  );
}
