import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@questlog/engine"],
  // Значок dev-режиму лежить поверх лівої вкладки нижньої панелі на мобільному
  // й перехоплює кліки. Помилки в оверлеї це не вимикає.
  devIndicators: false,
};

export default nextConfig;