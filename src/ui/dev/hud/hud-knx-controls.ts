import type { SmartHomeBusEvent } from '../../../core/entities.ts';
import type { SmartHomeHub } from '../../../integrations/smart-home-hub.ts';
import type { PropertyScene } from '../../../engine/viewer/property-scene.ts';
import {
  KNXAIAssistant,
  VoiceRecognitionController,
  type ExecutedToolCallRecord,
} from '../../../integrations/knx/ai-assistant.ts';
import type { KNXPropertyBusController } from '../../../integrations/knx/emulator.ts';
import { devStore } from '../dev-store.ts';
import type { KNXTelegram, ShortPressMode, WakeBehavior } from '../../../core/types/knx.ts';
import { requireElement } from './hud-types.ts';

export class HudKnxControlsController {
  private readonly knx: KNXPropertyBusController;
  private readonly scene: PropertyScene;
  private readonly hub: SmartHomeHub;
  private readonly aiAssistant: KNXAIAssistant;
  private readonly voiceController: VoiceRecognitionController;

  private readonly toggleUpBtn: HTMLButtonElement;
  private readonly toggleDownBtn: HTMLButtonElement;
  private readonly rockerLed: HTMLElement;
  private readonly rockerSceneReadout: HTMLElement;
  private readonly holdProgressFill: HTMLElement;
  private readonly holdUpBadge: HTMLElement;
  private readonly holdTimeBadge: HTMLElement;
  private readonly switchBusLed: HTMLElement;

  private readonly courtyardToggleBtn: HTMLButtonElement;
  private readonly courtyardRockerLed: HTMLElement;
  private readonly courtyardStateBadge: HTMLElement;

  private readonly utilityToggleBtn: HTMLButtonElement;
  private readonly utilityRockerLed: HTMLElement;
  private readonly utilityStateBadge: HTMLElement;

  private readonly carGatesBtn: HTMLButtonElement;
  private readonly carGatesRockerLed: HTMLElement;
  private readonly carGatesStateBadge: HTMLElement;

  private readonly sensorLuxReadout: HTMLElement;
  private readonly kitchenMotionBtn: HTMLButtonElement;
  private readonly kitchenMotionLabel: HTMLElement;
  private readonly utilityMotionBtn: HTMLButtonElement;
  private readonly utilityMotionLabel: HTMLElement;
  private readonly tvArtBtn: HTMLButtonElement;
  private readonly tvArtReadout: HTMLElement;

  private readonly aiForm: HTMLFormElement;
  private readonly aiMicBtn: HTMLButtonElement;
  private readonly aiMicLabel: HTMLElement;
  private readonly aiInput: HTMLInputElement;
  private readonly aiStatusBadge: HTMLElement;
  private readonly aiFnCallList: HTMLElement;
  private readonly aiReplyText: HTMLElement;

  private readonly circuitListEl: HTMLElement;
  private readonly saveScenePresetBtn: HTMLButtonElement;

  private readonly disclosureBtn: HTMLButtonElement;
  private readonly disclosureArrow: HTMLElement;
  private readonly knxDrawer: HTMLElement;

  private readonly eepromDirtyBadge: HTMLElement;
  private readonly eepromHexView: HTMLElement;
  private readonly flashDevicesBtn: HTMLButtonElement;
  private readonly flashProgressBox: HTMLElement;
  private readonly flashProgressBar: HTMLElement;
  private readonly flashStepLog: HTMLElement;

  private readonly busTelegramList: HTMLElement;
  private readonly telegramCountBadge: HTMLElement;
  private readonly clearBusLogBtn: HTMLButtonElement;

  private readonly toastApci: HTMLElement;
  private readonly toastSummary: HTMLElement;

  private pressStartTime: number | null = null;
  private pressDirection: 'up' | 'down' = 'up';
  private holdTriggered = false;
  private holdAnimRaf: number | null = null;

