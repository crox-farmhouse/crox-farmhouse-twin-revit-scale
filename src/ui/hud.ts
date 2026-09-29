import type {
  LodPolicyMode,
  RoomLodDiagnostics,
  SmartHomeBusEvent,
} from '../core/entities.ts';
import { SmartHomeHub } from '../core/smart-home-hub.ts';
import {
  KNXAIAssistant,
  VoiceRecognitionController,
  type ExecutedToolCallRecord,
} from '../knx/ai-assistant.ts';
import { CIRCUITS } from '../knx/constants.ts';
import type { KNXPropertyBusController } from '../knx/emulator.ts';
import type { PropertyScene } from '../engine/scene/property-scene.ts';
import type { KNXTelegram, ShortPressMode, WakeBehavior } from '../types/knx.ts';
import type { CameraPresetName, FloorViewMode, TimeOfDay } from '../types/scene.ts';

function requireElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Required HUD DOM element #${id} not found`);
  }
  return el as T;
}

export class HudController {
  private readonly knx: KNXPropertyBusController;
  private readonly scene: PropertyScene;
  private readonly hub: SmartHomeHub;
  private readonly aiAssistant: KNXAIAssistant;
  private readonly voiceController: VoiceRecognitionController;

  private readonly hudWindow: HTMLElement;
  private readonly hudTitlebar: HTMLElement;
  private readonly hudCollapseBtn: HTMLButtonElement;

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

  private isDraggingHud = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  public constructor(
    knx: KNXPropertyBusController,
    scene: PropertyScene,
    hub = new SmartHomeHub(knx)
  ) {
    this.knx = knx;
    this.scene = scene;
    this.hub = hub;
    this.aiAssistant = new KNXAIAssistant(knx, scene, () => {
      this.syncEnvironmentButtonsUI();
    });

    this.hudWindow = requireElement<HTMLElement>('hud-panel');
    this.hudTitlebar = requireElement<HTMLElement>('hud-titlebar');
    this.hudCollapseBtn = requireElement<HTMLButtonElement>('hud-collapse-btn');

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
        this.runAICommand(finalText);
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
    this.syncLodReadoutUI(this.scene.getLodDiagnostics());
    this.syncUniFiStatusUI();

    this.bindDraggableHud();
    this.bindSwitchAndSceneEvents();
    this.bindAIAssistantEvents();
    this.bindViewAndEnvironmentEvents();
    this.bindUniFiSecurityEvents();
    this.bindAuthoringAndBusEvents();

    this.scene.getLodController().setOnLodChanged((diag) => {
      this.syncLodReadoutUI(diag);
    });

    this.hub.subscribe((ev) => {
      if (ev.type === 'busEvent' && ev.busEvent && ev.busEvent.protocol !== 'knx') {
        this.prependSmartHomeEventToUI(ev.busEvent);
      } else if (ev.type === 'entityChanged') {
        this.syncUniFiStatusUI();
      }
    });

    this.knx.subscribe((event) => {
      if (event.type === 'telegram') {
        this.prependTelegramToUI(event.telegram);
      } else if (event.type === 'stateChange') {
        this.updateCircuitControlsValues();
        this.updateSwitchStatusUI();
      } else if (event.type === 'eepromChanged' || event.type === 'flashed') {
        this.renderEEPROMHex();
        this.updateSwitchStatusUI();
      }
    });
  }

