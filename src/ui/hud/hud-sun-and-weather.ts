import type { PropertyScene } from '../../engine/scene/property-scene.ts';
import type { KNXPropertyBusController } from '../../knx/emulator.ts';
import { timeOfDayToSunMinutes, twinStore } from '../../state/twin-store.ts';
import type { TimeOfDay } from '../../types/scene.ts';
import { requireElement, type HudSharedContext } from './hud-types.ts';

export const TOD_LUX_MAP: Readonly<Record<TimeOfDay, number>> = {
  day: 480,
  dusk: 38,
  night: 5,
};

export function syncEnvironmentButtonsUI(
  knx: KNXPropertyBusController,
  scene: PropertyScene
): void {
  const lux = knx.getAmbientLux();
  const activeTod: TimeOfDay = lux >= 200 ? 'day' : lux >= 20 ? 'dusk' : 'night';
  document.querySelectorAll<HTMLButtonElement>('.tod-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tod === activeTod);
  });
  const bifoldStateLabel = document.getElementById('bifold-state-label');
  if (bifoldStateLabel) {
    bifoldStateLabel.textContent = scene.isBifoldsOpen()
      ? 'Bifolds: Open'
      : 'Bifolds: Closed';
  }
  twinStore.syncViewportState({
    sunMinutes: timeOfDayToSunMinutes(activeTod),
  });
}

export function syncUfhUI(scene: PropertyScene): void {
  const ufh = scene.getUfhSystem();
  if (!ufh) return;
  const visible = ufh.isLayerVisible();
  const zones = ufh.getZones();
  const onCount = zones.filter((z) => z.heatingOn).length;

  const readout = document.getElementById('ufh-status-readout');
  if (readout) {
    readout.textContent = `${onCount}/${zones.length} ZONES ON · ${visible ? 'X-RAY ON' : 'LAYER OFF'}`;
  }

  const layerBtn = document.getElementById('toggle-ufh-layer-btn');
  const layerDot = document.getElementById('ufh-layer-dot');
  const layerLabel = document.getElementById('ufh-layer-state-label');
  if (layerBtn) {
    layerBtn.classList.toggle('is-ufh-active', visible);
  }
  if (layerDot) {
    layerDot.className = visible
      ? `hud-rocker-dot ${onCount > 0 ? 'ufh-red-dot' : 'ufh-blue-dot'}`
      : 'hud-rocker-dot off-state';
  }
  if (layerLabel) {
    layerLabel.textContent = visible
      ? 'UFH Pipes Layer: X-Ray On (Click Pipe to Toggle)'
      : 'UFH Pipes Layer: Off';
  }

  document.querySelectorAll<HTMLButtonElement>('.ufh-zone-btn').forEach((btn) => {
    const zoneId = btn.dataset.ufhZone as
      | 'ufhZone1'
      | 'ufhZone2'
      | 'ufhZone3'
      | 'ufhZone4'
      | undefined;
    if (!zoneId) return;
    const zone = ufh.getZone(zoneId);
    if (!zone) return;
    btn.classList.toggle('is-ufh-on', zone.heatingOn);
    btn.classList.toggle('is-ufh-off', !zone.heatingOn);
    btn.textContent = `${zone.shortName} · ${zone.heatingOn ? 'ON' : 'OFF'}`;
  });

  const env = ufh.getEnvironment();
  const envReadout = document.getElementById('ufh-env-readout');
  if (envReadout) {
    const modeLabel = env.startMode === 'setback' ? 'SETBACK 18°C' : 'COLD 14°C';
    envReadout.textContent = `${env.outdoorTempC}°C OUT · ${modeLabel}`;
  }

  document.querySelectorAll<HTMLButtonElement>('.ufh-out-btn').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.outTemp) === env.outdoorTempC);
  });
  document.querySelectorAll<HTMLButtonElement>('.ufh-mode-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.startMode === env.startMode);
  });

  const warmupGrid = document.getElementById('ufh-warmup-grid');
  if (warmupGrid) {
    warmupGrid.innerHTML = '';
    for (const zone of zones) {
      const est = ufh.getZoneWarmupEstimate(zone.id);
      if (!est) continue;
      const card = document.createElement('div');
      card.className = `hud-ufh-warmup-card ${zone.heatingOn ? 'is-on' : 'is-off'}`;
      card.title = `${zone.name} (${zone.manifoldLabel}) — Output: ${est.emitterOutputW}W · Steady Heat Loss at ${est.targetTempC}°C: ${est.steadyHeatLossAtTargetW}W · Thermal Lag: ${est.emitterLagMinutes}m`;

      const head = document.createElement('div');
      head.className = 'hud-ufh-warmup-head';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'hud-ufh-warmup-zone';
      titleSpan.textContent = zone.shortName;
      const timeBadge = document.createElement('span');
      timeBadge.className = `hud-ufh-warmup-time ${est.emitterLagMinutes <= 15 ? 'is-fast' : 'is-screed'}`;
      timeBadge.textContent = est.formattedDuration;
      head.append(titleSpan, timeBadge);

      const meta = document.createElement('div');
      meta.className = 'hud-ufh-warmup-meta';
      const netKw = (est.netBoostPowerAtStartW / 1000).toFixed(1);
      meta.textContent = `${est.startTempC}→${est.targetTempC}°C · +${netKw}kW net · ${est.emitterLagMinutes}m lag`;

      card.append(head, meta);
      warmupGrid.appendChild(card);
    }
  }
}

