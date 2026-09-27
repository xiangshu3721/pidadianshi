import type { NextConfig } from "next";

/**
 * `npm run build` sets STATIC_EXPORT=1 and emits a GitHub Pages project site
 * under /pidadianshi/. `npm run dev` leaves this unset so the local API route
 * can still run.
 */
const pages = process.env.STATIC_EXPORT === "1";
const basePath = "/pidadianshi";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  ...(pages
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: basePath,
        trailingSlash: true,
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: pages ? basePath : "",
    NEXT_PUBLIC_STATIC_EXPORT: pages ? "1" : "",
  },
};

export default nextConfig;
