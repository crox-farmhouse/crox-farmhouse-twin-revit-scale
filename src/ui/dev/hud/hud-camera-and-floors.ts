import type { LodPolicyMode, RoomLodDiagnostics } from '../../../core/entities.ts';
import type { GraphicsQualityPreset } from '../../../engine/rendering/post-processing-pipeline.ts';
import type { PropertyScene } from '../../../engine/viewer/property-scene.ts';
import { devStore } from '../dev-store.ts';
import type { CameraPresetName, FloorViewMode } from '../../../core/types/scene.ts';
import { requireElement } from './hud-types.ts';

export function syncFloorModeUI(scene: PropertyScene): void {
  const mode = scene.getFloorViewMode();
  const isCutaway = scene.isCeilingCutaway();
  document.querySelectorAll<HTMLButtonElement>('.floor-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.floor === mode);
  });
  const floorReadout = document.getElementById('floor-mode-readout');
  if (floorReadout) {
    floorReadout.textContent =
      mode === 'ground'
        ? 'GROUND FLOOR'
        : mode === 'first'
          ? '1ST FLOOR'
          : 'FULL HOUSE + ROOF';
  }
  const roofStateLabel = document.getElementById('roof-state-label');
  if (roofStateLabel) {
    roofStateLabel.textContent = isCutaway ? 'Ceiling: Cut' : 'Ceiling: Solid';
  }

  devStore.syncViewportState({
    floorViewMode: mode,
    ceilingCutaway: isCutaway,
    activeRoomId: scene.getFocusedRoomShortName().toLowerCase(),
  });
}

export function syncLodReadoutUI(diag: RoomLodDiagnostics): void {
  const lodReadout = document.getElementById('lod-status-readout');
  if (lodReadout) {
    const focusedRoom = diag.rooms.find((r) => r.zoneId === diag.focusedZoneId);
    const roomName = (focusedRoom?.shortName ?? diag.focusedZoneId).toUpperCase();
    const tierLabel =
      diag.focusedZoneTier === 2
        ? 'LOD2 HERO'
        : diag.focusedZoneTier === 1
          ? 'LOD1 ROOM'
          : 'LOD0 SHELL';
    if (diag.policyMode === 'auto') {
      lodReadout.textContent = `${roomName} · ${tierLabel} (L2:${diag.tierCounts[2]} L1:${diag.tierCounts[1]} L0:${diag.tierCounts[0]})`;
    } else {
      lodReadout.textContent = `FIXED · ${tierLabel}`;
    }
  }
  document.querySelectorAll<HTMLButtonElement>('.lod-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lod === diag.policyMode);
  });
  devStore.syncViewportState({
    activeRoomId: diag.focusedZoneId,
  });
}

export function syncGraphicsUI(scene: PropertyScene): void {
  const gfx = scene.getGraphicsSettings();
  const presetLabel =
    gfx.quality === 'ultra'
      ? 'Ultra'
      : gfx.quality === 'balanced'
        ? 'Balanced'
        : '120Hz Perf';

  document.querySelectorAll<HTMLButtonElement>('.gfx-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.gfx === gfx.quality);
  });

  const hudBlurBtn = document.getElementById('hud-motion-blur-btn');
  if (hudBlurBtn) {
    hudBlurBtn.classList.toggle('active', gfx.motionBlurEnabled);
    hudBlurBtn.textContent = gfx.motionBlurEnabled ? 'Blur: ON' : 'Blur: OFF';
  }

  const gfxReadout = document.getElementById('gfx-status-readout');
  if (gfxReadout) {
    const features: string[] = [presetLabel.toUpperCase()];
    features.push(gfx.motionBlurEnabled ? 'SHUTTER BLUR' : 'BLUR OFF');
    if (gfx.ambientOcclusionEnabled) features.push('SSAO');
    if (gfx.bloomEnabled) features.push('BLOOM');
    gfxReadout.textContent = features.join(' · ');
  }

  const wtBlurBtn = document.getElementById('walkthrough-blur-btn');
  if (wtBlurBtn) {
    wtBlurBtn.classList.toggle('is-active', gfx.motionBlurEnabled);
    wtBlurBtn.textContent = gfx.motionBlurEnabled ? 'Blur: ON (B)' : 'Blur: OFF (B)';
  }

  const wtGfxBtn = document.getElementById('walkthrough-gfx-btn');
  if (wtGfxBtn) {
    wtGfxBtn.textContent = `GFX: ${presetLabel}`;
  }
}