  public constructor(
    knx: KNXPropertyBusController,
    scene: PropertyScene,
    hub: SmartHomeHub,
    onEnvironmentChanged: () => void
  ) {
    this.knx = knx;
    this.scene = scene;
    this.hub = hub;
    this.aiAssistant = new KNXAIAssistant(
      knx,
      knx.getProject(),
      {
        setTimeOfDay: (timeOfDay) => scene.setTimeOfDay(timeOfDay),
        isBifoldsOpen: () => scene.isBifoldsOpen(),
        toggleBifolds: () => {
          scene.toggleBifolds();
        },
        listDevices: () =>
          scene.devices.interactions
            .listInteractables()
            .flatMap((d) => (d.label && d.aliases ? [{ id: d.id, name: d.label, aliases: d.aliases }] : [])),
        triggerDevice: (id) => scene.handleInteractableClick(id),
      },
      onEnvironmentChanged
    );

    this.toggleUpBtn = requireElement<HTMLButtonElement>('knx-toggle-up-btn');
    this.toggleDownBtn = requireElement<HTMLButtonElement>('knx-toggle-down-btn');
    this.rockerLed = requireElement<HTMLElement>('rocker-led');
    this.rockerSceneReadout = requireElement<HTMLElement>('rocker-scene-readout');
    this.holdProgressFill = requireElement<HTMLElement>('hold-progress-fill');
    this.holdUpBadge = requireElement<HTMLElement>('hold-up-badge');
    this.holdTimeBadge = requireElement<HTMLElement>('hold-time-badge');
    this.switchBusLed = requireElement<HTMLElement>('switch-bus-led');

    this.courtyardToggleBtn = requireElement<HTMLButtonElement>('knx-courtyard-toggle-btn');
    this.courtyardRockerLed = requireElement<HTMLElement>('courtyard-rocker-led');
    this.courtyardStateBadge = requireElement<HTMLElement>('courtyard-state-badge');

    this.utilityToggleBtn = requireElement<HTMLButtonElement>('knx-utility-toggle-btn');
    this.utilityRockerLed = requireElement<HTMLElement>('utility-rocker-led');
    this.utilityStateBadge = requireElement<HTMLElement>('utility-state-badge');

    this.carGatesBtn = requireElement<HTMLButtonElement>('knx-car-gates-btn');
    this.carGatesRockerLed = requireElement<HTMLElement>('car-gates-rocker-led');
    this.carGatesStateBadge = requireElement<HTMLElement>('car-gates-state-badge');

    this.sensorLuxReadout = requireElement<HTMLElement>('sensor-lux-readout');
    this.kitchenMotionBtn = requireElement<HTMLButtonElement>('knx-kitchen-motion-btn');
    this.kitchenMotionLabel = requireElement<HTMLElement>('kitchen-motion-label');
    this.utilityMotionBtn = requireElement<HTMLButtonElement>('knx-utility-motion-btn');
    this.utilityMotionLabel = requireElement<HTMLElement>('utility-motion-label');
    this.tvArtBtn = requireElement<HTMLButtonElement>('knx-tv-art-btn');
    this.tvArtReadout = requireElement<HTMLElement>('tv-art-readout');

    this.aiForm = requireElement<HTMLFormElement>('ai-command-form');
    this.aiMicBtn = requireElement<HTMLButtonElement>('ai-mic-btn');
    this.aiMicLabel = requireElement<HTMLElement>('ai-mic-label');
    this.aiInput = requireElement<HTMLInputElement>('ai-command-input');
    this.aiStatusBadge = requireElement<HTMLElement>('ai-status-badge');
    this.aiFnCallList = requireElement<HTMLElement>('ai-fn-call-list');
    this.aiReplyText = requireElement<HTMLElement>('ai-reply-text');

    this.circuitListEl = requireElement<HTMLElement>('circuit-list');
    this.saveScenePresetBtn = requireElement<HTMLButtonElement>('save-scene-preset-btn');

    this.disclosureBtn = requireElement<HTMLButtonElement>('hud-knx-disclosure');
    this.disclosureArrow = requireElement<HTMLElement>('hud-disclosure-arrow');
    this.knxDrawer = requireElement<HTMLElement>('hud-knx-drawer');

    this.eepromDirtyBadge = requireElement<HTMLElement>('eeprom-dirty-badge');
    this.eepromHexView = requireElement<HTMLElement>('eeprom-hex-view');
    this.flashDevicesBtn = requireElement<HTMLButtonElement>('flash-devices-btn');
    this.flashProgressBox = requireElement<HTMLElement>('flash-progress-box');
    this.flashProgressBar = requireElement<HTMLElement>('flash-progress-bar');
    this.flashStepLog = requireElement<HTMLElement>('flash-step-log');

    this.busTelegramList = requireElement<HTMLElement>('bus-telegram-list');
    this.telegramCountBadge = requireElement<HTMLElement>('telegram-count-badge');
    this.clearBusLogBtn = requireElement<HTMLButtonElement>('clear-bus-log-btn');

    this.toastApci = requireElement<HTMLElement>('toast-apci');
    this.toastSummary = requireElement<HTMLElement>('toast-summary');

    this.voiceController = new VoiceRecognitionController(
      (interim) => {
        this.aiInput.value = interim;
      },
      (finalText) => {
        this.aiInput.value = finalText;
        void this.runAICommand(finalText);
      },
      (listening, err) => {
        this.aiMicBtn.classList.toggle('is-listening', listening);
        this.aiMicLabel.textContent = listening ? 'Stop' : 'Mic';
        if (listening) {
          this.aiStatusBadge.textContent = 'LISTENING...';
        } else if (err) {
          this.aiStatusBadge.textContent = `MIC: ${err.toUpperCase()}`;
        } else {
          this.aiStatusBadge.textContent = 'GEMINI 3.5 FLASH-LITE';
        }
      }
    );

    this.renderCircuitControls();
    this.renderEEPROMHex();
    this.updateSwitchStatusUI();
    this.syncUniFiStatusUI();

    this.bindSwitchAndSceneEvents();
    this.bindAIAssistantEvents();
    this.bindUniFiSecurityEvents();
    this.bindAuthoringAndBusEvents();
  }

