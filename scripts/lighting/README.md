# Lighting consistency checks

Lighting in the twin must be a **pure function of KNX light state + time of day**.
Camera position, zoom, orthographic/perspective, floor view mode (`ground` / `first` /
`all`), ceiling cutaway, camera-facing wall cutaways and the focused room must **not** change:

- any light's intensity, colour or range,
- which lights are active (`NUM_POINT_LIGHTS` stays constant, so no shader recompiles),
- the set of shadow casters seen by the sun / point-light shadow passes,
- fixture glow (light-group emissive intensity).

The one deliberate exception is the overhead fixture *shade opacity* (see-through in cutaway
views). It is a material transparency aid and doesn't emit light.

## Automated (headless) check

```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"   # if node is not on PATH
node scripts/lighting/run.mjs
```

This works like `tools/snapshot/run.mjs`: esbuild bundles
`scripts/lighting/consistency-check.ts` to `.snapshots/lighting-consistency-cli.mjs`, then
runs it under Node with the recording-canvas stubs. No WebGL is needed. The check:

1. Builds the Crox Farmhouse scene through the same path as `PropertyScene`: scene content,
   `RoomLodController`, `CutawayController`, `SceneBatchOptimizer.optimize()` and
   `CircuitLightingController.applyLevels()`, with every circuit at a distinct dim level at night.
2. For each of **3 floor modes** × **5 cameras** (close, mid and far orbit, plus zoomed-in and
   zoomed-out orthographic plan), it calls `cutaways.update(...)`,
   `optimizer.syncPointLightVisibilityAndDistance(...)` and `optimizer.stepFades(...)`, then records:
   - per-light `active` (visible in hierarchy), effective intensity, colour and distance,
   - active-light counts per light type,
   - light-group emissive intensities,
   - shadow casters, using the cutaway shadow-pass hooks to simulate a real shadow pass.
3. Asserts that lights, counts and emissives are identical across all 15 views. It also asserts
   that shadow casters are identical across the 5 cameras within each floor mode. Across floor
   modes, shadow-caster counts are reported for information only: switching floors changes the
   LOD of furniture on the hidden floor, which is an intentional geometry change.
4. Checks that the point-light budget (`setPointLightBudget(4)` anchored on `kitchen`) fades
   in about 250 ms and that moving the camera afterwards doesn't change the budgeted set.

Exit code `0` prints `PASS`. Exit code `1` lists the first 40 inconsistencies. On the
pre-fix baseline (`76b6549`) the check reports 180 inconsistencies: lights muted by camera
distance or a hidden first floor, and shadow casters that change with zoom.

You can't add it as an npm script yet, because `package.json` is owned by another workstream.
Once it's free, the suggested entry is `"lighting:check": "node scripts/lighting/run.mjs"`.

## Manual luminance check (acceptance test §3.2, ±2 %)

The headless check proves the *inputs* to lighting are camera-independent. The on-screen
check also covers post-processing (exposure, AO, tone mapping). Those live in
`post-processing-pipeline.ts` and `environment-lighting.ts`, which are owned by other workstreams.

1. `npm run dev`, open the twin, then set a fixed time of day and KNX scene (for example Evening).
2. Pick one viewpoint (for example the kitchen preset) and don't orbit.
3. For each zoom step (5 wheel positions, from close to far) and each floor mode
   (Ground / First / All), run this in the DevTools console:

   ```js
   // Average luminance of the WebGL canvas (Rec. 709 weights, linear-ish 0..1).
   (() => {
     const c = document.querySelector('canvas');
     const o = new OffscreenCanvas(c.width, c.height);
     const g = o.getContext('2d');
     g.drawImage(c, 0, 0);
     const d = g.getImageData(0, 0, c.width, c.height).data;
     let s = 0;
     for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
     return (s / (d.length / 4) / 255).toFixed(4);
   })();
   ```

   (The renderer must use `preserveDrawingBuffer`, or you must run the snippet straight after a
   render. Otherwise capture with a DevTools screenshot and measure it offline.)
4. Compare the luminance of a **fixed screen-space region that shows the same surfaces**
   (crop the snippet to that region) across zoom levels and floor modes. The variation must
   stay within ±2 %. Whole-frame averages also change because different geometry is framed,
   so use the same room's floor or wall region.
5. Spot checks:
   - Zoom out to the far orbit. Rooms must not go dark (lights used to switch off beyond 28–32 m).
   - Switch to Ground. Ground-floor ceilings and the stairwell keep the upstairs light spill, and
     sun shadows from the hidden first floor and roof remain (hidden geometry still casts shadows).
   - Orbit so camera-facing walls cut away. The sun patches on the floor must not move or appear.

## Implementation notes (where the invariants live)

| Invariant | Code |
|---|---|
| No camera-distance or hidden-floor muting | `SceneBatchOptimizer.syncPointLightVisibilityAndDistance` (camera args ignored) |
| Lights under hideable layers stay active | `SceneBatchOptimizer.consolidateAndHoistPointLights` hoists lights under any cutaway layer to `scene` |
| Fixed, room-anchored light budget with 250 ms fades | `SceneBatchOptimizer.setPointLightBudget` / `setBudgetAnchorZone` / `stepFades` |
| KNX intensity = level × time of day × budget weight | `CircuitLightingController.applyLevels` |
| Hidden cutaway geometry still casts shadows | `CutawayController` shadow-pass hooks (`setShadowCastersIgnoreCutaway`) |
| LOD never flips shadow casters | `RoomLodController`: LOD2 and runtime-distance props are permanently `castShadow = false`; the tier-1 boundary depends only on floor mode |
| Shader culling uses only the light's own `distance` | `shader-light-culling.ts` |
