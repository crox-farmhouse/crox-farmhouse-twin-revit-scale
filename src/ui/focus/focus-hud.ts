import type { FocusController, FocusState } from '../../engine/focus/focus-controller.ts';
import type { PropertyScene } from '../../engine/scene/property-scene.ts';
import type { KNXPropertyBusController } from '../../knx/emulator.ts';
import type { CircuitConfig, CircuitId } from '../../types/knx.ts';
import type { FloorId } from '../../types/topology.ts';
import { twinStore } from '../../state/twin-store.ts';
import type { HomeHudModel, HudFloor, HudRoom, HudRoomScene } from './hud-model.ts';

type ElChild = HTMLElement | string;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  children: readonly ElChild[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  for (const child of children) {
    node.append(child);
  }
  return node;
}

function button(className: string, label: string, onClick: () => void, title = ''): HTMLButtonElement {
  const b = el('button', className, [label]);
  b.type = 'button';
  if (title) b.title = title;
  b.addEventListener('click', onClick);
  return b;
}

export interface FocusHudOptions {
  readonly knx: KNXPropertyBusController;
  readonly scene: PropertyScene;
  readonly model: HomeHudModel;
  readonly focus: FocusController;
  /** Container of the HUD sections; the focus section is inserted first. */
  readonly hudBody: HTMLElement;
  /** Camera preset used when navigating to whole-home focus. */
  readonly propertyPresetId: string;
  /** Camera preset per floor used when navigating to floor focus. */
  readonly floorPresetIds: Readonly<Partial<Record<FloorId, string>>>;
  /** Physical address used for gate commands issued from the HUD. */
  readonly gatePa: string;
  /** Physical address used for courtyard light commands issued from the HUD. */
  readonly courtyardSwitchPa: string;
  /** Called after focus navigation changes the scene's floor view mode. */
  readonly onFloorViewModeChanged?: () => void;
}

/**
 * Focus-aware HUD: a breadcrumb (Home › Floor › Room), a context panel whose
 * controls change with the focused level, and scoping of the existing HUD
 * sections (`data-hud-levels` / `data-hud-zones`) and circuit rows.
 *
 * Focus follows the camera automatically; zoom all the way out for whole-home
 * controls (gates, courtyard, all-off), mid distance for a floor overview, and
 * close in for a single room. Double-click a room to fly into it. The pin
 * button locks the current focus.
 */
export class FocusHudController {
  private readonly opts: FocusHudOptions;
  private readonly section: HTMLElement;
  private readonly crumbs: HTMLElement;
  private readonly pinBtn: HTMLButtonElement;
  private readonly panel: HTMLElement;
  private pendingViewUpdate = false;

