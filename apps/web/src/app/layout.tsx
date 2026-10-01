import type { Metadata } from "next";
import { Pixelify_Sans, Press_Start_2P } from "next/font/google";
import "./globals.css";
import "../styles/pixel.scss";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-pixel",
});

const body = Pixelify_Sans({
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