export function syncWalkthroughReadout(scene: PropertyScene): void {
  const posReadout = document.getElementById('walkthrough-pos-readout');
  const wt = scene.getWalkthrough();
  const foot = wt.getFootPosition();
  const roomName = scene.getFocusedRoomShortName().toUpperCase();
  const sign = foot.y >= 0 ? '+' : '';
  const fps = wt.getSmoothedFps();
  const label = `${roomName} · ${sign}${foot.y.toFixed(2)}m · ${fps} FPS`;
  if (posReadout) {
    posReadout.textContent = label;
  }
  devStore.syncViewportState({
    walkthroughFloorLabel: label,
    fpsCount: fps,
    activeRoomId: roomName.toLowerCase(),
  });
}

export function syncWalkthroughUI(scene: PropertyScene): void {
  const wt = scene.getWalkthrough();
  const active = wt.isActive();
  const crouched = wt.isCrouched();
  const pointerLocked = wt.isPointerLocked();
  const targetPrompt = wt.getTargetedPrompt();

  const floatingEnterBtn = document.getElementById('walkthrough-floating-enter-btn');
  if (floatingEnterBtn) {
    floatingEnterBtn.hidden = active;
  }

  const toggleBtn = document.getElementById('toggle-walkthrough-btn');
  const dot = document.getElementById('walkthrough-dot');
  const stateLabel = document.getElementById('walkthrough-state-label');
  if (toggleBtn) {
    toggleBtn.classList.toggle('is-walkthrough-active', active);
  }
  if (dot) {
    dot.className = active
      ? 'hud-rocker-dot walkthrough-green-dot'
      : 'hud-rocker-dot off-state';
  }
  if (stateLabel) {
    stateLabel.textContent = active
      ? '1st-Person Walkthrough: Active (WASD · F Interact · V Exit)'
      : '1st-Person Walkthrough: Off (Press V or F)';
  }

  const hudBanner = document.getElementById('walkthrough-hud');
  if (hudBanner) {
    hudBanner.hidden = !active;
  }

  const reticle = document.getElementById('walkthrough-reticle');
  if (reticle) {
    reticle.hidden = !active;
    reticle.classList.toggle('is-target-locked', Boolean(active && targetPrompt));
  }

  const interactPromptEl = document.getElementById('walkthrough-interact-prompt');
  const interactLabelEl = document.getElementById('walkthrough-interact-label');
  if (interactPromptEl && interactLabelEl) {
    if (active && targetPrompt) {
      interactLabelEl.textContent = `to ${targetPrompt}`;
      interactPromptEl.hidden = false;
    } else {
      interactPromptEl.hidden = true;
    }
  }

  const fovBtn = document.getElementById('walkthrough-fov-btn');
  if (fovBtn) {
    fovBtn.textContent = `FOV: ${wt.getBaseFov()}°`;
  }

  const crouchBtn = document.getElementById('walkthrough-crouch-btn');
  if (crouchBtn) {
    crouchBtn.classList.toggle('is-active', crouched);
    crouchBtn.textContent = crouched ? 'Crouched (C)' : 'Stand (C)';
  }

  const mouseLookBtn = document.getElementById('walkthrough-mouselook-btn');
  if (mouseLookBtn) {
    mouseLookBtn.classList.toggle('is-active', pointerLocked);
    mouseLookBtn.textContent = pointerLocked ? 'Mouse Locked (Esc)' : 'Mouse Look';
  }

  devStore.syncViewportState({
    walkthroughActive: active,
  });

  syncGraphicsUI(scene);

  if (active) {
    syncWalkthroughReadout(scene);
  }
}