  public renderCircuitControls(): void {
    this.circuitListEl.innerHTML = '';
    const targetLevels = this.knx.getTargetLevels();

    for (const c of this.knx.getCircuits()) {
      const pct = Math.round(targetLevels[c.id] ?? 0);
      const isOn = pct > 0;

      const row = document.createElement('div');
      row.className = `hud-channel-row ${isOn ? 'is-on' : ''}`;
      row.id = `circuit-card-${c.id}`;
      row.innerHTML = `
        <button
          type="button"
          class="hud-ch-power"
          id="power-btn-${c.id}"
          title="Toggle ${c.name} (${c.gaSwitch})"
          aria-label="Toggle ${c.shortName}"
        ></button>
        <span class="hud-ch-name" title="${c.location}">${c.shortName}</span>
        <input
          type="range"
          min="0"
          max="100"
          value="${pct}"
          class="hud-ch-slider"
          id="slider-${c.id}"
          aria-label="${c.shortName} Dimmer"
        />
        <span class="hud-ch-val" id="pct-label-${c.id}">${pct}%</span>
      `;

      const powerBtn = row.querySelector<HTMLButtonElement>(`#power-btn-${c.id}`);
      const slider = row.querySelector<HTMLInputElement>(`#slider-${c.id}`);
      const pctLabel = row.querySelector<HTMLElement>(`#pct-label-${c.id}`);

      powerBtn?.addEventListener('click', () => {
        this.knx.toggleCircuit(c.id);
      });

      slider?.addEventListener('input', () => {
        const val = Number(slider.value);
        if (pctLabel) pctLabel.textContent = `${val}%`;
        this.knx.setCircuitLevel(c.id, val, false);
      });

      slider?.addEventListener('change', () => {
        const val = Number(slider.value);
        this.knx.setCircuitLevel(c.id, val, true);
      });

      this.circuitListEl.appendChild(row);
    }

    devStore.syncKnxState({
      knxDeviceStates: targetLevels,
      activeScenePreset: this.knx.getActiveSceneIndex(),
      telegramCount: this.knx.getTelegrams().length,
      recentTelegrams: this.knx.getTelegrams().slice(0, 20),
    });
  }