export function bindSunAndWeatherEvents(ctx: HudSharedContext): void {
  const { knx, scene, onFloorModeChanged } = ctx;

  document.querySelectorAll<HTMLButtonElement>('.tod-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tod = btn.dataset.tod as TimeOfDay | undefined;
      if (!tod) return;
      document
        .querySelectorAll<HTMLButtonElement>('.tod-btn')
        .forEach((b) => b.classList.toggle('active', b === btn));
      scene.setTimeOfDay(tod);
      knx.setAmbientLux(TOD_LUX_MAP[tod], true);
      twinStore.syncViewportState({
        sunMinutes: timeOfDayToSunMinutes(tod),
      });
    });
  });

  const toggleBifoldsBtn = requireElement<HTMLButtonElement>('toggle-bifolds-btn');
  const bifoldStateLabel = requireElement<HTMLElement>('bifold-state-label');
  toggleBifoldsBtn.addEventListener('click', () => {
    const isOpen = scene.toggleBifolds();
    bifoldStateLabel.textContent = isOpen ? 'Bifolds: Open' : 'Bifolds: Closed';
  });

  const toggleUfhLayerBtn = document.getElementById('toggle-ufh-layer-btn');
  toggleUfhLayerBtn?.addEventListener('click', () => {
    const visible = scene.toggleUfhLayer();
    if (visible && scene.getFloorViewMode() === 'first') {
      scene.setFloorViewMode('ground');
      onFloorModeChanged();
    }
    syncUfhUI(scene);
  });

  document.querySelectorAll<HTMLButtonElement>('.ufh-zone-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const zoneId = btn.dataset.ufhZone as
        | 'ufhZone1'
        | 'ufhZone2'
        | 'ufhZone3'
        | 'ufhZone4'
        | undefined;
      if (!zoneId) return;
      if (!scene.isUfhLayerVisible()) {
        scene.setUfhLayerVisible(true);
        if (scene.getFloorViewMode() === 'first') {
          scene.setFloorViewMode('ground');
          onFloorModeChanged();
        }
      }
      scene.toggleUfhZone(zoneId);
      syncUfhUI(scene);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.ufh-out-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tempVal = Number(btn.dataset.outTemp);
      if (Number.isNaN(tempVal)) return;
      scene.getUfhSystem()?.setOutdoorTempC(tempVal);
      syncUfhUI(scene);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.ufh-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.startMode as 'setback' | 'cold' | undefined;
      if (!mode) return;
      scene.getUfhSystem()?.setStartMode(mode);
      syncUfhUI(scene);
    });
  });

  scene.getUfhSystem()?.subscribe(() => {
    syncUfhUI(scene);
  });
  syncUfhUI(scene);
}
