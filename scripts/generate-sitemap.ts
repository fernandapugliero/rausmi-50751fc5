// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://rausmi.lovable.app";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gghxpohlnrporovhoqyp.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaHhwb2hsbnJwb3JvdmhvcXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTI5ODYsImV4cCI6MjA4ODQ4ODk4Nn0.urG7luFKpTL1fqDZRwbHu_wPHVY1EjVukXBEj2aR_t8";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/jetzt", changefreq: "hourly", priority: "0.9" },
  { path: "/heute", changefreq: "hourly", priority: "0.9" },
  { path: "/morgen", changefreq: "daily", priority: "0.9" },
  { path: "/ueber", changefreq: "monthly", priority: "0.6" },
  { path: "/kontakt", changefreq: "yearly", priority: "0.4" },
  { path: "/impressum", changefreq: "yearly", priority: "0.2" },
  { path: "/datenschutz", changefreq: "yearly", priority: "0.2" },
];

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

async function main() {
  const entries: SitemapEntry[] = [...staticEntries];

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const [{ data: acts }, { data: cafes }] = await Promise.all([
      supabase
        .from("activities")
        .select("id, updated_at, is_approved, is_hidden")
        .eq("is_approved", true)
        .eq("is_hidden", false),
      supabase
        .from("kindercafes")
        .select("id, updated_at, is_approved")
        .eq("is_approved", true),
    ]);

    for (const a of acts ?? []) {
      entries.push({
        path: `/activity/${a.id}`,
        lastmod: a.updated_at ? new Date(a.updated_at).toISOString().slice(0, 10) : undefined,
        changefreq: "weekly",
        priority: "0.7",
      });
    }
    for (const c of cafes ?? []) {
      entries.push({
        path: `/kindercafe/${c.id}`,
        lastmod: c.updated_at ? new Date(c.updated_at).toISOString().slice(0, 10) : undefined,
        changefreq: "monthly",
        priority: "0.6",
      });
    }
  } catch (err) {
    console.warn("[sitemap] Skipped dynamic entries:", (err as Error).message);
  }

  writeFileSync(resolve("public/sitemap.xml"), renderSitemap(entries));
  console.log(`[sitemap] wrote public/sitemap.xml (${entries.length} entries)`);
}

main().catch((e) => {
  console.error("[sitemap] failed:", e);
  // Don't fail the build.
  process.exit(0);
});