  private bindDraggableHud(): void {
    this.hudCollapseBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      this.hudWindow.classList.toggle('is-collapsed');
    });

    this.hudTitlebar.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.target === this.hudCollapseBtn) return;
      this.isDraggingHud = true;
      const rect = this.hudWindow.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      this.hudTitlebar.setPointerCapture(e.pointerId);
    });

    this.hudTitlebar.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isDraggingHud) return;
      const maxX = Math.max(0, window.innerWidth - this.hudWindow.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - 28);
      const nextLeft = Math.max(0, Math.min(maxX, e.clientX - this.dragOffsetX));
      const nextTop = Math.max(0, Math.min(maxY, e.clientY - this.dragOffsetY));
      this.hudWindow.style.left = `${nextLeft}px`;
      this.hudWindow.style.top = `${nextTop}px`;
      this.hudWindow.style.right = 'auto';
    });

    const stopDrag = (): void => {
      this.isDraggingHud = false;
    };
    this.hudTitlebar.addEventListener('pointerup', stopDrag);
    this.hudTitlebar.addEventListener('pointercancel', stopDrag);
  }

  private renderCircuitControls(): void {
    this.circuitListEl.innerHTML = '';
    const targetLevels = this.knx.getTargetLevels();

    for (const c of CIRCUITS) {
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
  }

  private updateCircuitControlsValues(): void {
    const targetLevels = this.knx.getTargetLevels();
    for (const c of CIRCUITS) {
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
  }

  private renderEEPROMHex(): void {
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

  private updateSwitchStatusUI(): void {
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
    this.scene.setCarGatesOpen(carGatesOpen);

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

    this.scene.setMotionSensorStates(kMotion, uMotion);
    this.scene.setTVArtState(tvArtActive, this.knx.getTvArtIndex());

    const holdSec = (flashed.holdThresholdMs / 1000).toFixed(1);
    this.holdUpBadge.textContent = `Tap: S1–S3 + · Hold ${holdSec}s: Full On`;
    this.holdTimeBadge.textContent = nightEligible
      ? `Tap: S1–S3 − · Hold ${holdSec}s: Night Dim`
      : `Tap: S1–S3 − · Hold ${holdSec}s: Full Off`;
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

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.scene.isWalkthroughMode()) return;
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
      if (this.scene.isWalkthroughMode()) return;
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
    this.aiReplyText.textContent = 'Querying Vertex AI gemini-3.5-flash-lite with live KNX room state...';
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

  private syncEnvironmentButtonsUI(): void {
    const lux = this.knx.getAmbientLux();
    const activeTod: TimeOfDay = lux >= 200 ? 'day' : lux >= 20 ? 'dusk' : 'night';
    document.querySelectorAll<HTMLButtonElement>('.tod-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tod === activeTod);
    });
    const bifoldStateLabel = document.getElementById('bifold-state-label');
    if (bifoldStateLabel) {
      bifoldStateLabel.textContent = this.scene.isBifoldsOpen()
        ? 'Bifolds: Open'
        : 'Bifolds: Closed';
    }
  }

  public syncFloorModeUI(): void {
    const mode = this.scene.getFloorViewMode();
    const isCutaway = this.scene.isCeilingCutaway();
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
  }

  private bindViewAndEnvironmentEvents(): void {
    document.querySelectorAll<HTMLButtonElement>('.floor-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const floorMode = btn.dataset.floor as FloorViewMode | undefined;
        if (!floorMode) return;
        this.scene.setFloorViewMode(floorMode);
        this.syncFloorModeUI();
      });
    });

    document.querySelectorAll<HTMLButtonElement>('.cam-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.cam as CameraPresetName | undefined;
        if (!preset) return;
        document
          .querySelectorAll<HTMLButtonElement>('.cam-btn')
          .forEach((b) => b.classList.toggle('active', b === btn));
        this.scene.flyToPreset(preset);
        this.syncFloorModeUI();
      });
    });

    document.querySelectorAll<HTMLButtonElement>('.lod-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lodMode = btn.dataset.lod as LodPolicyMode | undefined;
        if (!lodMode) return;
        document
          .querySelectorAll<HTMLButtonElement>('.lod-btn')
          .forEach((b) => b.classList.toggle('active', b === btn));
        this.scene.setLodPolicyMode(lodMode);
        this.syncLodReadoutUI(this.scene.getLodDiagnostics());
      });
    });

    const todLuxMap: Record<TimeOfDay, number> = {
      day: 480,
      dusk: 38,
      night: 5,
    };

    document.querySelectorAll<HTMLButtonElement>('.tod-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tod = btn.dataset.tod as TimeOfDay | undefined;
        if (!tod) return;
        document
          .querySelectorAll<HTMLButtonElement>('.tod-btn')
          .forEach((b) => b.classList.toggle('active', b === btn));
        this.scene.setTimeOfDay(tod);
        this.knx.setAmbientLux(todLuxMap[tod], true);
      });
    });

    const toggleBifoldsBtn = requireElement<HTMLButtonElement>('toggle-bifolds-btn');
    const bifoldStateLabel = requireElement<HTMLElement>('bifold-state-label');
    toggleBifoldsBtn.addEventListener('click', () => {
      const isOpen = this.scene.toggleBifolds();
      bifoldStateLabel.textContent = isOpen ? 'Bifolds: Open' : 'Bifolds: Closed';
    });

    const toggleRoofBtn = requireElement<HTMLButtonElement>('toggle-roof-btn');
    toggleRoofBtn.addEventListener('click', () => {
      this.scene.toggleCeilingCutaway();
      this.syncFloorModeUI();
    });

    const toggleUfhLayerBtn = document.getElementById('toggle-ufh-layer-btn');
    toggleUfhLayerBtn?.addEventListener('click', () => {
      const visible = this.scene.toggleUfhLayer();
      if (visible && this.scene.getFloorViewMode() === 'first') {
        this.scene.setFloorViewMode('ground');
        this.syncFloorModeUI();
      }
      this.syncUfhUI();
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
        if (!this.scene.isUfhLayerVisible()) {
          this.scene.setUfhLayerVisible(true);
          if (this.scene.getFloorViewMode() === 'first') {
            this.scene.setFloorViewMode('ground');
            this.syncFloorModeUI();
          }
        }
        this.scene.toggleUfhZone(zoneId);
        this.syncUfhUI();
      });
    });

    document.querySelectorAll<HTMLButtonElement>('.ufh-out-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tempVal = Number(btn.dataset.outTemp);
        if (Number.isNaN(tempVal)) return;
        this.scene.getUfhSystem()?.setOutdoorTempC(tempVal);
        this.syncUfhUI();
      });
    });

    document.querySelectorAll<HTMLButtonElement>('.ufh-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.startMode as 'setback' | 'cold' | undefined;
        if (!mode) return;
        this.scene.getUfhSystem()?.setStartMode(mode);
        this.syncUfhUI();
      });
    });

    this.scene.getUfhSystem()?.subscribe(() => {
      this.syncUfhUI();
    });
    this.syncUfhUI();

    this.bindWalkthroughEvents();
    this.syncWalkthroughUI();
  }

  private bindWalkthroughEvents(): void {
    const toggleBtn = document.getElementById('toggle-walkthrough-btn');
    toggleBtn?.addEventListener('click', () => {
      this.scene.toggleWalkthroughMode();
      this.syncWalkthroughUI();
      this.syncFloorModeUI();
    });

    const exitBtn = document.getElementById('walkthrough-exit-btn');
    exitBtn?.addEventListener('click', () => {
      this.scene.setWalkthroughMode(false);
      this.syncWalkthroughUI();
      this.syncFloorModeUI();
    });

    const fovBtn = document.getElementById('walkthrough-fov-btn');
    fovBtn?.addEventListener('click', () => {
      this.scene.getWalkthrough().cycleBaseFov();
      this.syncWalkthroughUI();
    });

    const crouchBtn = document.getElementById('walkthrough-crouch-btn');
    crouchBtn?.addEventListener('click', () => {
      this.scene.getWalkthrough().toggleCrouched();
      this.syncWalkthroughUI();
    });

    const mouseLookBtn = document.getElementById('walkthrough-mouselook-btn');
    mouseLookBtn?.addEventListener('click', () => {
      this.scene.getWalkthrough().requestMouseLock();
    });

    document.querySelectorAll<HTMLButtonElement>('.walkthrough-spawn-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const spawnId = btn.dataset.spawn;
        if (!spawnId) return;
        if (!this.scene.isWalkthroughMode()) {
          this.scene.setWalkthroughMode(true, spawnId);
        } else {
          this.scene.getWalkthrough().teleportToSpawn(spawnId);
        }
        document
          .querySelectorAll<HTMLButtonElement>('.walkthrough-spawn-btn')
          .forEach((b) => b.classList.toggle('active', b === btn));
        this.syncWalkthroughUI();
      });
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName ?? '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === 'KeyV' && !e.repeat) {
        e.preventDefault();
        this.scene.toggleWalkthroughMode();
        this.syncWalkthroughUI();
        this.syncFloorModeUI();
      } else if (
        e.code === 'Escape' &&
        this.scene.isWalkthroughMode() &&
        !this.scene.getWalkthrough().isPointerLocked()
      ) {
        e.preventDefault();
        this.scene.setWalkthroughMode(false);
        this.syncWalkthroughUI();
        this.syncFloorModeUI();
      }
    });

    this.scene.getWalkthrough().subscribe(() => {
      this.syncWalkthroughUI();
      this.syncFloorModeUI();
    });

    this.scene.onViewChanged(() => {
      if (this.scene.isWalkthroughMode()) {
        this.syncWalkthroughReadout();
      }
    });
  }

  private syncWalkthroughReadout(): void {
    const posReadout = document.getElementById('walkthrough-pos-readout');
    if (!posReadout) return;
    const wt = this.scene.getWalkthrough();
    const foot = wt.getFootPosition();
    const diag = this.scene.getLodDiagnostics();
    const focusedRoom = diag.rooms.find((r) => r.zoneId === diag.focusedZoneId);
    const roomName = (focusedRoom?.shortName ?? diag.focusedZoneId).toUpperCase();
    const sign = foot.y >= 0 ? '+' : '';
    posReadout.textContent = `${roomName} · ${sign}${foot.y.toFixed(2)}m`;
  }

  public syncWalkthroughUI(): void {
    const wt = this.scene.getWalkthrough();
    const active = wt.isActive();
    const crouched = wt.isCrouched();
    const pointerLocked = wt.isPointerLocked();
    const targetPrompt = wt.getTargetedPrompt();

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
        : '1st-Person Walkthrough: Off (Press V)';
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

    if (active) {
      this.syncWalkthroughReadout();
    }
  }

  public syncUfhUI(): void {
    const ufh = this.scene.getUfhSystem();
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

  private syncLodReadoutUI(diag: RoomLodDiagnostics): void {
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
  }

  private syncUniFiStatusUI(): void {
    const cameras = this.hub.protect.getCameras();
    const accessPoints = this.hub.access.getAccessPoints();
    this.scene.syncUniFiSecurity3D(cameras, accessPoints);

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
    });
  }

  private prependSmartHomeEventToUI(ev: SmartHomeBusEvent): void {
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

  private prependTelegramToUI(tg: KNXTelegram): void {
    this.switchBusLed.classList.add('tx-flash');
    setTimeout(() => this.switchBusLed.classList.remove('tx-flash'), 160);

    this.toastApci.textContent = tg.dpt;
    this.toastSummary.textContent = `${tg.src}→${tg.dst} ${tg.summary}`;

    this.telegramCountBadge.textContent = String(this.knx.getTelegrams().length);

    const row = document.createElement('div');
    row.className = 'telegram-row';
    row.title = tg.hex;
    row.textContent = `${tg.timestamp}  ${tg.src}→${tg.dst}  ${tg.summary}`;
    this.busTelegramList.prepend(row);

    while (this.busTelegramList.children.length > 40) {
      this.busTelegramList.lastElementChild?.remove();
    }
  }
}
