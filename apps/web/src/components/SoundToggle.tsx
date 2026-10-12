import { ICONS } from "@/assets/registry";
import { Sprite } from "./Sprite";

/** Кнопка звуку: pressed = звук увімкнений. */
export function SoundToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="pixel-btn min-h-11 min-w-11"
      aria-label="Звук"
      aria-pressed={enabled}
      title={enabled ? "Вимкнути звук" : "Увімкнути звук"}
      onClick={onToggle}
    >
      <Sprite sprite={enabled ? ICONS.soundOn : ICONS.soundOff} />
    </button>
  );
}
