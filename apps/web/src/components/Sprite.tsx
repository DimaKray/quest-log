import Image from "next/image";
import type { SpriteDef } from "@/assets/registry";

/**
 * Піксельний спрайт. `scale` має бути цілим числом, інакше пікселі
 * вийдуть різної ширини. alt="" означає «суто декоративна картинка».
 */
export function Sprite({
  sprite,
  scale = 1,
  alt = "",
  className,
}: {
  sprite: SpriteDef;
  scale?: number;
  alt?: string;
  className?: string;
}) {
  return (
    <Image
      src={sprite.src}
      width={sprite.w * scale}
      height={sprite.h * scale}
      alt={alt}
      unoptimized
      draggable={false}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