  public updateCircuitControlsValues(): void {
    const targetLevels = this.knx.getTargetLevels();
    for (const c of this.knx.getCircuits()) {
      const pct = Math.round(targetLevels[c.id] ?? 0);
      const isOn = pct > 0;
      const card = document.getElementById(`circuit-card-${c.id}`);
      const pctLabel = document.getElementById(`pct-label-${c.id}`);
      const slider = document.getElementById(`slider-${c.id}`) as HTMLInputElement | null;

      if (card) card.classList.toggle('is-on', isOn);
      if (pctLabel) pctLabel.textContent = `${pct}%`;
      if (slider && document.activeElement !== slider) {
        slider.value = String(pct);
      }
    }

    devStore.syncKnxState({
      knxDeviceStates: targetLevels,
      activeScenePreset: this.knx.getActiveSceneIndex(),
    });
  }

  public renderEEPROMHex(): void {
    const bytes = this.knx.compileEEPROMImage(true);
    this.eepromDirtyBadge.hidden = !this.knx.getIsDirty();

    const lines: string[] = [];
    for (let row = 0; row < 4; row++) {
      const baseAddr = 0x4000 + row * 16;
      const addrStr = `0x${baseAddr.toString(16).toUpperCase()}: `;
      const hexCells: string[] = [];

      for (let col = 0; col < 16; col++) {
        const idx = row * 16 + col;
        const bVal = bytes[idx] ?? 0;
        const bStr = bVal.toString(16).toUpperCase().padStart(2, '0');
        let cls = 'hex-table';
        if (idx >= 24 && idx <= 31) cls = 'hex-param';
        else if (idx >= 32 && idx <= 51) cls = 'hex-scene';
        hexCells.push(`<span class="${cls}">${bStr}</span>`);
      }
      lines.push(`<span class="hex-addr">${addrStr}</span>${hexCells.join(' ')}`);
    }

    this.eepromHexView.innerHTML = lines.join('\n');
  }

