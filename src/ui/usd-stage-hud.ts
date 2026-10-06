import type { PropertyScene } from '../engine/scene/property-scene.ts';
import {
  INITIAL_INCREMENTAL_USDA_ZONES,
  type UsdIndexedPrimInfo,
  type UsdLodVariant,
  type UsdRoofCutawayVariant,
  type UsdStageRuntimeController,
  type UsdViewportDiagnosticMode,
} from '../engine/usd/stage-runtime.ts';
import { CROX_FARMHOUSE_USD_OVERRIDE_LAYER } from '../homes/crox-farmhouse/usd/layout-overrides.ts';
import { twinStore } from '../state/twin-store.ts';
import { mountUsdQuickStats } from './components/UsdQuickStats.tsx';

function requireEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Required USD HUD DOM element #${id} not found`);
  }
  return el as T;
}

export class UsdStageHudController {
  private readonly scene: PropertyScene;
  private readonly runtime: UsdStageRuntimeController;
  private readonly onFloorModeChanged?: () => void;

  private readonly panelEl: HTMLElement;
  private readonly titlebarEl: HTMLElement;
  private readonly collapseBtn: HTMLButtonElement;
  private readonly primCountBadgeEl: HTMLElement;

  // Telemetry & Diagnostic Mode buttons
  private readonly statsGridEl: HTMLElement;
  private readonly diagPbrBtn: HTMLButtonElement;
  private readonly diagTypesBtn: HTMLButtonElement;
  private readonly diagPhysBtn: HTMLButtonElement;
  private readonly diagMtlxBtn: HTMLButtonElement;
  private readonly diagLegendEl: HTMLElement;

  // VariantSet controls
  private readonly varLodHeroBtn: HTMLButtonElement;
  private readonly varLodStdBtn: HTMLButtonElement;
  private readonly varLodShellBtn: HTMLButtonElement;
  private readonly varCutawayGroundBtn: HTMLButtonElement;
  private readonly varCutawayFullBtn: HTMLButtonElement;

  // Selected USD Prim Inspector
  private readonly primPathEl: HTMLElement;
  private readonly primBadgesEl: HTMLElement;
  private readonly primMatEl: HTMLElement;
  private readonly primUsdaPreEl: HTMLElement;
  private readonly copyPrimBtn: HTMLButtonElement;
  private readonly insertOverBtn: HTMLButtonElement;

  // Sublayer list
  private readonly sublayerCountEl: HTMLElement;
  private readonly sublayerShowAllBtn: HTMLButtonElement;
  private readonly sublayerListEl: HTMLElement;

  // Live #usda Override & Parametric Authoring Editor
  private readonly overrideTextareaEl: HTMLTextAreaElement;
  private readonly applyOverrideBtn: HTMLButtonElement;
  private readonly sampleCubeBtn: HTMLButtonElement;
  private readonly compilePxrBtn: HTMLButtonElement;
  private readonly compileStatusEl: HTMLElement;

