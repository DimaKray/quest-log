"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { BATTLE, BOSSES, SKIES } from "@/assets/registry";
import { announce, battleLayout, sfxFor, type BattleEvent } from "@/lib/battle";
import { playSound } from "@/lib/sound";
import { Sprite } from "./Sprite";

/** Нерівна зірка-вибух: однакова при кожному рендері. */
function starPoints(
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

/** Промені «швидкісних ліній» з центру удару. */
function focusLines(cx: number, cy: number, count: number, radius: number) {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const half = 0.012 + 0.03 * (((i * 37) % 11) / 11);
    const p = (ang: number) =>
      `${(cx + radius * Math.cos(ang)).toFixed(1)},${(cy + radius * Math.sin(ang)).toFixed(1)}`;
    out.push(`${cx},${cy} ${p(a - half)} ${p(a + half)}`);
  }
  return out;
}

const BURST = starPoints(75, 75, 72, 38, 11);
const LINES = focusLines(200, 136, 44, 460);

/** Ставить панель за розкладкою: на ПК велика по центру, на телефоні вгорі. */
function place(el: HTMLElement) {
  const { x, y, scale } = battleLayout(window.innerWidth, window.innerHeight);
  el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

/**
 * Манга-панель: коли герой б'є боса, вилітає кадр з ударом, спалахом,
 * звуковим словом і шкодою, а потім зникає. Не перехоплює кліки.
 * Новий удар під час анімації просто перезапускає її.
 */
export function BattlePanel({
  event,
  onDone,
}: {
  event: BattleEvent | null;
  onDone: () => void;
}) {
  const fitRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  // свіжий onDone без перезапуску анімації при кожному рендері батька
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (!event) return;
    const fit = fitRef.current;
    const root = rootRef.current;
    const dim = dimRef.current;
    if (!fit || !root || !dim) return;

    place(fit);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const defeated = event.defeated;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => doneRef.current() });

      gsap.set(".battle__victory", { autoAlpha: 0 });
      gsap.set(
        ".battle__burst, .battle__sfx, .battle__damage, .battle__flash, .battle__lines, .battle__level",
        { autoAlpha: 0 },
      );
      gsap.set(".battle__boss", { filter: "grayscale(0) brightness(1)" });
      gsap.set(dim, { autoAlpha: 0 });

      if (reduce) {
        // без руху: одразу готовий кадр, коротко показуємо й ховаємо
        gsap.set(
          ".battle__burst, .battle__sfx, .battle__damage, .battle__level",
          {
            autoAlpha: 1,
          },
        );
        gsap.set(".battle__hero", { x: 50 });
        gsap.set(".battle__hp-fill", {
          width: `${(event.hpAfter / event.maxHp) * 100}%`,
        });
        if (defeated) {
          gsap.set(".battle__attack", { autoAlpha: 0 });
          gsap.set(".battle__victory", { autoAlpha: 1 });
          gsap.set(".battle__boss", { autoAlpha: 0.3 });
        }
        tl.call(() => playSound("impact"), [], 0.05);
        if (defeated) tl.call(() => playSound("victory"), [], 0.5);
        tl.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }).to(
          root,
          { autoAlpha: 0, duration: 0.15 },
          defeated ? 2.4 : 1.7,
        );
        return;
      }

      const exitAt = defeated ? 2.7 : 1.75;
      const hpAfter = `${(event.hpAfter / event.maxHp) * 100}%`;

      // 1. кадр влітає, як у манзі: збоку, з нахилом і перельотом
      tl.fromTo(
        root,
        { x: 160, y: -30, rotation: 8, scale: 0.7, autoAlpha: 0 },
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.4,
          ease: "back.out(1.7)",
        },
      );
      tl.call(() => playSound("whoosh"), [], 0);
      // затемнення фону за панеллю, щоб кадр «вирізнявся», як розворот у манзі
      tl.to(dim, { autoAlpha: 1, duration: 0.25 }, 0);
      // 2. герой кидається на боса
      tl.to(".battle__hero", { x: 70, duration: 0.16, ease: "power3.in" }, 0.3);
      tl.call(() => playSound("swing"), [], 0.3);
      // 3. удар. fromTo малює початкові значення одразу, тому для всього, що має
      // стартувати пізніше, потрібен immediateRender: false
      tl.addLabel("hit", 0.46);
      tl.call(() => playSound("impact"), [], "hit");
      tl.fromTo(
        ".battle__flash",
        { autoAlpha: 0.95 },
        { autoAlpha: 0, duration: 0.2, immediateRender: false },
        "hit",
      );
      tl.fromTo(
        ".battle__lines",
        { autoAlpha: 1, scale: 0.6 },
        {
          autoAlpha: 0,
          scale: 1.3,
          duration: 0.55,
          ease: "power2.out",
          immediateRender: false,
        },
        "hit",
      );
      tl.fromTo(
        ".battle__burst",
        { autoAlpha: 1, scale: 0.2, rotation: -20 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.2,
          ease: "back.out(2.5)",
          immediateRender: false,
        },
        "hit",
      );
      tl.to(
        ".battle__burst",
        { autoAlpha: 0, scale: 1.25, duration: 0.3 },
        "hit+=0.32",
      );
      tl.fromTo(
        ".battle__sfx",
        { autoAlpha: 1, scale: 0, rotation: -14 },
        {
          scale: 1,
          rotation: -6,
          duration: 0.25,
          ease: "back.out(3)",
          immediateRender: false,
        },
        "hit+=0.03",
      );
      tl.fromTo(
        ".battle__boss",
        { filter: "grayscale(0) brightness(3)" },
        {
          filter: "grayscale(0) brightness(1)",
          duration: 0.35,
          immediateRender: false,
        },
        "hit",
      );
      tl.to(
        ".battle__boss",
        {
          keyframes: [
            { x: 16, duration: 0.06 },
            { x: -12, duration: 0.07 },
            { x: 8, duration: 0.07 },
            { x: -4, duration: 0.07 },
            { x: 0, duration: 0.07 },
          ],
        },
        "hit",
      );
      tl.to(
        root,
        {
          keyframes: [
            { y: -5, duration: 0.04 },
            { y: 4, duration: 0.04 },
            { y: -2, duration: 0.04 },
            { y: 0, duration: 0.04 },
          ],
        },
        "hit",
      );
      tl.fromTo(
        ".battle__damage",
        { autoAlpha: 1, y: 12, scale: 0.4 },
        {
          y: -14,
          scale: 1,
          duration: 0.35,
          ease: "back.out(2)",
          immediateRender: false,
        },
        "hit+=0.08",
      );
      tl.to(
        ".battle__hp-fill",
        { width: hpAfter, duration: 0.6, ease: "power2.out" },
        "hit+=0.1",
      );
      tl.to(
        ".battle__hero",
        { x: 0, duration: 0.35, ease: "power2.out" },
        "hit+=0.3",
      );

      if (event.levelUp !== null) {
        tl.call(() => playSound("levelUp"), [], "hit+=0.5");
        tl.fromTo(
          ".battle__level",
          { autoAlpha: 1, x: -90, rotation: -8 },
          {
            x: 0,
            rotation: -3,
            duration: 0.3,
            ease: "back.out(2)",
            immediateRender: false,
          },
          "hit+=0.5",
        );
      }

      if (defeated) {
        tl.to(
          ".battle__boss",
          {
            rotation: 14,
            y: 26,
            autoAlpha: 0.3,
            filter: "grayscale(1) brightness(0.7)",
            duration: 0.5,
            ease: "power2.in",
          },
          "hit+=0.45",
        );
        tl.set(".battle__attack", { autoAlpha: 0 }, "hit+=0.8");
        tl.set(".battle__victory", { autoAlpha: 1 }, "hit+=0.8");
        tl.call(() => playSound("victory"), [], "hit+=0.8");
        tl.fromTo(
          ".battle__hero",
          { y: 0 },
          {
            y: -16,
            duration: 0.12,
            ease: "power1.out",
            yoyo: true,
            repeat: 3,
            immediateRender: false,
          },
          "hit+=0.85",
        );
      }

      // 4. кадр відлітає
      tl.addLabel("exit", exitAt);
      tl.to(dim, { autoAlpha: 0, duration: 0.3 }, "exit");
      tl.to(
        root,
        {
          x: -60,
          y: -20,
          rotation: -6,
          autoAlpha: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        "exit",
      );
    }, root);

    return () => ctx.revert();
  }, [event]);

  const hero = event ? BATTLE[event.avatar] : null;
  const boss = event ? BOSSES[event.bossArt] : null;

  return (
    <>
      {/* сама панель декоративна: для скрінрідерів є текстове повідомлення */}
      <div role="status" className="sr-only">
        {event ? announce(event) : ""}
      </div>

      {event && hero && boss && (
        <div
          key={`dim-${event.id}`}
          ref={dimRef}
          className="battle__dim"
          aria-hidden="true"
        />
      )}

      {event && hero && boss && (
        <div
          key={event.id}
          ref={fitRef}
          className="battle__fit"
          aria-hidden="true"
        >
          <div ref={rootRef} className="battle__wrap">
            <div className="battle__frame">
              <div
                className="battle__scene"
                style={{ backgroundImage: `url(${SKIES[event.sky]})` }}
              >
                <div className="battle__ground" />

                <svg
                  className="battle__lines"
                  viewBox="0 0 348 288"
                  width="348"
                  height="288"
                >
                  {LINES.map((pts, i) => (
                    <polygon key={i} points={pts} />
                  ))}
                </svg>

                <div className="battle__hero">
                  <Sprite
                    sprite={hero.attack}
                    scale={hero.scale}
                    className="battle__attack"
                  />
                  <Sprite
                    sprite={hero.victory}
                    scale={hero.scale}
                    className="battle__victory"
                  />
                </div>
                <div className="battle__boss">
                  <Sprite sprite={boss.sprite} scale={2} />
                </div>

                <svg
                  className="battle__burst"
                  viewBox="0 0 150 150"
                  width="150"
                  height="150"
                >
                  <polygon points={BURST} />
                </svg>
                <div className="battle__flash" />

                <span className="battle__sfx">{sfxFor(event)}</span>
                <span className="battle__damage">−{event.damage}</span>
                {event.levelUp !== null && (
                  <span className="battle__level">РІВЕНЬ {event.levelUp}!</span>
                )}

                <div className="battle__hud">
                  <span className="battle__name">{boss.name}</span>
                  <div className="battle__hp">
                    <div
                      className="battle__hp-fill"
                      style={{
                        width: `${(event.hpBefore / event.maxHp) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="battle__hp-text">
                    HP {event.hpBefore} → {event.hpAfter}
                    {event.xp > 0 ? ` · +${event.xp} XP` : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