export function bindCameraAndFloorEvents(scene: PropertyScene): void {
  document.querySelectorAll<HTMLButtonElement>('.floor-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const floorMode = btn.dataset.floor as FloorViewMode | undefined;
      if (!floorMode) return;
      scene.setFloorViewMode(floorMode);
      syncFloorModeUI(scene);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.cam-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.cam as CameraPresetName | undefined;
      if (!preset) return;
      document
        .querySelectorAll<HTMLButtonElement>('.cam-btn')
        .forEach((b) => b.classList.toggle('active', b === btn));
      scene.flyToPreset(preset);
      syncFloorModeUI(scene);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.lod-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lodMode = btn.dataset.lod as LodPolicyMode | undefined;
      if (!lodMode) return;
      document
        .querySelectorAll<HTMLButtonElement>('.lod-btn')
        .forEach((b) => b.classList.toggle('active', b === btn));
      scene.setLodPolicyMode(lodMode);
      syncLodReadoutUI(scene.getLodDiagnostics());
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.gfx-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gfxPreset = btn.dataset.gfx as GraphicsQualityPreset | undefined;
      if (!gfxPreset) return;
      scene.setGraphicsQualityPreset(gfxPreset);
      syncGraphicsUI(scene);
    });
  });

  const hudMotionBlurBtn = document.getElementById('hud-motion-blur-btn');
  hudMotionBlurBtn?.addEventListener('click', () => {
    scene.toggleMotionBlur();
    syncGraphicsUI(scene);
  });

  const toggleRoofBtn = requireElement<HTMLButtonElement>('toggle-roof-btn');
  toggleRoofBtn.addEventListener('click', () => {
    scene.toggleCeilingCutaway();
    syncFloorModeUI(scene);
  });

  const toggleBtn = document.getElementById('toggle-walkthrough-btn');
  toggleBtn?.addEventListener('click', () => {
    scene.toggleWalkthroughMode();
    syncWalkthroughUI(scene);
    syncFloorModeUI(scene);
  });

  const floatingEnterBtn = document.getElementById('walkthrough-floating-enter-btn');
  floatingEnterBtn?.addEventListener('click', () => {
    scene.setWalkthroughMode(true);
    syncWalkthroughUI(scene);
    syncFloorModeUI(scene);
  });

  const exitBtn = document.getElementById('walkthrough-exit-btn');
  exitBtn?.addEventListener('click', () => {
    scene.setWalkthroughMode(false);
    syncWalkthroughUI(scene);
    syncFloorModeUI(scene);
  });

  const fovBtn = document.getElementById('walkthrough-fov-btn');
  fovBtn?.addEventListener('click', () => {
    scene.getWalkthrough().cycleBaseFov();
    syncWalkthroughUI(scene);
  });

  const blurBtn = document.getElementById('walkthrough-blur-btn');
  blurBtn?.addEventListener('click', () => {
    scene.toggleMotionBlur();
    syncGraphicsUI(scene);
  });

  const gfxBtn = document.getElementById('walkthrough-gfx-btn');
  gfxBtn?.addEventListener('click', () => {
    scene.cycleGraphicsQualityPreset();
    syncGraphicsUI(scene);
  });

  const crouchBtn = document.getElementById('walkthrough-crouch-btn');
  crouchBtn?.addEventListener('click', () => {
    scene.getWalkthrough().toggleCrouched();
    syncWalkthroughUI(scene);
  });

  const mouseLookBtn = document.getElementById('walkthrough-mouselook-btn');
  mouseLookBtn?.addEventListener('click', () => {
    scene.getWalkthrough().requestMouseLock();
  });

  document.querySelectorAll<HTMLButtonElement>('.walkthrough-spawn-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const spawnId = btn.dataset.spawn;
      if (!spawnId) return;
      if (!scene.isWalkthroughMode()) {
        scene.setWalkthroughMode(true, spawnId);
      } else {
        scene.getWalkthrough().teleportToSpawn(spawnId);
      }
      document
        .querySelectorAll<HTMLButtonElement>('.walkthrough-spawn-btn')
        .forEach((b) => b.classList.toggle('active', b === btn));
      syncWalkthroughUI(scene);
    });
  });

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const activeEl = document.activeElement;
    const tag = activeEl?.tagName ?? '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // F (recenter), W (walk), 1/2/3 (floors), M/N (tools) are owned by the UI shell
    // keyboard map; B (motion blur) is only available in developer mode.
    if (e.code === 'KeyB' && !e.repeat && document.body.classList.contains('is-dev-mode')) {
      e.preventDefault();
      scene.toggleMotionBlur();
      syncGraphicsUI(scene);
      return;
    }

    if (e.code === 'KeyV' && !e.repeat) {
      e.preventDefault();
      if (tag === 'SELECT' || tag === 'BUTTON') {
        (activeEl as HTMLElement).blur();
      }
      scene.toggleWalkthroughMode();
      syncWalkthroughUI(scene);
      syncFloorModeUI(scene);
    } else if (
      e.code === 'Escape' &&
      scene.isWalkthroughMode() &&
      !scene.getWalkthrough().isPointerLocked()
    ) {
      e.preventDefault();
      scene.setWalkthroughMode(false);
      syncWalkthroughUI(scene);
      syncFloorModeUI(scene);
    }
  });

  scene.getWalkthrough().subscribe(() => {
    syncWalkthroughUI(scene);
    syncFloorModeUI(scene);
  });

  // Keep the floor buttons in sync with changes made elsewhere (shell, share links, notes).
  let lastFloorMode = scene.getFloorViewMode();
  let lastCutaway = scene.isCeilingCutaway();
  scene.onViewChanged((view) => {
    if (scene.isWalkthroughMode()) {
      syncWalkthroughReadout(scene);
    }
    const cutaway = scene.isCeilingCutaway();
    if (view.floorViewMode !== lastFloorMode || cutaway !== lastCutaway) {
      lastFloorMode = view.floorViewMode;
      lastCutaway = cutaway;
      syncFloorModeUI(scene);
    }
  });

  syncWalkthroughUI(scene);
  syncGraphicsUI(scene);
}