  private selectedPrim: UsdIndexedPrimInfo | null = null;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  public constructor(
    scene: PropertyScene,
    onFloorModeChanged?: () => void
  ) {
    this.scene = scene;
    this.runtime = scene.getUsdRuntime();
    this.onFloorModeChanged = onFloorModeChanged;

    this.panelEl = requireEl<HTMLElement>('usd-stage-panel');
    this.titlebarEl = requireEl<HTMLElement>('usd-stage-titlebar');
    this.collapseBtn = requireEl<HTMLButtonElement>('usd-stage-collapse-btn');
    this.primCountBadgeEl = requireEl<HTMLElement>('usd-stage-prim-badge');

    this.statsGridEl = requireEl<HTMLElement>('usd-stage-stats-grid');
    this.diagPbrBtn = requireEl<HTMLButtonElement>('usd-diag-pbr');
    this.diagTypesBtn = requireEl<HTMLButtonElement>('usd-diag-types');
    this.diagPhysBtn = requireEl<HTMLButtonElement>('usd-diag-phys');
    this.diagMtlxBtn = requireEl<HTMLButtonElement>('usd-diag-mtlx');
    this.diagLegendEl = requireEl<HTMLElement>('usd-diag-legend');

    this.varLodHeroBtn = requireEl<HTMLButtonElement>('usd-var-lod-hero');
    this.varLodStdBtn = requireEl<HTMLButtonElement>('usd-var-lod-std');
    this.varLodShellBtn = requireEl<HTMLButtonElement>('usd-var-lod-shell');
    this.varCutawayGroundBtn = requireEl<HTMLButtonElement>('usd-var-cut-ground');
    this.varCutawayFullBtn = requireEl<HTMLButtonElement>('usd-var-cut-full');

    this.primPathEl = requireEl<HTMLElement>('usd-prim-path');
    this.primBadgesEl = requireEl<HTMLElement>('usd-prim-badges');
    this.primMatEl = requireEl<HTMLElement>('usd-prim-mat');
    this.primUsdaPreEl = requireEl<HTMLElement>('usd-prim-usda-pre');
    this.copyPrimBtn = requireEl<HTMLButtonElement>('usd-copy-prim-btn');
    this.insertOverBtn = requireEl<HTMLButtonElement>('usd-insert-over-btn');

    this.sublayerCountEl = requireEl<HTMLElement>('usd-sublayer-count');
    this.sublayerShowAllBtn = requireEl<HTMLButtonElement>('usd-sublayer-showall-btn');
    this.sublayerListEl = requireEl<HTMLElement>('usd-sublayer-list');

    this.overrideTextareaEl = requireEl<HTMLTextAreaElement>('usd-override-textarea');
    this.applyOverrideBtn = requireEl<HTMLButtonElement>('usd-apply-override-btn');
    this.sampleCubeBtn = requireEl<HTMLButtonElement>('usd-sample-cube-btn');
    this.compilePxrBtn = requireEl<HTMLButtonElement>('usd-compile-pxr-btn');
    this.compileStatusEl = requireEl<HTMLElement>('usd-compile-status');

    this.overrideTextareaEl.value = CROX_FARMHOUSE_USD_OVERRIDE_LAYER.trim();

    // Select a default kitchen island or sofa prim so the inspector is populated immediately
    const initialCandidates = this.runtime.searchPrims('kitchen', 5);
    if (initialCandidates.length > 0) {
      this.selectedPrim = initialCandidates[0];
    }

    this.bindDraggableWindow();
    this.bindEvents();

    this.runtime.subscribe(() => {
      if (this.selectedPrim) {
        const updated = this.runtime.getPrimInfoByPath(this.selectedPrim.primPath);
        if (updated) {
          this.selectedPrim = updated;
        }
      }
      this.render();
    });

    this.scene.setOnUsdPrimPick((info) => {
      this.selectedPrim = info;
      this.renderPrimInspector();
    });

    mountUsdQuickStats(this.statsGridEl);
    this.render();
    void this.loadInitialIncrementalUsdaZones();
  }

  private async loadInitialIncrementalUsdaZones(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const usdZonesParam = params.get('usdZones');
    if (usdZonesParam === 'all') {
      await this.runtime.loadAllZonesFromUsdaFiles();
      return;
    }
    if (usdZonesParam === 'none') {
      return;
    }
    const zonesToLoad = usdZonesParam
      ? usdZonesParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : INITIAL_INCREMENTAL_USDA_ZONES;
    await this.runtime.loadZonesFromUsdaFiles(zonesToLoad);
  }

