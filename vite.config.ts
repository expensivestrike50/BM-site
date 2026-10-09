// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages build (`npm run build:pages`): a fully static, prerendered site
// served from a sub-path (https://<user>.github.io/BM-site/). Every other build,
// including Lovable's, is unchanged.
const pagesBase = process.env["PAGES_BASE"];

// Site media is referenced through `*.asset.json` pointers to Lovable's asset
// host. GitHub Pages can't reach that host, so the Pages build points each one
// at its local copy in public/bm-assets/ instead (the JSON files stay as-is).
const localAssets = {
  name: "bm:local-assets",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    if (!pagesBase || !id.endsWith(".asset.json")) return;
    const asset = JSON.parse(code);
    asset.url = `${pagesBase}bm-assets/${asset.original_filename}`;
    return { code: JSON.stringify(asset), map: null };
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(pagesBase ? { prerender: { enabled: true, crawlLinks: true, failOnError: false } } : {}),
  },
  ...(pagesBase ? { nitro: false as const, vite: { base: pagesBase, plugins: [localAssets] } } : {}),
});
