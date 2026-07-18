// Runs after `vite build`. Reads dist/sitemap.xml and creates dist/<route>/index.html
// as a copy of dist/index.html for every listed URL. This makes GitHub Pages serve
// the SPA with HTTP 200 on deep links (instead of falling back to 404.html with HTTP 404),
// which is required for Google indexing.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";

const distDir = resolve("dist");
const indexHtml = join(distDir, "index.html");
const sitemapPath = join(distDir, "sitemap.xml");

if (!existsSync(indexHtml)) {
  console.warn("[prerender] dist/index.html missing, skipping");
  process.exit(0);
}
if (!existsSync(sitemapPath)) {
  console.warn("[prerender] dist/sitemap.xml missing, skipping");
  process.exit(0);
}

const html = readFileSync(indexHtml, "utf8");
const sitemap = readFileSync(sitemapPath, "utf8");

const locs = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);

let written = 0;
for (const loc of locs) {
  let path: string;
  try {
    path = new URL(loc).pathname;
  } catch {
    continue;
  }
  if (path === "/" || path === "") continue;
  const clean = path.replace(/^\/+|\/+$/g, "");
  const target = join(distDir, clean, "index.html");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html);
  written++;
}

console.log(`[prerender] wrote ${written} route HTML files`);