  private bindDraggableWindow(): void {
    this.collapseBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      const collapsed = this.panelEl.classList.toggle('is-collapsed');
      twinStore.syncUsdStageState({ usdPanelOpen: !collapsed });
    });

    this.titlebarEl.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.target === this.collapseBtn) return;
      this.isDragging = true;
      const rect = this.panelEl.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      this.titlebarEl.setPointerCapture(e.pointerId);
    });

    this.titlebarEl.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isDragging) return;
      const maxX = Math.max(0, window.innerWidth - this.panelEl.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - 28);
      const nextLeft = Math.max(0, Math.min(maxX, e.clientX - this.dragOffsetX));
      const nextTop = Math.max(0, Math.min(maxY, e.clientY - this.dragOffsetY));
      this.panelEl.style.left = `${nextLeft}px`;
      this.panelEl.style.top = `${nextTop}px`;
    });

    const stopDrag = (): void => {
      this.isDragging = false;
    };
    this.titlebarEl.addEventListener('pointerup', stopDrag);
    this.titlebarEl.addEventListener('pointercancel', stopDrag);
  }

  private bindEvents(): void {
    const setDiag = (mode: UsdViewportDiagnosticMode): void => {
      this.runtime.setDiagnosticMode(mode);
    };
    this.diagPbrBtn.addEventListener('click', () => setDiag('pbr'));
    this.diagTypesBtn.addEventListener('click', () => setDiag('primTypes'));
    this.diagPhysBtn.addEventListener('click', () => setDiag('physicsColliders'));
    this.diagMtlxBtn.addEventListener('click', () => setDiag('materialArchetypes'));

    const setLod = (v: UsdLodVariant): void => {
      this.runtime.setLodVariant(v);
    };
    this.varLodHeroBtn.addEventListener('click', () => setLod('hero'));
    this.varLodStdBtn.addEventListener('click', () => setLod('standard'));
    this.varLodShellBtn.addEventListener('click', () => setLod('shell'));

    const setCutaway = (v: UsdRoofCutawayVariant): void => {
      this.runtime.setRoofCutawayVariant(v);
      this.onFloorModeChanged?.();
    };
    this.varCutawayGroundBtn.addEventListener('click', () =>
      setCutaway('groundFloorCutaway')
    );
    this.varCutawayFullBtn.addEventListener('click', () => setCutaway('fullBuilding'));

    this.sublayerShowAllBtn.addEventListener('click', () => {
      this.runtime.setAllZonesMuted(false);
    });

    this.copyPrimBtn.addEventListener('click', async () => {
      if (!this.selectedPrim) return;
      const snippet = this.runtime.formatPrimUsdaSnippet(this.selectedPrim);
      try {
        await navigator.clipboard.writeText(snippet);
      } catch {
        // Fallback ignored
      }
      const orig = this.copyPrimBtn.textContent;
      this.copyPrimBtn.textContent = 'Copied #usda!';
      setTimeout(() => {
        this.copyPrimBtn.textContent = orig;
      }, 1500);
    });

    this.insertOverBtn.addEventListener('click', () => {
      if (!this.selectedPrim) return;
      const p = this.selectedPrim;
      const [cx, cy, cz] = p.worldCenter;
      const overSnippet = `#usda 1.0
(
    defaultPrim = "CroxFarmhouse"
    metersPerUnit = 1
    upAxis = "Y"
)

over "CroxFarmhouse"
{
    over "Zones"
    {
        over "${p.zoneId}"
        {
            over "${p.primName}" (
                doc = "Live override on ${p.objectName}"
            )
            {
                custom string twin:targetName = "${p.objectName}"
                token visibility = "inherited"
            }
        }
    }

    def Sphere "Marker_${p.primName}"
    {
        double radius = 0.14
        color3f[] primvars:displayColor = [(0.22, 0.74, 0.97)]
        double3 xformOp:translate = (${cx}, ${(cy + 0.35).toFixed(3)}, ${cz})
        uniform token[] xformOpOrder = ["xformOp:translate"]
    }
}`;
      this.overrideTextareaEl.value = overSnippet;
      const res = this.runtime.applyLiveUsdaLayerText(overSnippet);
      this.compileStatusEl.hidden = false;
      this.compileStatusEl.textContent = `Applied in viewport: ${res.overridesApplied} over(s), ${res.primsCreated} new USD prim(s).`;
    });

    this.applyOverrideBtn.addEventListener('click', () => {
      const text = this.overrideTextareaEl.value;
      const res = this.runtime.applyLiveUsdaLayerText(text);
      this.compileStatusEl.hidden = false;
      this.compileStatusEl.textContent = `Live USD Layer applied: ${res.overridesApplied} over(s), ${res.primsCreated} procedural prim(s) spawned.`;
    });

    this.sampleCubeBtn.addEventListener('click', () => {
      const sample = `#usda 1.0
(
    defaultPrim = "CroxFarmhouse"
    doc = "Live OpenUSD procedural prims & overrides"
    metersPerUnit = 1
    upAxis = "Y"
)

over "CroxFarmhouse"
{
    def Cylinder "IslandSculpturalVase"
    {
        double radius = 0.14
        double height = 0.42
        color3f[] primvars:displayColor = [(0.85, 0.65, 0.32)]
        double3 xformOp:translate = (0.0, 1.12, -0.2)
        double3 xformOp:rotateXYZ = (0, 0, 0)
        double3 xformOp:scale = (1, 1, 1)
        uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:rotateXYZ", "xformOp:scale"]
    }
}`;
      this.overrideTextareaEl.value = sample;
      const res = this.runtime.applyLiveUsdaLayerText(sample);
      this.compileStatusEl.hidden = false;
      this.compileStatusEl.textContent = `Spawned ${res.primsCreated} live USD Cylinder prim on Kitchen Island!`;
    });

    this.compilePxrBtn.addEventListener('click', async () => {
      const usda = this.overrideTextareaEl.value;
      this.runtime.applyLiveUsdaLayerText(usda);
      this.compileStatusEl.hidden = false;
      this.compileStatusEl.textContent =
        'Compiling usd/crox_farmhouse.usdc & .usdz via Pixar C++ pxr SDK...';
      this.compilePxrBtn.disabled = true;

      try {
        const resp = await fetch('/api/usd/compile-overrides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usda }),
        });
        const data = (await resp.json()) as { ok?: boolean; output?: string; error?: string };
        if (!resp.ok || !data.ok) {
          this.compileStatusEl.textContent = `pxr Error: ${data.error ?? 'Compile failed'}`;
        } else {
          this.compileStatusEl.textContent = data.output ?? 'Compiled .usdc & .usdz!';
        }
      } catch (err) {
        this.compileStatusEl.textContent = `Network error: ${err instanceof Error ? err.message : String(err)}`;
      } finally {
        this.compilePxrBtn.disabled = false;
      }
    });
  }

  private render(): void {
    const stats = this.runtime.getStageStats();
    this.primCountBadgeEl.textContent = `${stats.usdaZoneCount}/${stats.sublayerCount} .usda · ${stats.totalPrims.toLocaleString()} prims`;

    twinStore.syncUsdStageState({
      usdPanelOpen: !this.panelEl.classList.contains('is-collapsed'),
      usdStageStats: stats,
      selectedUsdPrimPath: this.selectedPrim?.primPath ?? null,
    });

    // Diagnostic mode buttons & legend
    const mode = stats.diagnosticMode;
    this.diagPbrBtn.classList.toggle('active', mode === 'pbr');
    this.diagTypesBtn.classList.toggle('active', mode === 'primTypes');
    this.diagPhysBtn.classList.toggle('active', mode === 'physicsColliders');
    this.diagMtlxBtn.classList.toggle('active', mode === 'materialArchetypes');

    if (mode === 'primTypes') {
      this.diagLegendEl.hidden = false;
      this.diagLegendEl.innerHTML = `
        <span class="usd-legend-pill"><i style="background:#38bdf8"></i>Cube (${stats.cubeCount})</span>
        <span class="usd-legend-pill"><i style="background:#2dd4bf"></i>Cylinder (${stats.cylinderCount})</span>
        <span class="usd-legend-pill"><i style="background:#fbbf24"></i>Sphere (${stats.sphereCount})</span>
        <span class="usd-legend-pill"><i style="background:#c084fc"></i>Mesh (${stats.meshCount})</span>
      `;
    } else if (mode === 'physicsColliders') {
      this.diagLegendEl.hidden = false;
      this.diagLegendEl.innerHTML = `
        <span class="usd-legend-pill"><i style="background:#10b981"></i>PhysicsCollisionAPI (${stats.colliderCount} walkable/structural)</span>
        <span class="usd-legend-pill"><i style="background:#334155"></i>Visual Only</span>
      `;
    } else if (mode === 'materialArchetypes') {
      this.diagLegendEl.hidden = false;
      this.diagLegendEl.innerHTML = `
        <span class="usd-legend-pill"><i style="background:#d95f43"></i>Brick</span>
        <span class="usd-legend-pill"><i style="background:#e07a5f"></i>Herringbone</span>
        <span class="usd-legend-pill"><i style="background:#38bdf8"></i>Tile</span>
        <span class="usd-legend-pill"><i style="background:#d4a373"></i>Wood</span>
        <span class="usd-legend-pill"><i style="background:#f3e5ab"></i>Plaster</span>
        <span class="usd-legend-pill"><i style="background:#a855f7"></i>Fabric</span>
        <span class="usd-legend-pill"><i style="background:#67e8f9"></i>Glass</span>
      `;
    } else {
      this.diagLegendEl.hidden = true;
    }

    // VariantSet buttons
    this.varLodHeroBtn.classList.toggle('active', stats.lodVariant === 'hero');
    this.varLodStdBtn.classList.toggle('active', stats.lodVariant === 'standard');
    this.varLodShellBtn.classList.toggle('active', stats.lodVariant === 'shell');

    this.varCutawayGroundBtn.classList.toggle(
      'active',
      stats.roofCutawayVariant === 'groundFloorCutaway'
    );
    this.varCutawayFullBtn.classList.toggle(
      'active',
      stats.roofCutawayVariant === 'fullBuilding'
    );

    this.renderPrimInspector();
    this.renderSublayerList();
  }

  private renderPrimInspector(): void {
    const p = this.selectedPrim;
    twinStore.syncUsdStageState({
      selectedUsdPrimPath: p?.primPath ?? null,
    });
    if (!p) {
      this.primPathEl.textContent = 'Click any 3D object in the scene to inspect its USD Prim';
      this.primBadgesEl.innerHTML = '';
      this.primMatEl.textContent = '';
      this.primUsdaPreEl.textContent = '';
      return;
    }

    const sourceBadge = p.usdaSourceOfTruth
      ? '<span class="usd-badge usd-badge-phys" title="Mesh instantiated directly from /usd/zones/*.usda">.usda Source ✓</span>'
      : '<span class="usd-badge usd-badge-kind" title="Mesh built by TypeScript builder (click TS→.usda on sublayer to migrate)">TS Builder</span>';

    this.primPathEl.textContent = p.primPath;
    this.primBadgesEl.innerHTML = `
      ${sourceBadge}
      <span class="usd-badge usd-badge-type">def ${p.typeName}</span>
      <span class="usd-badge usd-badge-kind">kind = "${p.kind}"</span>
      ${p.physicsCollision ? '<span class="usd-badge usd-badge-phys">PhysicsCollisionAPI</span>' : ''}
      <a class="usd-badge usd-badge-link" href="/${p.sublayerFile}" target="_blank" rel="noopener" title="Open ${p.sublayerFile}">${p.sublayerFile.replace('usd/', '')} ↗</a>
    `;
    this.primMatEl.textContent = `MaterialX: ${p.materialPath} (${p.materialArchetype})`;
    this.primUsdaPreEl.textContent = this.runtime.formatPrimUsdaSnippet(p);
  }

  private renderSublayerList(): void {
    const sublayers = this.runtime.getZoneSublayers();
    const usdaCount = sublayers.filter((s) => s.sourceMode === 'usda').length;
    this.sublayerCountEl.textContent = `${usdaCount}/${sublayers.length} .USDA SOURCE`;

    this.sublayerListEl.innerHTML = '';

    // Top bar inside sublayer list to migrate all remaining zones to .usda in one click
    if (usdaCount < sublayers.length) {
      const migrateBar = document.createElement('div');
      migrateBar.className = 'usd-sublayer-row';
      migrateBar.style.justifyContent = 'space-between';
      migrateBar.style.background = 'rgba(16, 185, 129, 0.08)';
      migrateBar.style.borderColor = 'rgba(16, 185, 129, 0.28)';

      const label = document.createElement('span');
      label.className = 'usd-sublayer-name';
      label.style.color = '#6ee7b7';
      label.textContent = `Incremental Migration: ${usdaCount}/${sublayers.length} zones on .usda`;

      const loadAllBtn = document.createElement('button');
      loadAllBtn.type = 'button';
      loadAllBtn.className = 'hud-inline-btn usd-solo-btn';
      loadAllBtn.style.borderColor = 'rgba(16, 185, 129, 0.45)';
      loadAllBtn.style.color = '#6ee7b7';
      loadAllBtn.textContent = 'Load All 20 (.usda)';
      loadAllBtn.addEventListener('click', async () => {
        loadAllBtn.disabled = true;
        loadAllBtn.textContent = 'Loading .usda...';
        await this.runtime.loadAllZonesFromUsdaFiles();
      });

      migrateBar.append(label, loadAllBtn);
      this.sublayerListEl.appendChild(migrateBar);
    }

    for (const sub of sublayers) {
      const row = document.createElement('div');
      row.className = `usd-sublayer-row ${sub.muted ? 'is-muted' : ''}`;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !sub.muted;
      cb.title = `Mute / Unmute sublayer zones/${sub.fileName}`;
      cb.addEventListener('change', () => {
        this.runtime.setZoneMuted(sub.zoneId, !cb.checked);
      });

      const nameSpan = document.createElement('span');
      nameSpan.className = 'usd-sublayer-name';
      nameSpan.textContent = sub.label;
      nameSpan.title = `${sub.fileName}: ${sub.cubeCount} Cube, ${sub.cylinderCount} Cylinder, ${sub.sphereCount} Sphere, ${sub.meshCount} Mesh`;

      const countSpan = document.createElement('span');
      countSpan.className = 'usd-sublayer-meta';
      countSpan.textContent = `${sub.totalPrims}`;

      const sourceBtn = document.createElement('button');
      sourceBtn.type = 'button';
      sourceBtn.className = 'hud-inline-btn usd-solo-btn';
      if (sub.sourceMode === 'usda') {
        sourceBtn.textContent = '.usda ✓';
        sourceBtn.style.color = '#34d399';
        sourceBtn.style.borderColor = 'rgba(52, 211, 153, 0.45)';
        sourceBtn.title = `Live meshes in ${sub.label} are loaded directly from /usd/zones/${sub.fileName}`;
      } else {
        sourceBtn.textContent = 'TS → .usda';
        sourceBtn.title = `Click to replace TypeScript builder meshes in ${sub.label} with /usd/zones/${sub.fileName}`;
        sourceBtn.addEventListener('click', async () => {
          sourceBtn.disabled = true;
          sourceBtn.textContent = '...';
          await this.runtime.loadZoneFromUsdaFile(sub.zoneId);
        });
      }

      const soloBtn = document.createElement('button');
      soloBtn.type = 'button';
      soloBtn.className = 'hud-inline-btn usd-solo-btn';
      soloBtn.textContent = 'Solo';
      soloBtn.title = `Solo only zones/${sub.fileName} in viewport (click again to restore all)`;
      soloBtn.addEventListener('click', () => {
        this.runtime.soloZone(sub.zoneId);
      });

      const openLink = document.createElement('a');
      openLink.className = 'usd-sublayer-link';
      openLink.href = `/usd/zones/${sub.fileName}`;
      openLink.target = '_blank';
      openLink.rel = 'noopener';
      openLink.textContent = 'raw';
      openLink.title = `View raw /usd/zones/${sub.fileName}`;

      row.append(cb, nameSpan, countSpan, sourceBtn, soloBtn, openLink);
      this.sublayerListEl.appendChild(row);
    }
  }
}