  public updateSwitchStatusUI(): void {
    const anyKitchenOn = this.knx.isAnyKitchenLightOn();
    const kitchenNightDim = this.knx.isKitchenNightDimActive();
    const utilityPct = Math.round(this.knx.getTargetLevels().utilitySpotlights ?? 0);
    const utilitySwitchOn = this.knx.isUtilitySwitchOn();
    const utilityNightDim = this.knx.isUtilityNightDimActive();
    const activeIdx = this.knx.getActiveSceneIndex();
    const scenes = this.knx.getScenes();
    const flashed = this.knx.getFlashedParams();

    this.rockerLed.classList.toggle('off-state', !anyKitchenOn && !kitchenNightDim);
    this.rockerLed.classList.toggle('night-dim-state', kitchenNightDim);

    const courtyardOn = this.knx.isCourtyardLightOn();
    this.courtyardRockerLed.classList.toggle('off-state', !courtyardOn);
    this.courtyardStateBadge.textContent = this.knx.getCourtyardModeLabel();

    this.utilityRockerLed.classList.toggle('off-state', utilityPct === 0);
    this.utilityRockerLed.classList.toggle('night-dim-state', utilityNightDim);

    if (utilityNightDim) {
      this.utilityStateBadge.textContent = `NIGHT DIM · ${utilityPct}%`;
    } else if (utilitySwitchOn || utilityPct > 0) {
      this.utilityStateBadge.textContent = `ON · ${utilityPct}%`;
    } else {
      this.utilityStateBadge.textContent = 'OFF · 0%';
    }

    const carGatesOpen = this.knx.isCarGatesOpen();
    const carGatesMoving = this.knx.isCarGatesMoving();
    this.carGatesRockerLed.classList.toggle('off-state', !carGatesOpen && !carGatesMoving);
    this.carGatesRockerLed.classList.toggle('night-dim-state', carGatesMoving);
    this.carGatesStateBadge.textContent = this.knx.getCarGatesStatusLabel();

    if (kitchenNightDim) {
      this.rockerSceneReadout.textContent = 'OFF · NIGHT-WALK DIM';
    } else if (!anyKitchenOn || activeIdx === -1) {
      this.rockerSceneReadout.textContent = 'KITCHEN OFF (0%)';
    } else if (activeIdx === 99) {
      this.rockerSceneReadout.textContent = 'FULL ON (100%)';
    } else {
      const sc = scenes[activeIdx];
      if (sc) {
        const extBadge = sc.isSwitchScene ? '' : ' [AI]';
        this.rockerSceneReadout.textContent = `${sc.code} · ${sc.name.toUpperCase()}${extBadge}`;
      }
    }

    document.querySelectorAll<HTMLButtonElement>('.scene-pill').forEach((btn) => {
      const idx = Number(btn.dataset.scene);
      btn.classList.toggle('active', idx === activeIdx);
    });

    const kMotion = this.knx.getKitchenMotionDetected();
    const uMotion = this.knx.getUtilityMotionDetected();
    const lux = this.knx.getAmbientLux();
    const nightEligible = this.knx.isBelowLuxThreshold();
    const tvArtActive = this.knx.isTvArtModeActive();
    const tvArtTitle = this.knx.getTvArtTitle();
    const tvArtNum = this.knx.getTvArtIndex() + 1;

    this.kitchenMotionBtn.classList.toggle('is-occupied', kMotion);
    this.kitchenMotionLabel.textContent = kMotion ? 'Kitchen: Motion' : 'Kitchen: No Motion';

    this.utilityMotionBtn.classList.toggle('is-occupied', uMotion);
    this.utilityMotionLabel.textContent = uMotion ? 'Utility: Motion' : 'Utility: No Motion';

    this.tvArtBtn.classList.toggle('is-art-on', tvArtActive);
    this.tvArtReadout.textContent = tvArtActive
      ? `Art ${tvArtNum}/4: ${tvArtTitle} ↻`
      : 'Auto-OFF (No Presence)';

    this.sensorLuxReadout.textContent = nightEligible
      ? `${lux} lx < ${flashed.luxThreshold} lx · NIGHT DIM`
      : `${lux} lx ≥ ${flashed.luxThreshold} lx · DAYLIGHT`;

    const holdSec = (flashed.holdThresholdMs / 1000).toFixed(1);
    this.holdUpBadge.textContent = `Tap: S1–S3 + · Hold ${holdSec}s: Full On`;
    this.holdTimeBadge.textContent = nightEligible
      ? `Tap: S1–S3 − · Hold ${holdSec}s: Night Dim`
      : `Tap: S1–S3 − · Hold ${holdSec}s: Full Off`;

    devStore.syncKnxState({
      activeScenePreset: activeIdx,
      knxDeviceStates: this.knx.getTargetLevels(),
    });
  }

  public syncUniFiStatusUI(): void {
    const cameras = this.hub.protect.getCameras();
    const accessPoints = this.hub.access.getAccessPoints();

    const frustumBtn = document.getElementById('unifi-toggle-frustums-btn');
    const frustumLabel = document.getElementById('unifi-frustum-label');
    const anyFrustum = cameras.some((c) => c.showFrustum3D);
    if (frustumBtn) {
      frustumBtn.classList.toggle('is-occupied', anyFrustum);
    }
    if (frustumLabel) {
      frustumLabel.textContent = anyFrustum ? '3D CCTV Cones: On' : '3D CCTV Cones: Off';
    }

    const gateAccess = accessPoints.find(
      (a) => a.entityId === 'access.front_split_gate_intercom'
    );
    const accessBtn = document.getElementById('unifi-gate-access-btn');
    const accessLabel = document.getElementById('unifi-access-label');
    if (gateAccess && accessBtn && accessLabel) {
      const isUnlocked = !gateAccess.isLocked;
      accessBtn.classList.toggle('is-occupied', isUnlocked);
      accessLabel.textContent = isUnlocked
        ? `Gate Reader: ${gateAccess.lastCredentialMethod}`
        : 'Gate Reader: Locked';
    }

    const activeAlertCam = cameras.find((c) => c.activeDetection !== 'none');
    const unifiReadout = document.getElementById('unifi-status-readout');
    if (unifiReadout) {
      unifiReadout.textContent = activeAlertCam
        ? `${activeAlertCam.shortName.toUpperCase()} · ${activeAlertCam.activeDetection.toUpperCase()}`
        : '4 CAMS · 2 HUBS';
    }
  }

