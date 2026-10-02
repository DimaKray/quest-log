import type { Metadata } from "next";
import { IBM_Plex_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import "../styles/pixel.scss";

// Заголовки, рівень, числа: піксельний шрифт
const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-pixel",
});

// Основний текст: читабельний моноширинний (у Pixelify Sans літера «в» схожа на «е»)
const body = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Квест-лог",
  description: "Планувальник задач, де продуктивність качає героя",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={`${pixel.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
