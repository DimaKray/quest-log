"use client";

import { useEffect } from "react";
import { CURSOR_SPRITES, type SpriteDef } from "@/assets/registry";
import { cursorValue, findTip, type CursorImage } from "./cursor";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Cannot load ${src}`));
    img.src = src;
  });
}

/** Малює спрайт дзеркально (вістря зліва вгорі, як у стрілки) у canvas і віддає data URL + альфа-канал. */
function render(img: HTMLImageElement, sprite: SpriteDef, scale: number) {
  const canvas = document.createElement("canvas");
  canvas.width = sprite.w * scale;
  canvas.height = sprite.h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");
  ctx.imageSmoothingEnabled = false;
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const alpha = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3] ?? 0;
  return { url: canvas.toDataURL("image/png"), alpha, width: canvas.width, height: canvas.height };
}

async function build(sprite: SpriteDef, fallback: string): Promise<string> {
  const img = await loadImage(sprite.src);
  const x1 = render(img, sprite, 1);
  const x2 = render(img, sprite, 2);
  const image: CursorImage = {
    url1x: x1.url,
    url2x: x2.url,
    tip: findTip(x1.alpha, x1.width, x1.height),
  };
  return cursorValue(image, (v) => CSS.supports("cursor", v), fallback);
}

/**
 * Тематичний курсор: меч, а над кнопками вогняний меч. Значення кладе в
 * CSS-змінні --cursor-default / --cursor-pointer (див. battle.scss);
 * якщо щось не вийшло, лишається звичайний курсор.
 */
export function useThemedCursor() {
  useEffect(() => {
    let cancelled = false;
    const root = document.documentElement;
    Promise.all([
      build(CURSOR_SPRITES.normal, "auto"),
      build(CURSOR_SPRITES.action, "pointer"),
    ])
      .then(([normal, action]) => {
        if (cancelled) return;
        root.style.setProperty("--cursor-default", normal);
        root.style.setProperty("--cursor-pointer", action);
      })
      .catch(() => {
        /* без кастомного курсора теж працює */
      });
    return () => {
      cancelled = true;
      root.style.removeProperty("--cursor-default");
      root.style.removeProperty("--cursor-pointer");
    };
  }, []);
}