  public prependSmartHomeEventToUI(ev: SmartHomeBusEvent): void {
    this.switchBusLed.classList.add('tx-flash');
    setTimeout(() => this.switchBusLed.classList.remove('tx-flash'), 160);

    const tag = ev.protocol === 'unifi-protect' ? 'PROTECT' : 'ACCESS';
    this.toastApci.textContent = tag;
    this.toastSummary.textContent = ev.summary;

    const row = document.createElement('div');
    row.className = 'telegram-row';
    row.title = `${ev.protocol.toUpperCase()} · ${ev.sourceAddress} → ${ev.targetAddress}`;
    row.textContent = `${ev.timestamp}  [${tag}]  ${ev.summary}`;
    this.busTelegramList.prepend(row);

    while (this.busTelegramList.children.length > 40) {
      this.busTelegramList.lastElementChild?.remove();
    }
  }

  public prependTelegramToUI(tg: KNXTelegram): void {
    this.switchBusLed.classList.add('tx-flash');
    setTimeout(() => this.switchBusLed.classList.remove('tx-flash'), 160);

    this.toastApci.textContent = tg.dpt;
    this.toastSummary.textContent = `${tg.src}→${tg.dst} ${tg.summary}`;

    const allTelegrams = this.knx.getTelegrams();
    this.telegramCountBadge.textContent = String(allTelegrams.length);
    devStore.syncKnxState({
      telegramCount: allTelegrams.length,
      recentTelegrams: allTelegrams.slice(0, 20),
    });

    const row = document.createElement('div');
    row.className = 'telegram-row';
    row.title = tg.hex;
    row.textContent = `${tg.timestamp}  ${tg.src}→${tg.dst}  ${tg.summary}`;
    this.busTelegramList.prepend(row);

    while (this.busTelegramList.children.length > 40) {
      this.busTelegramList.lastElementChild?.remove();
    }
  }

  private startSwitchPress(direction: 'up' | 'down', e?: Event): void {
    if (e instanceof MouseEvent && e.button !== 0) return;
    if (this.pressStartTime !== null) return;

    this.pressStartTime = performance.now();
    this.pressDirection = direction;
    this.holdTriggered = false;
    const activeBtn = direction === 'up' ? this.toggleUpBtn : this.toggleDownBtn;
    activeBtn.classList.add('pressed');

    const threshold = this.knx.getFlashedParams().holdThresholdMs;

    const tickHoldProgress = (now: number): void => {
      if (this.pressStartTime === null) return;
      const elapsed = now - this.pressStartTime;
      const pct = Math.min(100, (elapsed / threshold) * 100);
      this.holdProgressFill.style.width = `${pct}%`;

      if (elapsed >= threshold && !this.holdTriggered) {
        this.holdTriggered = true;
        this.rockerLed.classList.add('hold-triggered');
        if (this.pressDirection === 'up') {
          this.knx.handleSwitchLongPressHoldUp();
        } else {
          this.knx.handleSwitchLongPressHoldDown();
        }
      }

      if (!this.holdTriggered) {
        this.holdAnimRaf = requestAnimationFrame(tickHoldProgress);
      }
    };

    this.holdAnimRaf = requestAnimationFrame(tickHoldProgress);
  }

  private endSwitchPress(): void {
    if (this.pressStartTime === null) return;
    if (this.holdAnimRaf !== null) {
      cancelAnimationFrame(this.holdAnimRaf);
      this.holdAnimRaf = null;
    }

    const elapsed = performance.now() - this.pressStartTime;
    const threshold = this.knx.getFlashedParams().holdThresholdMs;
    const wasHold = this.holdTriggered || elapsed >= threshold;
    const direction = this.pressDirection;

    this.pressStartTime = null;
    this.holdTriggered = false;
    this.toggleUpBtn.classList.remove('pressed');
    this.toggleDownBtn.classList.remove('pressed');
    this.holdProgressFill.style.width = '0%';
    setTimeout(() => this.rockerLed.classList.remove('hold-triggered'), 260);

    if (!wasHold) {
      this.knx.handleSwitchShortPress(direction);
    }
  }

