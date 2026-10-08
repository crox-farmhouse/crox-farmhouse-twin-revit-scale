# Crox Farmhouse Twin

A browser-based digital twin of the Crox Farmhouse: a KNX smart home modelled room by room
in three.js. It runs a KNX bus emulator, so lighting circuits, scenes, under-floor heating
zones, gates, bi-fold doors and the Frame TV respond the way the real installation does. Trade
views (architect, builder, electrician, plumber) show the building services layer by layer.

Built with **Vite + TypeScript (strict) + three.js + Preact signals**.

> [!WARNING]
> GitHub Pages sites are publicly reachable by URL, even when they come from a private repo on
> the Team plan. The deployed twin shows the house layout and the KNX topology. `robots.txt`
> disallows all crawlers, but that only discourages indexing. It is not access control.

## Quick start

```bash
nvm use 20            # Node >= 20
npm ci
npm run dev           # http://localhost:5173/
```

Optional dev-only features:

| Feature | Requirement |
|---|---|
| KNX AI assistant (`/api/knx-ai` Vertex AI proxy) | `export GOOGLE_CLOUD_PROJECT=<your-project>` and `gcloud auth application-default login` before `npm run dev`. If `GOOGLE_CLOUD_PROJECT` is unset, the proxy answers `503`. There is no default project. |
| USD Stage Studio: load zones from `.usda` | `npm run usd:export` (writes `usd/zones/*.usda`, `usd/materials/materials.usda`) |
| USD override compile (`/api/usd/compile-overrides`) | Python 3 + Pixar `pxr` (`pip install usd-core`) |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with the dev-only middleware in `tools/dev-server/` |
| `npm run build` | `tsc --noEmit && vite build` → `dist/` |
| `npm run preview` | Serves `dist/` (use `VITE_BASE=/crox-farmhouse-twin/ npm run preview` after a sub-path build) |
| `npm run typecheck` | Type-checks the app (`tsconfig.json`) and the Node tooling (`tsconfig.node.json`) |
| `npm test` | Vitest unit tests for pure modules (Node, no WebGL) |
| `npm run check:boundaries` | Enforces the layer dependency rule (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)) |
| `npm run snapshot:check` / `snapshot:update` | Deterministic scene-graph fingerprint vs `.snapshots/scene.snap` |
| `npm run lighting:check` | Headless check that lighting depends only on KNX state + time of day |
| `npm run usd:export` | Generates the ASCII OpenUSD stage (`usd/*.usda`, zones, materials, lighting). Node only |
| `npm run usd:compile` | Compiles `.usdc` / `.usdz` from the exported layers (needs `pxr`) |
| `npm run usd:build` | `usd:export` + `usd:compile` in one step |
| `npm run verify` | Everything CI runs: typecheck, boundaries, tests, snapshot, lighting, build |

## Controls

| Input | Action |
|---|---|
| Left drag / right drag / wheel | Orbit / pan / zoom (pivot is clamped to the site) |
| Double-click a surface | Fly to that point |
| `F` | Recenter |
| `1` / `2` / `3` | Ground floor / first floor / all floors |
| `W` | Walkthrough (first person). In walk mode: `WASD` to move, mouse to look, `Esc` to exit |
| `M` / `N` | Measure tool / note tool |
| `?` | Help |
| `Esc` | Close the top overlay, then return to orbit |
| Click a switch, door, gate or TV | Operates the device through the KNX emulator |

## Sharing links

**Share** copies a URL that carries the current view in one `?v=` parameter: camera, target,
floor, ortho/perspective, focused room, trade view and guest mode, base64url-encoded with
positions rounded to centimetres (`src/state/url-state.ts`). Developer and transport parameters
(`dev`, `knxWs`) are stripped from share links. Opening the link restores the view.

## Deployment

`.github/workflows/ci.yml` runs on every push and pull request:

1. `npm ci` → typecheck → boundaries → unit tests → snapshot → lighting
2. `npm run usd:export`, then `vite build` with `VITE_BASE=/crox-farmhouse-twin/` and
   `CROX_BUNDLE_USD=1`, which copies `usd/zones` and `usd/materials` into `dist/usd/` so the
   USD Stage Studio can load zones on Pages
3. **main only:** `actions/upload-pages-artifact` + `actions/deploy-pages`
4. **main and `v*` tags:** a separate `usd` job runs `pip install usd-core` and compiles
   `.usdc` / `.usdz`, then uploads the `crox-usd` workflow artifact (kept for 30 days). If this
   job fails, Pages still deploys.
5. **`v*` tags:** the `release` job attaches `crox_farmhouse.usdz`, `crox_farmhouse.usdc` and a
   zip of the `.usda` layers to the GitHub Release.

Generated USD files are git-ignored. To fetch the latest model:

```bash
gh release download -R crox-farmhouse/crox-farmhouse-twin -p '*.usdz'
```

Every asset URL in the app must respect the base path. Use
`` `${import.meta.env?.BASE_URL ?? '/'}textures/...` `` and never a bare `/textures/...`. To
check a sub-path build locally:

```bash
VITE_BASE=/crox-farmhouse-twin/ npx vite build
VITE_BASE=/crox-farmhouse-twin/ npx vite preview   # http://localhost:4173/crox-farmhouse-twin/
```

## More

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): layers, dependency rule, key abstractions, how to add rooms, devices and circuits
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md): verify checklist, coding rules, snapshot workflow
- [usd/README.md](usd/README.md): OpenUSD stage, Blender / Unreal workflows
- [tools/lighting/README.md](tools/lighting/README.md): lighting consistency rules
