# Octoscript website

English | [简体中文](README.zh-CN.md)

The independent bilingual website for [Octoscript](https://github.com/OctoSense-org/Octoscript), maintained in [OctoSense-org/Octoscript-website](https://github.com/OctoSense-org/Octoscript-website). English is at `/`; Simplified Chinese is at `/cn/`.

The site covers the DSL's motivation, syntax, host authority, L0–L3 rendering layers, UI capability levels, Splash, native composition and agent tooling. Eight guides in each language explain the contracts on the page. A searchable component catalog and a real Makepad/WebAssembly lab accompany the design-to-component examples. Light and dark themes are supported.

## Run locally

Only Node.js >= 22.12 and npm are needed to build the website. No sibling repository, Rust toolchain or remote content fetch is required.

```sh
git clone https://github.com/OctoSense-org/Octoscript-website.git
cd Octoscript-website
npm ci
npm run dev
```

Open **http://localhost:4325** or **http://localhost:4325/cn/**.

```sh
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
```

The build checks Astro/TypeScript and writes the static site to `dist/`. Playwright starts its own preview on port 4335, independent of the development server. To test an already running preview, set `PLAYWRIGHT_BASE_URL`. The browser suite covers bilingual navigation, accessibility, mobile layouts, themes, source copying, lazy WASM loading, real native canvas input/state updates and failure recovery. GitHub Actions runs these checks on pushes and pull requests. On `main`, the checked build is then published to GitHub Pages.

## Content and source ownership

- `src/data/content.ts`: bilingual interface and homepage copy.
- `src/content/guides/`: website-owned introductions and reference guides.
- `src/content/upstream/octoscript/`: checked-in snapshots of six language-repository documents, the workflow fixture and their license. `sources.json` records original paths, the source base commit and exact file hashes. The snapshot includes local documentation updates from the extraction; it is not claimed to match that commit byte for byte.
- `src/data/docs.ts`: combines the guides and snapshots into the documentation routes.
- `scripts/doc-links.mjs`: maps relative Markdown links to local guides; optional upstream source references still point to the language repository.
- `src/components/`: homepage sections, component catalog, WASM panel and recorded design-flow inspector.
- `src/styles/`: typography, responsive layout and light/dark theme tokens.
- `public/examples/provenance.json`: image source hashes and the archived design review's status.

All imports resolve within this repository. Edit website content here. To refresh an upstream snapshot, review the corresponding language-repository document, copy it into the same snapshot path, and update its manifest hash and provenance. Changes in the language repository do not silently change the website.

The design inspector shows recorded mappings and native captures; it does not run a vision model. The archived review still records remaining visual differences. Purchased Sketch assets are not redistributed. The school, delivery and travel cards use browser-only sample data; their approvals do not run workflows or external actions.

## Makepad / WASM lab

`public/wasm/component-lab/` contains the prebuilt Rust/Makepad host, browser loader, required fonts, licenses and build receipt. It is intentionally versioned so a fresh website checkout can run the demos without rebuilding Rust. Material controls update local Rust state; Flutter examples are Octoscript recreations rendered by Makepad, not Flutter Engine. Some presets provide visual and navigation examples with unsupported device operations stubbed.

The Rust host, DSL sources, exact dependency revisions, runtime patch and offline build script are in [`demos/component-lab/`](demos/component-lab/README.md). Rebuilding that optional runtime requires separately prepared pinned dependencies and an installed Rust toolchain. Website development and CI use the included package.

## Static hosting

Set the actual publishing origin and optional path prefix at build time:

```sh
SITE_URL=https://your-domain.example BASE_PATH=/ npm run build
npm run preview
```

Upload `dist/` to a static host. For a project subpath, use `BASE_PATH=/Octoscript-website/`. Routes, assets, Markdown links, sitemap and locale alternatives use that prefix. The default URL remains local until a publishing URL is configured.

Production is <https://octoscript.org/>, served by GitHub Pages. `.github/workflows/ci.yml` builds with that origin, runs the full suite against the build, and deploys the same `dist/` on pushes to `main`. It can also be started manually from the Actions tab. The custom domain is set in the repository's Pages settings, so no `CNAME` file is needed.

## Licenses

The inherited MIT license is retained in `LICENSE` and alongside the upstream snapshots. Fontsource licenses are in `public/font-licenses/`. The WASM distribution includes Makepad's MIT license, Octoscript-Makepad's Apache-2.0 license and bundled font attribution in `public/wasm/component-lab/licenses/` and `THIRD_PARTY_NOTICES.md`.