  private bindSwitchAndSceneEvents(): void {
    this.toggleUpBtn.addEventListener('pointerdown', (e: PointerEvent) => {
      e.preventDefault();
      this.startSwitchPress('up', e);
    });
    this.toggleDownBtn.addEventListener('pointerdown', (e: PointerEvent) => {
      e.preventDefault();
      this.startSwitchPress('down', e);
    });
    window.addEventListener('pointerup', () => this.endSwitchPress());
    window.addEventListener('pointercancel', () => this.endSwitchPress());

    this.courtyardToggleBtn.addEventListener('click', () => {
      this.knx.handleCourtyardSwitchShortPress('up', '1.1.14');
    });

    this.utilityToggleBtn.addEventListener('click', () => {
      this.knx.handleUtilitySwitchToggle('1.1.11');
    });

    this.carGatesBtn.addEventListener('click', () => {
      this.knx.toggleCarGates('1.1.22');
    });

    this.kitchenMotionBtn.addEventListener('click', () => {
      this.knx.toggleKitchenMotion();
    });

    this.utilityMotionBtn.addEventListener('click', () => {
      this.knx.toggleUtilityMotion();
    });

    this.tvArtBtn.addEventListener('click', () => {
      this.knx.cycleTvArt(true, '1.1.12');
    });

    // Space / arrow keys simulate the kitchen rocker switch: developer mode only.
    const isDevMode = (): boolean => document.body.classList.contains('is-dev-mode');
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.scene.isWalkthroughMode() || !isDevMode()) return;
      const tag = document.activeElement?.tagName ?? '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!e.repeat) this.startSwitchPress('up', e);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (!e.repeat) this.startSwitchPress('down', e);
      }
    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (this.scene.isWalkthroughMode() || !isDevMode()) return;
      const tag = document.activeElement?.tagName ?? '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        this.endSwitchPress();
      }
    });

    document.querySelectorAll<HTMLButtonElement>('.scene-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.scene);
        if (idx === -1) {
          this.knx.handleSwitchLongPressHoldDown();
        } else if (idx === 99) {
          this.knx.handleSwitchLongPressHoldUp();
        } else if (idx >= 3) {
          this.knx.recallScene(idx, '1.1.2', 'AI / UI');
        } else {
          this.knx.recallScene(idx, '1.1.10');
        }
      });
    });

    this.saveScenePresetBtn.addEventListener('click', () => {
      this.knx.saveCurrentLevelsToActiveScene();
    });
  }

  private bindAIAssistantEvents(): void {
    this.aiForm.addEventListener('submit', (e: SubmitEvent) => {
      e.preventDefault();
      void this.runAICommand(this.aiInput.value);
    });

    this.aiMicBtn.addEventListener('click', () => {
      if (!this.voiceController.isSupported()) {
        this.aiReplyText.textContent =
          'Web Speech API is not supported in this browser; type any command in the box instead.';
        return;
      }
      this.voiceController.toggle();
    });

    document.querySelectorAll<HTMLButtonElement>('.hud-ai-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt ?? '';
        if (!prompt) return;
        this.aiInput.value = prompt;
        void this.runAICommand(prompt);
      });
    });
  }

  private async runAICommand(rawPrompt: string): Promise<void> {
    if (!rawPrompt.trim()) return;
    this.aiStatusBadge.textContent = 'THINKING (3.5 FLASH-LITE)...';
    this.aiReplyText.textContent =
      'Querying Vertex AI gemini-3.5-flash-lite with live KNX room state...';
    const result = await this.aiAssistant.executeCommand(rawPrompt);
    this.renderAIToolCalls(result.executedCalls);
    this.aiReplyText.textContent = result.reply;
    this.aiStatusBadge.textContent = result.modelUsed.toUpperCase();
  }

  private renderAIToolCalls(calls: readonly ExecutedToolCallRecord[]): void {
    this.aiFnCallList.innerHTML = '';
    if (calls.length === 0) {
      const pill = document.createElement('code');
      pill.className = 'hud-ai-fn-pill';
      pill.textContent = 'no_tool_matched()';
      this.aiFnCallList.appendChild(pill);
      return;
    }
    for (const item of calls) {
      const pill = document.createElement('code');
      pill.className = 'hud-ai-fn-pill';
      pill.title = item.formatted;
      pill.textContent = item.formatted;
      this.aiFnCallList.appendChild(pill);
    }
  }

  private bindUniFiSecurityEvents(): void {
    const frustumBtn = document.getElementById('unifi-toggle-frustums-btn');
    frustumBtn?.addEventListener('click', () => {
      this.hub.protect.toggleAllFrustums();
      this.syncUniFiStatusUI();
    });

    const gateAccessBtn = document.getElementById('unifi-gate-access-btn');
    gateAccessBtn?.addEventListener('click', () => {
      this.hub.triggerAccessUnlock('access.front_split_gate_intercom', 'NFC Card');
      this.syncUniFiStatusUI();
    });

    document.querySelectorAll<HTMLButtonElement>('.unifi-sim-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.unifiSim;
        if (action === 'lpr') {
          this.hub.triggerCameraSmartDetection('camera.unifi_driveway_gate', 'vehicle');
        } else if (action === 'courtyardPerson') {
          this.hub.triggerCameraSmartDetection('camera.unifi_south_courtyard', 'person');
        } else if (action === 'clear') {
          for (const cam of this.hub.protect.getCameras()) {
            if (cam.activeDetection !== 'none') {
              this.hub.triggerCameraSmartDetection(cam.entityId, 'none');
            }
          }
        }
        this.syncUniFiStatusUI();
      });
    });
  }

  private bindAuthoringAndBusEvents(): void {
    this.disclosureBtn.addEventListener('click', () => {
      const isHidden = this.knxDrawer.hidden;
      this.knxDrawer.hidden = !isHidden;
      this.disclosureBtn.setAttribute('aria-expanded', String(isHidden));
      this.disclosureArrow.textContent = isHidden ? '▾' : '▸';
    });

    const holdSelect = requireElement<HTMLSelectElement>('param-hold-ms');
    const shortModeSelect = requireElement<HTMLSelectElement>('param-short-mode');
    const wakeSelect = requireElement<HTMLSelectElement>('param-wake-behavior');
    const rampSelect = requireElement<HTMLSelectElement>('param-ramp-speed');
    const luxThresholdSelect = requireElement<HTMLSelectElement>('param-lux-threshold');

    holdSelect.addEventListener('change', () => {
      this.knx.updateStagedParams({ holdThresholdMs: Number(holdSelect.value) });
    });
    shortModeSelect.addEventListener('change', () => {
      this.knx.updateStagedParams({
        shortPressMode: shortModeSelect.value as ShortPressMode,
      });
    });
    wakeSelect.addEventListener('change', () => {
      this.knx.updateStagedParams({
        wakeBehavior: wakeSelect.value as WakeBehavior,
      });
    });
    rampSelect.addEventListener('change', () => {
      this.knx.updateStagedParams({ rampSpeedSec: Number(rampSelect.value) });
    });
    luxThresholdSelect.addEventListener('change', () => {
      this.knx.updateStagedParams({ luxThreshold: Number(luxThresholdSelect.value) });
    });

    this.flashDevicesBtn.addEventListener('click', async () => {
      this.flashDevicesBtn.disabled = true;
      this.flashProgressBox.hidden = false;
      this.flashProgressBar.style.width = '0%';
      this.flashStepLog.innerHTML = '';

      await this.knx.executeFlashProcedure((pct, msg) => {
        this.flashProgressBar.style.width = `${pct}%`;
        const line = document.createElement('div');
        line.textContent = `[${pct}%] ${msg}`;
        this.flashStepLog.appendChild(line);
        this.flashStepLog.scrollTop = this.flashStepLog.scrollHeight;
      });

      this.flashDevicesBtn.disabled = false;
      this.updateSwitchStatusUI();
      this.renderEEPROMHex();
    });

    this.clearBusLogBtn.addEventListener('click', () => {
      this.knx.clearTelegrams();
      this.busTelegramList.innerHTML = '';
      this.telegramCountBadge.textContent = '0';
      devStore.syncKnxState({
        telegramCount: 0,
        recentTelegrams: [],
      });
    });
  }
}