  public constructor(opts: FocusHudOptions) {
    this.opts = opts;

    this.crumbs = el('nav', 'hud-focus-crumbs');
    this.crumbs.setAttribute('aria-label', 'Focus');
    this.pinBtn = button('hud-inline-btn hud-focus-pin', 'Auto', () => {
      this.opts.focus.setPinned(!this.opts.focus.getState().pinned);
    });
    this.pinBtn.title = 'Focus follows the camera. Click to pin the current focus.';
    this.panel = el('div', 'hud-focus-panel');

    this.section = el('section', 'hud-section hud-focus-section', [
      el('div', 'hud-section-head hud-focus-head', [this.crumbs, this.pinBtn]),
      this.panel,
    ]);
    this.section.id = 'hud-focus-section';
    opts.hudBody.prepend(this.section);

    opts.focus.subscribe(() => this.render());
    opts.scene.onViewChanged(() => this.scheduleViewUpdate());
    opts.scene.setOnSurfaceDoubleClick((p) => {
      const room = opts.focus.findRoomAt(p.x, p.y, p.z);
      if (room?.isInterior) {
        const hudRoom = opts.model.getRoom(room.zoneId);
        if (hudRoom) this.goToRoom(hudRoom);
      }
    });
    opts.knx.subscribe((event) => {
      if (event.type === 'stateChange') {
        this.renderPanel();
      }
    });
    opts.scene.getUfhSystem()?.subscribe(() => {
      this.renderPanel();
    });

    const initial = opts.scene.getViewState();
    opts.focus.update(initial);
    this.render();
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  private goToProperty(): void {
    const { focus, scene, propertyPresetId } = this.opts;
    focus.focus('property', focus.getState().floorId, null);
    scene.flyToPreset(propertyPresetId);
  }

  private goToFloor(floorId: FloorId): void {
    const { focus, scene, floorPresetIds } = this.opts;
    focus.focus('floor', floorId, null);
    const preset = floorPresetIds[floorId];
    if (preset) {
      scene.flyToPreset(preset);
    }
    scene.setFloorViewMode(floorId === 'first' ? 'first' : 'ground');
    this.opts.onFloorViewModeChanged?.();
  }

  private goToRoom(room: HudRoom): void {
    this.opts.focus.focus('room', room.floorId, room.zoneId);
    this.opts.scene.flyToRoomBounds(room.bounds, room.floorId === 'first' ? 'first' : 'ground');
    this.opts.onFloorViewModeChanged?.();
  }

  private scheduleViewUpdate(): void {
    if (this.pendingViewUpdate) return;
    this.pendingViewUpdate = true;
    requestAnimationFrame(() => {
      this.pendingViewUpdate = false;
      this.opts.focus.update(this.opts.scene.getViewState());
    });
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  private render(): void {
    const state = this.opts.focus.getState();
    this.syncTwinFocusStore(state);
    this.renderCrumbs(state);
    this.pinBtn.textContent = state.pinned ? 'Pinned' : 'Auto';
    this.pinBtn.classList.toggle('active', state.pinned);
    this.applySectionScopes(state);
    this.applyCircuitRowScope(state);
    this.renderPanel();
  }

  private syncTwinFocusStore(state: FocusState): void {
    if (state.level === 'room' && state.zoneId) {
      const room = this.opts.model.getRoom(state.zoneId);
      twinStore.syncFocusState({
        focusedApplianceId: state.zoneId,
        focusedApplianceLabel: room?.name ?? state.zoneId,
        focusModalOpen: state.pinned,
        activeRoomId: state.zoneId,
      });
    } else if (state.level === 'floor') {
      const floor = this.opts.model.floors.find((f) => f.floorId === state.floorId);
      twinStore.syncFocusState({
        focusedApplianceId: state.floorId,
        focusedApplianceLabel: floor?.name ?? state.floorId,
        focusModalOpen: state.pinned,
      });
    } else {
      twinStore.syncFocusState({
        focusedApplianceId: null,
        focusedApplianceLabel: this.opts.model.homeName,
        focusModalOpen: state.pinned,
      });
    }
  }

  private renderCrumbs(state: FocusState): void {
    const { model } = this.opts;
    const parts: HTMLElement[] = [];
    const crumb = (label: string, active: boolean, onClick: () => void): HTMLButtonElement => {
      const b = button(`hud-crumb${active ? ' is-current' : ''}`, label, onClick);
      if (active) b.setAttribute('aria-current', 'location');
      return b;
    };
    const sep = (): HTMLElement => el('span', 'hud-crumb-sep', ['›']);

    parts.push(crumb(model.homeName, state.level === 'property', () => this.goToProperty()));
    if (state.level !== 'property') {
      const floor = model.floors.find((f) => f.floorId === state.floorId);
      parts.push(sep(), crumb(floor?.name ?? state.floorId, state.level === 'floor', () =>
        this.goToFloor(state.floorId)
      ));
    }
    if (state.level === 'room' && state.zoneId) {
      const room = model.getRoom(state.zoneId);
      parts.push(sep(), crumb(room?.shortName ?? state.zoneId, true, () => {
        if (room) this.goToRoom(room);
      }));
    }
    this.crumbs.replaceChildren(...parts);
  }

  private renderPanel(): void {
    const state = this.opts.focus.getState();
    if (state.level === 'room' && state.zoneId) {
      const room = this.opts.model.getRoom(state.zoneId);
      this.panel.replaceChildren(room ? this.buildRoomPanel(room) : el('div', 'hud-focus-note'));
    } else if (state.level === 'floor') {
      const floor = this.opts.model.floors.find((f) => f.floorId === state.floorId);
      this.panel.replaceChildren(floor ? this.buildFloorPanel(floor) : el('div', 'hud-focus-note'));
    } else {
      this.panel.replaceChildren(this.buildPropertyPanel());
    }
  }

  private levelOf(id: CircuitId): number {
    return Math.round(this.opts.knx.getTargetLevels()[id] ?? 0);
  }

  private countOn(circuits: readonly CircuitConfig[]): number {
    return circuits.filter((c) => this.levelOf(c.id) > 0).length;
  }

  private setAll(circuits: readonly CircuitConfig[], level: number): void {
    for (const c of circuits) {
      this.opts.knx.setCircuitLevel(c.id, level, true);
    }
  }

  private buildLightingActions(circuits: readonly CircuitConfig[], scopeLabel: string): HTMLElement {
    return el('div', 'hud-seg-row hud-focus-actions', [
      button('hud-seg-btn', 'All Off', () => this.setAll(circuits, 0), `Turn off every light in ${scopeLabel}`),
      button('hud-seg-btn', '50%', () => this.setAll(circuits, 50), `Set every light in ${scopeLabel} to 50%`),
      button('hud-seg-btn', 'Full', () => this.setAll(circuits, 100), `Set every light in ${scopeLabel} to 100%`),
    ]);
  }

  private isRoomSceneActive(scene: HudRoomScene): boolean {
    for (const [key, targetVal] of Object.entries(scene.levels)) {
      if (typeof targetVal === 'number' && Math.abs(this.levelOf(key as CircuitId) - targetVal) > 2) {
        return false;
      }
    }
    return true;
  }

  private applyRoomScene(scene: HudRoomScene): void {
    for (const [key, targetVal] of Object.entries(scene.levels)) {
      if (typeof targetVal === 'number') {
        this.opts.knx.setCircuitLevel(key as CircuitId, targetVal, true);
      }
    }
  }

  private buildRoomScenesRow(room: HudRoom, scenes: readonly HudRoomScene[]): HTMLElement {
    const buttons = scenes.map((sc) => {
      const active = this.isRoomSceneActive(sc);
      return button(
        `hud-seg-btn${active ? ' active' : ''}`,
        sc.label,
        () => this.applyRoomScene(sc),
        `Activate ${sc.label} scene in ${room.shortName}`
      );
    });
    return el('div', 'hud-seg-row hud-focus-actions', buttons);
  }

  private buildRoomPanel(room: HudRoom): HTMLElement {
    const on = this.countOn(room.circuits);
    const summary =
      room.circuits.length === 0
        ? 'No KNX lighting circuits in this room'
        : `${on}/${room.circuits.length} lighting circuit${room.circuits.length === 1 ? '' : 's'} on`;
    const children: HTMLElement[] = [
      el('div', 'hud-focus-title', [room.name]),
      el('div', 'hud-focus-note', [summary]),
    ];
    if (room.scenes && room.scenes.length > 0) {
      children.push(this.buildRoomScenesRow(room, room.scenes));
    }
    if (room.circuits.length > 0) {
      children.push(this.buildLightingActions(room.circuits, room.shortName));
    }
    children.push(...this.buildRoomAutomationRows(room));
    return el('div', 'hud-focus-body', children);
  }

  /** PIR occupancy toggles and night-dim status for the room's KNX automation. */
  private buildRoomAutomationRows(room: HudRoom): HTMLElement[] {
    const { knx } = this.opts;
    const rows: HTMLElement[] = [];
    for (const sensor of knx.getRoomMotionSensors()) {
      if (sensor.zoneId !== room.zoneId) continue;
      const occupied = knx.getRoomMotionDetected(sensor.id);
      rows.push(
        el('div', 'hud-focus-device', [
          el('span', `hud-rocker-dot${occupied ? '' : ' off-state'}`),
          el('span', 'hud-focus-device-name', [`${sensor.name} (${sensor.pa})`]),
          el('span', 'hud-focus-device-state', [occupied ? 'Motion' : 'Vacant']),
          button('hud-inline-btn', occupied ? 'Clear' : 'Trigger', () => knx.toggleRoomMotion(sensor.id)),
        ])
      );
    }
    for (const c of room.circuits) {
      if (knx.isRoomNightDimActive(c.id)) {
        rows.push(el('div', 'hud-focus-note', [`${c.shortName}: night dim (switch off, after dark)`]));
      }
    }

    const ufh = this.opts.scene.getUfhSystem();
    const ufhZone = ufh?.getZoneForRoom(room.zoneId);
    if (ufh && ufhZone) {
      const isOn = ufhZone.heatingOn;
      const layerVis = ufh.isLayerVisible();
      rows.push(
        el('div', 'hud-focus-device', [
          el('span', `hud-rocker-dot ${isOn ? 'ufh-red-dot' : 'ufh-blue-dot'}`),
          el('span', 'hud-focus-device-name', [
            `${ufhZone.name} (${ufhZone.manifoldLabel})`,
          ]),
          el('span', 'hud-focus-device-state', [
            isOn ? `ON · ${ufhZone.targetTempC}°C (Red)` : `OFF · ${ufhZone.targetTempC}°C (Blue)`,
          ]),
          button(
            'hud-inline-btn',
            isOn ? 'Set Blue (Off)' : 'Set Red (On)',
            () => {
              if (!ufh.isLayerVisible()) {
                this.opts.scene.setUfhLayerVisible(true);
              }
              this.opts.scene.toggleUfhZone(ufhZone.id);
              this.renderPanel();
            },
            'Toggle Underfloor Heating zone between Red (Heating ON) and Blue (OFF)'
          ),
          button(
            'hud-inline-btn',
            layerVis ? 'Hide Pipes' : 'Show Pipes',
            () => {
              this.opts.scene.toggleUfhLayer();
              this.renderPanel();
            },
            'Toggle 3D sub-floor UFH pipes X-ray layer'
          ),
        ])
      );

      const profile = ufh.getRoomThermalProfile(room.zoneId);
      const est = ufh.getRoomWarmupEstimate(room.zoneId);
      const env = ufh.getEnvironment();
      if (profile && est) {
        const knxProbeMap: Partial<Record<string, string>> = {
          sittingRoom: 'KNX NTC Probe in Switch Backbox (PA 1.1.21 · GA 4/1/1 · DPT 9.001)',
          livingRoom: 'KNX NTC Probe in Switch Backbox (PA 1.1.18 · GA 4/1/2 · DPT 9.001)',
          entranceHall: 'KNX NTC Probe via Hall Switch (PA 1.1.17 · GA 4/1/3 · DPT 9.001)',
          hall: 'KNX NTC Probe in Switch Backbox (PA 1.1.17 · GA 4/1/3 · DPT 9.001)',
          bootLobby: 'KNX NTC Probe in Hall/Boot Switch Backbox (PA 1.1.17 · GA 4/1/3 · DPT 9.001)',
          familyRoom: 'KNX NTC Probe in Switch Backbox (PA 1.1.15 · GA 4/1/4 · DPT 9.001)',
          kitchen: 'KNX NTC Probe in Bifold Switch Backbox (PA 1.1.10 · GA 4/1/5 · DPT 9.001)',
          sitting: 'KNX NTC Probe via Kitchen Switch (PA 1.1.10 · GA 4/1/5 · DPT 9.001)',
          utility: 'KNX NTC Probe via Kitchen Switch (PA 1.1.10 · GA 4/1/5 · DPT 9.001)',
        };
        const probeInfo = knxProbeMap[room.zoneId];
        const lagBadgeClass =
          est.emitterLagMinutes <= 15
            ? 'hud-ufh-warmup-time is-fast'
            : 'hud-ufh-warmup-time is-screed';
        rows.push(
          el('div', 'hud-thermal-card', [
            el('div', 'hud-thermal-head', [
              el('span', 'hud-thermal-title', ['17TH-C FARMHOUSE WARM-UP ESTIMATE']),
              el('span', lagBadgeClass, [`~${est.formattedDuration}`]),
            ]),
            ...(probeInfo ? [el('div', 'hud-thermal-sub', [probeInfo])] : []),
            el('div', 'hud-thermal-sub', [
              `${profile.emitterLabel} · ${profile.heatedAreaM2}m² heated / ${profile.floorAreaM2}m² floor`,
            ]),
            el('div', 'hud-thermal-sub', [profile.constructionSummary]),
            el('div', 'hud-thermal-metrics', [
              el('div', 'hud-thermal-metric', [
                el('span', 'hud-thermal-metric-label', ['TEMP RISE']),
                el('span', 'hud-thermal-metric-val', [
                  `${est.startTempC}°C → ${est.targetTempC}°C`,
                ]),
              ]),
              el('div', 'hud-thermal-metric', [
                el('span', 'hud-thermal-metric-label', ['OUTPUT / LOSS']),
                el('span', 'hud-thermal-metric-val', [
                  `${profile.emitterOutputW}W / ${est.steadyHeatLossAtTargetW}W`,
                ]),
              ]),
              el('div', 'hud-thermal-metric', [
                el('span', 'hud-thermal-metric-label', ['THERMAL LAG']),
                el('span', 'hud-thermal-metric-val', [
                  `${est.emitterLagMinutes}m (${est.emitterLagMinutes <= 15 ? 'Rads' : 'Screed'})`,
                ]),
              ]),
              el('div', 'hud-thermal-metric', [
                el('span', 'hud-thermal-metric-label', ['CLIMB RATE']),
                el('span', 'hud-thermal-metric-val', [
                  `${est.initialHeatingRateCPerHr}°C/hr (+${est.netBoostPowerAtStartW}W)`,
                ]),
              ]),
            ]),
            el('div', 'hud-thermal-env-row', [
              button(
                `hud-inline-btn${env.outdoorTempC === -2 ? ' active' : ''}`,
                '-2°C Frost',
                () => ufh.setOutdoorTempC(-2),
                'Simulate -2°C Frost outdoor temperature'
              ),
              button(
                `hud-inline-btn${env.outdoorTempC === 5 ? ' active' : ''}`,
                '5°C Winter',
                () => ufh.setOutdoorTempC(5),
                'Simulate 5°C typical UK winter outdoor temperature'
              ),
              button(
                `hud-inline-btn${env.outdoorTempC === 10 ? ' active' : ''}`,
                '10°C Mild',
                () => ufh.setOutdoorTempC(10),
                'Simulate 10°C mild autumn/spring outdoor temperature'
              ),
              button(
                `hud-inline-btn${env.startMode === 'setback' ? ' active' : ''}`,
                `Setback (${profile.setbackStartTempC}°C)`,
                () => ufh.setStartMode('setback'),
                'Morning recovery from night setback temperature'
              ),
              button(
                `hud-inline-btn${env.startMode === 'cold' ? ' active' : ''}`,
                `Cold (${profile.coldStartTempC}°C)`,
                () => ufh.setStartMode('cold'),
                'Cold start from unheated 14°C farmhouse'
              ),
            ]),
          ])
        );
      }
    }
    return rows;
  }

  private buildFloorPanel(floor: HudFloor): HTMLElement {
    const floorCircuits = floor.rooms.flatMap((r) => r.circuits);
    const tiles = floor.rooms.map((room) => {
      const on = this.countOn(room.circuits);
      const tile = button(
        `hud-room-tile${on > 0 ? ' is-lit' : ''}`,
        '',
        () => this.goToRoom(room),
        `Focus ${room.name}`
      );
      tile.append(
        el('span', 'hud-room-dot'),
        el('span', 'hud-room-name', [room.shortName]),
        el('span', 'hud-room-count', [room.circuits.length ? `${on}/${room.circuits.length}` : '–'])
      );
      return tile;
    });
    const other = this.opts.model.floors.find((f) => f.floorId !== floor.floorId);
    const children: HTMLElement[] = [
      el('div', 'hud-focus-note', [
        `${this.countOn(floorCircuits)}/${floorCircuits.length} circuits on · double-click a room to focus it`,
      ]),
      el('div', 'hud-room-grid', tiles),
      this.buildLightingActions(floorCircuits, floor.name),
    ];
    if (other) {
      children.push(
        el('div', 'hud-seg-row hud-focus-actions', [
          button('hud-seg-btn', `Go to ${other.name}`, () => this.goToFloor(other.floorId)),
        ])
      );
    }
    return el('div', 'hud-focus-body', children);
  }

  private buildPropertyPanel(): HTMLElement {
    const { knx, model, gatePa, courtyardSwitchPa } = this.opts;
    const gatesOpen = knx.isCarGatesOpen();
    const courtyardOn = knx.isCourtyardLightOn();
    const all = model.circuits;

    const gateRow = el('div', 'hud-focus-device', [
      el('span', `hud-rocker-dot${gatesOpen || knx.isCarGatesMoving() ? '' : ' off-state'}`),
      el('span', 'hud-focus-device-name', ['Front Gates']),
      el('span', 'hud-focus-device-state', [knx.getCarGatesStatusLabel()]),
      button('hud-inline-btn', gatesOpen ? 'Close' : 'Open', () => knx.toggleCarGates(gatePa)),
    ]);
    const courtyardRow = el('div', 'hud-focus-device', [
      el('span', `hud-rocker-dot${courtyardOn ? '' : ' off-state'}`),
      el('span', 'hud-focus-device-name', ['Courtyard Lights']),
      el('span', 'hud-focus-device-state', [knx.getCourtyardModeLabel()]),
      button('hud-inline-btn', 'Toggle', () =>
        knx.handleCourtyardSwitchShortPress('up', courtyardSwitchPa)
      ),
    ]);

    const floorTiles = model.floors.map((floor) => {
      const circuits = floor.rooms.flatMap((r) => r.circuits);
      const on = this.countOn(circuits);
      const tile = button(
        `hud-room-tile${on > 0 ? ' is-lit' : ''}`,
        '',
        () => this.goToFloor(floor.floorId),
        `Focus ${floor.name}`
      );
      tile.append(
        el('span', 'hud-room-dot'),
        el('span', 'hud-room-name', [floor.name]),
        el('span', 'hud-room-count', [`${on}/${circuits.length}`])
      );
      return tile;
    });

    return el('div', 'hud-focus-body', [
      gateRow,
      courtyardRow,
      el('div', 'hud-room-grid hud-room-grid-2', floorTiles),
      el('div', 'hud-focus-note', [`Whole home · ${this.countOn(all)}/${all.length} circuits on`]),
      el('div', 'hud-seg-row hud-focus-actions', [
        button('hud-seg-btn', 'All Lights Off', () => this.setAll(all, 0), 'Turn off every KNX light'),
      ]),
    ]);
  }

  // ---------------------------------------------------------------------------
  // Scoping of the existing HUD
  // ---------------------------------------------------------------------------

  private applySectionScopes(state: FocusState): void {
    const sections = this.opts.hudBody.querySelectorAll<HTMLElement>('[data-hud-levels]');
    sections.forEach((section) => {
      const levels = (section.dataset.hudLevels ?? '').split(/\s+/).filter(Boolean);
      const zones = (section.dataset.hudZones ?? '').split(/\s+/).filter(Boolean);
      let visible = levels.includes(state.level);
      if (visible && state.level === 'room' && zones.length > 0) {
        visible = state.zoneId !== null && zones.includes(state.zoneId);
      }
      section.hidden = !visible;
    });
  }

  private applyCircuitRowScope(state: FocusState): void {
    const inScope = (c: CircuitConfig): boolean => {
      if (state.level === 'room') return c.zoneId === state.zoneId;
      if (state.level === 'floor') return c.buildingId === 'mainHouse' && c.floorId === state.floorId;
      return true;
    };
    let visibleCount = 0;
    for (const c of this.opts.model.circuits) {
      const row = document.getElementById(`circuit-card-${c.id}`);
      if (!row) continue;
      const show = inScope(c);
      row.hidden = !show;
      if (show) visibleCount += 1;
    }
    const empty = document.getElementById('circuit-list-empty');
    if (empty) {
      empty.hidden = visibleCount > 0;
    }
  }
}
