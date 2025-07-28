// @ts-check
import withSerwistInit from "@serwist/next";

// You may want to use a more robust revision to cache
// files more efficiently.
// A viable option is `git rev-parse HEAD`.
const revision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  cacheOnNavigation: true,
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/favicon.webp", revision },
    { url: "/manifest.json", revision },
    { url: "/robots.txt", revision },
    { url: "/~offline", revision },
    { url: "/icons/icon-144.webp", revision },
    { url: "/icons/icon-180.webp", revision },
    { url: "/icons/icon-192.webp", revision },
    { url: "/icons/icon-256.webp", revision },
    { url: "/icons/icon-384.webp", revision },
    { url: "/icons/icon-512.webp", revision },
    // Додайте інші важливі сторінки/ресурси
  ],
});

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
