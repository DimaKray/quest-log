"use client";

import { useEffect } from "react";
import { playSound } from "./sound";

/**
 * Тихий «тік» на кожне натискання кнопки, вкладки чи списку.
 * Елементи з data-sfx="off" (або всередині них) мають власний звук і тік не грають.
 */
export function useUiSounds() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest('button, [role="tab"], [role="radio"], select, a[href]');
      if (!el || el.matches(":disabled") || el.closest('[data-sfx="off"]')) return;
      playSound("click");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}