import {
  formatMetersAndFeetInches,
  SceneAnnotationStore,
} from '../../engine/annotation/annotation-system.ts';
import type {
  MovableTargetCandidate,
  PropertyScene,
} from '../../engine/scene/property-scene.ts';
import { twinStore } from '../../state/twin-store.ts';
import type {
  AnnotationKind,
  AnnotationToolMode,
  LiveMeasurePreviewState,
  SceneAnnotationRecord,
} from '../../types/scene.ts';
import { mountAnnotationSummaryPill } from '../components/AnnotationSummaryPill.tsx';
import {
  copyTextWithFallback,
  exportAnnotationsAsJsonFile,
  exportAnnotationsAsUsdaFile,
  formatAnnotationsMarkdownReport,
} from './annotator-export.ts';
import { AnnotatorPinsOverlayRenderer } from './annotator-pins-renderer.ts';
import {
  requireAnnotatorEl,
  type ActiveTransformUIState,
} from './annotator-types.ts';

export class AnnotatorHudController {
  private readonly scene: PropertyScene;
  private readonly store: SceneAnnotationStore;
  private readonly onFloorModeChanged?: () => void;
  private readonly pinsOverlay: AnnotatorPinsOverlayRenderer;

  private readonly panelEl: HTMLElement;
  private readonly titlebarEl: HTMLElement;
  private readonly collapseBtn: HTMLButtonElement;
  private readonly countBadgeEl: HTMLElement;

  private readonly modeBtn: HTMLButtonElement;
  private readonly modeDotEl: HTMLElement;
  private readonly modeLabelEl: HTMLElement;

  private readonly toolPinBtn: HTMLButtonElement;
  private readonly toolMoveBtn: HTMLButtonElement;
  private readonly toolRotateBtn: HTMLButtonElement;
  private readonly toolMeasureBtn: HTMLButtonElement;

  private readonly copyBtn: HTMLButtonElement;
  private readonly exportBtn: HTMLButtonElement;
  private readonly clearBtn: HTMLButtonElement;

  // Move / Rotate Inspector DOM
  private readonly moveBoxEl: HTMLElement;
  private readonly moveBoxTitleEl: HTMLElement;
  private readonly gizmoTranslateBtn: HTMLButtonElement;
  private readonly gizmoRotateBtn: HTMLButtonElement;
  private readonly moveEmptyEl: HTMLElement;
  private readonly moveControlsEl: HTMLElement;
  private readonly moveTargetSelectEl: HTMLSelectElement;
  private readonly moveDxInput: HTMLInputElement;
  private readonly moveDyInput: HTMLInputElement;
  private readonly moveDzInput: HTMLInputElement;
  private readonly moveDRotYInput: HTMLInputElement;
  private readonly moveRotYSlider: HTMLInputElement;
  private readonly moveRotYReadout: HTMLElement;
  private readonly nudgeXmBtn: HTMLButtonElement;
  private readonly nudgeXpBtn: HTMLButtonElement;
  private readonly nudgeZmBtn: HTMLButtonElement;
  private readonly nudgeZpBtn: HTMLButtonElement;
  private readonly nudgeYmBtn: HTMLButtonElement;
  private readonly nudgeYpBtn: HTMLButtonElement;
  private readonly nudgeRotL90Btn: HTMLButtonElement;
  private readonly nudgeRotLBtn: HTMLButtonElement;
  private readonly nudgeRotL15Btn: HTMLButtonElement;
  private readonly nudgeRotR15Btn: HTMLButtonElement;
  private readonly nudgeRotRBtn: HTMLButtonElement;
  private readonly nudgeRotR90Btn: HTMLButtonElement;
  private readonly nudgeRot180Btn: HTMLButtonElement;
  private readonly moveResetBtn: HTMLButtonElement;
  private readonly moveSummaryEl: HTMLElement;

  // Measure Span Inspector DOM
  private readonly measureBoxEl: HTMLElement;
  private readonly measureSnapCheckbox: HTMLInputElement;
  private readonly measureCancelBtn: HTMLButtonElement;
  private readonly measureStatusEl: HTMLElement;
  private readonly measureReadoutEl: HTMLElement;
  private readonly measureDistMEl: HTMLElement;
  private readonly measureDistCmEl: HTMLElement;
  private readonly measureDeltasEl: HTMLElement;
  private readonly measureTargetRowEl: HTMLElement;
  private readonly measureTargetInputEl: HTMLInputElement;

  // Selected Record Note Editor DOM
  private readonly editorBoxEl: HTMLElement;
  private readonly editorTitleEl: HTMLElement;
  private readonly editorCoordsEl: HTMLElement;
  private readonly editorMeshEl: HTMLElement;
  private readonly noteInputEl: HTMLInputElement;

  private readonly listEl: HTMLElement;

  private activeTransformState: ActiveTransformUIState | null = null;
  private liveMeasureState: LiveMeasurePreviewState | null = null;

  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  public constructor(
    scene: PropertyScene,
    store: SceneAnnotationStore,
    onFloorModeChanged?: () => void
  ) {
    this.scene = scene;
    this.store = store;
    this.onFloorModeChanged = onFloorModeChanged;

    this.panelEl = requireAnnotatorEl<HTMLElement>('annotator-panel');
    this.titlebarEl = requireAnnotatorEl<HTMLElement>('annotator-titlebar');
    this.collapseBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-collapse-btn');
    this.countBadgeEl = requireAnnotatorEl<HTMLElement>('annotator-count-badge');

    this.modeBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-mode-btn');
    this.modeDotEl = requireAnnotatorEl<HTMLElement>('annotator-mode-dot');
    this.modeLabelEl = requireAnnotatorEl<HTMLElement>('annotator-mode-label');

    this.toolPinBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-tool-pin');
    this.toolMoveBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-tool-move');
    this.toolRotateBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-tool-rotate');
    this.toolMeasureBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-tool-measure');

    this.copyBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-copy-btn');
    this.exportBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-export-btn');
    this.clearBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-clear-btn');

    this.moveBoxEl = requireAnnotatorEl<HTMLElement>('annotator-move-box');
    this.moveBoxTitleEl = requireAnnotatorEl<HTMLElement>('annotator-move-box-title');
    this.gizmoTranslateBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-gizmo-translate');
    this.gizmoRotateBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-gizmo-rotate');
    this.moveEmptyEl = requireAnnotatorEl<HTMLElement>('annotator-move-empty');
    this.moveControlsEl = requireAnnotatorEl<HTMLElement>('annotator-move-controls');
    this.moveTargetSelectEl = requireAnnotatorEl<HTMLSelectElement>('annotator-move-target-select');
    this.moveDxInput = requireAnnotatorEl<HTMLInputElement>('annotator-move-dx');
    this.moveDyInput = requireAnnotatorEl<HTMLInputElement>('annotator-move-dy');
    this.moveDzInput = requireAnnotatorEl<HTMLInputElement>('annotator-move-dz');
    this.moveDRotYInput = requireAnnotatorEl<HTMLInputElement>('annotator-move-droty');
    this.moveRotYSlider = requireAnnotatorEl<HTMLInputElement>('annotator-move-roty-slider');
    this.moveRotYReadout = requireAnnotatorEl<HTMLElement>('annotator-move-roty-readout');
    this.nudgeXmBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-xm');
    this.nudgeXpBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-xp');
    this.nudgeZmBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-zm');
    this.nudgeZpBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-zp');
    this.nudgeYmBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-ym');
    this.nudgeYpBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-yp');
    this.nudgeRotL90Btn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-rotl90');
    this.nudgeRotLBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-rotl');
    this.nudgeRotL15Btn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-rotl15');
    this.nudgeRotR15Btn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-rotr15');
    this.nudgeRotRBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-rotr');
    this.nudgeRotR90Btn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-rotr90');
    this.nudgeRot180Btn = requireAnnotatorEl<HTMLButtonElement>('annotator-nudge-rot180');
    this.moveResetBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-move-reset');
    this.moveSummaryEl = requireAnnotatorEl<HTMLElement>('annotator-move-summary');

    this.measureBoxEl = requireAnnotatorEl<HTMLElement>('annotator-measure-box');
    this.measureSnapCheckbox = requireAnnotatorEl<HTMLInputElement>('annotator-measure-snap');
    this.measureCancelBtn = requireAnnotatorEl<HTMLButtonElement>('annotator-measure-cancel');
    this.measureStatusEl = requireAnnotatorEl<HTMLElement>('annotator-measure-status');
    this.measureReadoutEl = requireAnnotatorEl<HTMLElement>('annotator-measure-readout');
    this.measureDistMEl = requireAnnotatorEl<HTMLElement>('annotator-measure-dist-m');
    this.measureDistCmEl = requireAnnotatorEl<HTMLElement>('annotator-measure-dist-cm');
    this.measureDeltasEl = requireAnnotatorEl<HTMLElement>('annotator-measure-deltas');
    this.measureTargetRowEl = requireAnnotatorEl<HTMLElement>('annotator-measure-target-row');
    this.measureTargetInputEl = requireAnnotatorEl<HTMLInputElement>(
      'annotator-measure-target-input'
    );

    this.editorBoxEl = requireAnnotatorEl<HTMLElement>('annotator-editor-box');
    this.editorTitleEl = requireAnnotatorEl<HTMLElement>('annotator-editor-title');
    this.editorCoordsEl = requireAnnotatorEl<HTMLElement>('annotator-editor-coords');
    this.editorMeshEl = requireAnnotatorEl<HTMLElement>('annotator-editor-mesh');
    this.noteInputEl = requireAnnotatorEl<HTMLInputElement>('annotator-note-input');

    this.listEl = requireAnnotatorEl<HTMLElement>('annotator-list');

    // Mount reactive Preact + @preact/signals summary pill inside Annotator section
    const sectionEl = this.panelEl.querySelector<HTMLElement>('.hud-section');
    if (sectionEl) {
      const summaryMount = document.createElement('div');
      summaryMount.id = 'annotator-reactive-summary-mount';
      sectionEl.insertBefore(summaryMount, this.listEl);
      mountAnnotationSummaryPill(summaryMount);
    }

    this.pinsOverlay = new AnnotatorPinsOverlayRenderer(this.scene, (id) => {
      this.handleMarkerOrPinSelect(id);
    });

    // Reapply any saved object moves/rotations from localStorage before syncing markers
    this.scene.reapplySavedMoveAnnotations(this.store.getRecords());

    this.bindDraggableWindow();
    this.bindEvents();

    this.store.subscribe((records, selectedId) => {
      this.scene.syncAnnotationMarkers(records, selectedId);
      this.pinsOverlay.syncRecords(records, selectedId);
      twinStore.syncAnnotationState({
        annotatorActive: this.scene.isAnnotationMode(),
        annotationTool: this.scene.getAnnotationToolMode(),
        annotationsList: records,
        selectedAnnotationId: selectedId,
      });
      this.renderUI(records, selectedId);
    });
  }

  private handleMarkerOrPinSelect(id: number): void {
    this.panelEl.classList.remove('is-collapsed');
    this.store.selectAnnotation(id);
    const rec = this.store.getSelectedRecord();
    if (rec) {
      this.scene.flyToCameraPose(rec.cameraPose);
      this.onFloorModeChanged?.();
      if (rec.kind === 'move' && rec.objectTransform) {
        this.scene.selectMovedObjectByUuid(rec.objectTransform.targetUuid);
      }
    }
    setTimeout(() => {
      this.noteInputEl.focus();
    }, 20);
  }

  private bindDraggableWindow(): void {
    this.collapseBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      this.panelEl.classList.toggle('is-collapsed');
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

  private selectTool(tool: AnnotationToolMode, enableAnnotateMode = true): void {
    if (enableAnnotateMode && !this.scene.isAnnotationMode()) {
      this.scene.setAnnotationMode(true);
    }
    this.scene.setAnnotationToolMode(tool);
    this.syncModeAndToolButtonsUI();
    this.renderInspectorBoxes(this.store.getSelectedRecord());
  }

  private syncModeAndToolButtonsUI(): void {
    const active = this.scene.isAnnotationMode();
    const tool = this.scene.getAnnotationToolMode();

    twinStore.syncAnnotationState({
      annotatorActive: active,
      annotationTool: tool,
    });

    this.modeBtn.classList.toggle('is-active-mode', active);
    this.modeDotEl.classList.toggle('off-state', !active);

    const toolLabel =
      tool === 'move'
        ? 'Move Object'
        : tool === 'rotate'
          ? 'Rotate Object'
          : tool === 'measure'
            ? 'Measure Span'
            : 'Pin Issue';
    this.modeLabelEl.textContent = active
      ? `Annotate: ON · ${toolLabel}`
      : 'Annotate Mode: OFF';

    this.toolPinBtn.classList.toggle('is-active', tool === 'pin');
    this.toolMoveBtn.classList.toggle('is-active', tool === 'move');
    this.toolRotateBtn.classList.toggle('is-active', tool === 'rotate');
    this.toolMeasureBtn.classList.toggle('is-active', tool === 'measure');

    const gizmoMode = this.scene.getGizmoTransformMode();
    this.gizmoTranslateBtn.classList.toggle('is-active', gizmoMode === 'translate');
    this.gizmoRotateBtn.classList.toggle('is-active', gizmoMode === 'rotate');
    this.moveBoxTitleEl.textContent =
      gizmoMode === 'rotate' ? 'ROTATE / MOVE OBJECT' : 'MOVE / ROTATE OBJECT';
  }

  private bindEvents(): void {
    this.modeBtn.addEventListener('click', () => {
      this.scene.toggleAnnotationMode();
      this.syncModeAndToolButtonsUI();
      this.renderInspectorBoxes(this.store.getSelectedRecord());
    });

    this.toolPinBtn.addEventListener('click', () => this.selectTool('pin', true));
    this.toolMoveBtn.addEventListener('click', () => this.selectTool('move', true));
    this.toolRotateBtn.addEventListener('click', () => this.selectTool('rotate', true));
    this.toolMeasureBtn.addEventListener('click', () => this.selectTool('measure', true));

    this.gizmoTranslateBtn.addEventListener('click', () =>
      this.selectTool('move', true)
    );
    this.gizmoRotateBtn.addEventListener('click', () =>
      this.selectTool('rotate', true)
    );

    this.moveTargetSelectEl.addEventListener('change', () => {
      const targetUuid = this.moveTargetSelectEl.value;
      if (targetUuid) {
        this.scene.switchSelectedMoveCandidate(targetUuid);
      }
    });

    const applyNumericMoveInputs = (): void => {
      const dx = Number.parseFloat(this.moveDxInput.value) || 0;
      const dy = Number.parseFloat(this.moveDyInput.value) || 0;
      const dz = Number.parseFloat(this.moveDzInput.value) || 0;
      const dRotY = Number.parseFloat(this.moveDRotYInput.value) || 0;
      this.scene.setSelectedObjectDeltaTransform(dx, dy, dz, dRotY);
    };

    this.moveDxInput.addEventListener('change', applyNumericMoveInputs);
    this.moveDyInput.addEventListener('change', applyNumericMoveInputs);
    this.moveDzInput.addEventListener('change', applyNumericMoveInputs);
    this.moveDRotYInput.addEventListener('change', applyNumericMoveInputs);

    this.moveRotYSlider.addEventListener('input', () => {
      const dRotY = Number.parseFloat(this.moveRotYSlider.value) || 0;
      this.moveRotYReadout.textContent = `${dRotY >= 0 ? '+' : ''}${dRotY}°`;
      const dx = Number.parseFloat(this.moveDxInput.value) || 0;
      const dy = Number.parseFloat(this.moveDyInput.value) || 0;
      const dz = Number.parseFloat(this.moveDzInput.value) || 0;
      this.scene.setSelectedObjectDeltaTransform(dx, dy, dz, dRotY);
    });

    this.nudgeXmBtn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(-0.05, 0, 0, 0)
    );
    this.nudgeXpBtn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0.05, 0, 0, 0)
    );
    this.nudgeZmBtn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0, -0.05, 0)
    );
    this.nudgeZpBtn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0, 0.05, 0)
    );
    this.nudgeYmBtn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, -0.02, 0, 0)
    );
    this.nudgeYpBtn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0.02, 0, 0)
    );
    this.nudgeRotL90Btn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0, 0, -90)
    );
    this.nudgeRotLBtn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0, 0, -45)
    );
    this.nudgeRotL15Btn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0, 0, -15)
    );
    this.nudgeRotR15Btn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0, 0, 15)
    );
    this.nudgeRotRBtn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0, 0, 45)
    );
    this.nudgeRotR90Btn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0, 0, 90)
    );
    this.nudgeRot180Btn.addEventListener('click', () =>
      this.scene.nudgeSelectedObject(0, 0, 0, 180)
    );

    this.moveResetBtn.addEventListener('click', () => {
      const targetUuid =
        this.activeTransformState?.transform.targetUuid ??
        this.store.getSelectedRecord()?.objectTransform?.targetUuid;
      if (!targetUuid) return;
      this.scene.resetMovedObject(targetUuid);
      const existingRec = this.store
        .getRecords()
        .find((r) => r.kind === 'move' && r.objectTransform?.targetUuid === targetUuid);
      if (existingRec) {
        this.store.removeAnnotation(existingRec.id);
      }
      this.renderInspectorBoxes(this.store.getSelectedRecord());
    });

    this.measureSnapCheckbox.addEventListener('change', () => {
      this.scene.setMeasureAxisSnap(this.measureSnapCheckbox.checked);
    });

    this.measureCancelBtn.addEventListener('click', () => {
      this.scene.cancelActiveMeasurement();
    });

    this.measureTargetInputEl.addEventListener('input', () => {
      const selected = this.store.getSelectedRecord();
      if (selected && selected.kind === 'measure') {
        this.store.updateTargetMeasurement(
          selected.id,
          this.measureTargetInputEl.value
        );
      }
    });

    this.measureTargetInputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.noteInputEl.focus();
      }
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.scene.isWalkthroughMode() || !this.scene.isAnnotationMode()) return;
      const tag = document.activeElement?.tagName ?? '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'p') {
        e.preventDefault();
        this.selectTool('pin', true);
      } else if (key === 'm') {
        e.preventDefault();
        this.selectTool('move', true);
      } else if (key === 'r') {
        e.preventDefault();
        this.selectTool('measure', true);
      } else if (e.key === 'Escape') {
        if (this.liveMeasureState?.active) {
          this.scene.cancelActiveMeasurement();
        } else {
          this.scene.setAnnotationMode(false);
          this.syncModeAndToolButtonsUI();
          this.renderInspectorBoxes(this.store.getSelectedRecord());
        }
      }
    });

    // 1. Pin Pick Callback
    this.scene.setOnAnnotationPick((hit) => {
      this.panelEl.classList.remove('is-collapsed');
      this.store.addAnnotation(hit, '');
      setTimeout(() => {
        this.noteInputEl.focus();
        this.noteInputEl.select();
      }, 20);
    });

    // 2. Object Move / Rotate Callback
    this.scene.setOnObjectTransformChange(
      (baseHit, transform, candidates, commitToStore) => {
        this.panelEl.classList.remove('is-collapsed');
        if (!baseHit || !transform) {
          this.activeTransformState = null;
          this.renderInspectorBoxes(this.store.getSelectedRecord());
          return;
        }

        this.activeTransformState = { baseHit, transform, candidates };

        if (commitToStore) {
          const [dx, dy, dz] = transform.deltaTranslation;
          const [drx, dry, drz] = transform.deltaRotationDeg;
          const hasNonZeroDelta =
            Math.hypot(dx, dy, dz) >= 0.002 ||
            Math.abs(drx) >= 0.1 ||
            Math.abs(dry) >= 0.1 ||
            Math.abs(drz) >= 0.1;

          if (hasNonZeroDelta) {
            this.store.upsertMoveAnnotation(
              baseHit,
              transform,
              this.scene.getCurrentCameraPoseSnapshot()
            );
          }
        } else {
          const existingRec = this.store
            .getRecords()
            .find(
              (r) =>
                r.kind === 'move' &&
                r.objectTransform?.targetUuid === transform.targetUuid
            );
          if (existingRec) {
            this.store.selectAnnotation(existingRec.id);
          }
        }

        this.renderInspectorBoxes(this.store.getSelectedRecord());
      }
    );

    // 3. Live Measure Preview Callback
    this.scene.setOnMeasurePreviewChange((state) => {
      this.liveMeasureState = state;
      this.renderInspectorBoxes(this.store.getSelectedRecord());
    });

    // 4. Measure Complete Callback
    this.scene.setOnMeasureComplete((startHit, endHit, snappedEnd) => {
      this.panelEl.classList.remove('is-collapsed');
      this.liveMeasureState = null;
      this.store.addMeasureAnnotation(startHit, endHit, snappedEnd, '');
      setTimeout(() => {
        this.measureTargetInputEl.focus();
        this.measureTargetInputEl.select();
      }, 20);
    });

    // 5. Marker Selection Callback
    this.scene.setOnAnnotationMarkerSelect((id) => {
      this.handleMarkerOrPinSelect(id);
    });

    this.noteInputEl.addEventListener('input', () => {
      const selectedId = this.store.getSelectedId();
      if (selectedId !== null) {
        this.store.updateNote(selectedId, this.noteInputEl.value);
      }
    });

    this.noteInputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.noteInputEl.blur();
      }
    });

    this.copyBtn.addEventListener('click', async () => {
      const formatted = formatAnnotationsMarkdownReport(this.store);
      const ok = await copyTextWithFallback(formatted);
      const orig = this.copyBtn.textContent;
      this.copyBtn.textContent = ok ? 'Copied for Agent' : 'Copied';
      setTimeout(() => {
        this.copyBtn.textContent = orig;
      }, 1800);
    });

    this.exportBtn.addEventListener('click', (e: MouseEvent) => {
      twinStore.syncAnnotationState({ usdaPreviewOpen: true });
      if (e.shiftKey) {
        exportAnnotationsAsJsonFile(this.store);
        return;
      }
      exportAnnotationsAsUsdaFile(this.store);
    });

    this.clearBtn.addEventListener('click', () => {
      for (const r of this.store.getRecords()) {
        if (r.kind === 'move' && r.objectTransform) {
          this.scene.resetMovedObject(r.objectTransform.targetUuid);
        }
      }
      this.scene.detachMoveGizmo();
      this.scene.cancelActiveMeasurement();
      this.store.clearAll();
    });
  }

  private renderInspectorBoxes(selected: SceneAnnotationRecord | null): void {
    const tool = this.scene.getAnnotationToolMode();
    const isAnnotateOn = this.scene.isAnnotationMode();

    // --- 1. Move / Rotate Inspector Box ---
    const showMoveBox =
      (isAnnotateOn && (tool === 'move' || tool === 'rotate')) ||
      selected?.kind === 'move';
    this.moveBoxEl.hidden = !showMoveBox;

    if (showMoveBox) {
      const tf =
        this.activeTransformState?.transform ?? selected?.objectTransform ?? null;
      const candidates = this.activeTransformState?.candidates ?? [];

      if (tf) {
        this.moveEmptyEl.hidden = true;
        this.moveControlsEl.hidden = false;

        this.moveTargetSelectEl.innerHTML = '';
        const listToRender: readonly MovableTargetCandidate[] =
          candidates.length > 0
            ? candidates
            : [
                {
                  uuid: tf.targetUuid,
                  label: `${tf.targetKind === 'group' ? 'Group' : 'Mesh'}: ${tf.targetName}`,
                  kind: tf.targetKind,
                },
              ];
        for (const c of listToRender) {
          const opt = document.createElement('option');
          opt.value = c.uuid;
          opt.textContent = c.label;
          opt.selected = c.uuid === tf.targetUuid;
          this.moveTargetSelectEl.appendChild(opt);
        }

        if (document.activeElement !== this.moveDxInput) {
          this.moveDxInput.value = String(tf.deltaTranslation[0]);
        }
        if (document.activeElement !== this.moveDyInput) {
          this.moveDyInput.value = String(tf.deltaTranslation[1]);
        }
        if (document.activeElement !== this.moveDzInput) {
          this.moveDzInput.value = String(tf.deltaTranslation[2]);
        }
        if (document.activeElement !== this.moveDRotYInput) {
          this.moveDRotYInput.value = String(tf.deltaRotationDeg[1]);
        }
        if (document.activeElement !== this.moveRotYSlider) {
          const clampedRotY = Math.max(
            -180,
            Math.min(180, Math.round(tf.deltaRotationDeg[1]))
          );
          this.moveRotYSlider.value = String(clampedRotY);
        }
        const dRy = tf.deltaRotationDeg[1];
        this.moveRotYReadout.textContent = `${dRy >= 0 ? '+' : ''}${dRy}°`;

        this.moveSummaryEl.textContent = `Center: [${tf.initialWorldCenter.join(', ')}] → [${tf.newWorldCenter.join(', ')}] · Rot: [${tf.newRotationDeg.join('°, ')}°]`;
      } else {
        this.moveEmptyEl.hidden = false;
        this.moveControlsEl.hidden = true;
      }
    }

    // --- 2. Measure Span Inspector Box ---
    const showMeasureBox =
      (isAnnotateOn && tool === 'measure') || selected?.kind === 'measure';
    this.measureBoxEl.hidden = !showMeasureBox;

    if (showMeasureBox) {
      const live = this.liveMeasureState;
      this.measureSnapCheckbox.checked =
        live?.axisSnapLocked ?? this.scene.getMeasureAxisSnap();

      if (live?.active) {
        this.measureCancelBtn.hidden = false;
        this.measureTargetRowEl.hidden = true;
        if (live.currentEndPoint && live.distanceM !== null && live.deltaXYZ) {
          this.measureStatusEl.innerHTML =
            'Click <strong>Point B</strong> to save span annotation (hold <strong>Shift</strong> for axis snap).';
          this.measureReadoutEl.hidden = false;
          this.measureDistMEl.textContent = `${live.distanceM.toFixed(3)} m`;
          this.measureDistCmEl.textContent = `${(live.distanceM * 100).toFixed(1)} cm · Horiz ${live.horizontalDistanceM?.toFixed(3) ?? '0.000'} m`;
          this.measureDeltasEl.textContent = `Pt A [${live.startPoint?.join(', ')}] → Pt B [${live.currentEndPoint.join(', ')}] · ΔX=${live.deltaXYZ[0]}m, ΔY=${live.deltaXYZ[1]}m, ΔZ=${live.deltaXYZ[2]}m`;
        } else {
          this.measureStatusEl.innerHTML = `Point A locked at <code>[${live.startPoint?.join(', ')}]</code> — move cursor and click <strong>Point B</strong>.`;
          this.measureReadoutEl.hidden = true;
        }
      } else if (selected?.kind === 'measure' && selected.measurement) {
        const m = selected.measurement;
        this.measureCancelBtn.hidden = true;
        this.measureStatusEl.innerHTML =
          isAnnotateOn && tool === 'measure'
            ? 'Showing selected span. Click any 3D surface to start a new <strong>Point A</strong>.'
            : `Measured span between <code>${m.startMeshName}</code> and <code>${m.endMeshName}</code>:`;
        this.measureReadoutEl.hidden = false;
        this.measureDistMEl.textContent = `${m.distanceM.toFixed(3)} m`;
        this.measureDistCmEl.textContent = formatMetersAndFeetInches(m.distanceM);
        this.measureDeltasEl.textContent = `A [${m.startPoint.join(', ')}] → B [${m.endPoint.join(', ')}] · ΔX=${m.deltaXYZ[0]}m, ΔY=${m.deltaXYZ[1]}m, ΔZ=${m.deltaXYZ[2]}m`;

        this.measureTargetRowEl.hidden = false;
        if (document.activeElement !== this.measureTargetInputEl) {
          this.measureTargetInputEl.value = m.targetMeasurement ?? '';
        }
      } else {
        this.measureCancelBtn.hidden = true;
        this.measureStatusEl.innerHTML =
          'Click <strong>Point A</strong> on any 3D wall, floor, or cabinet, then click <strong>Point B</strong> to measure span.';
        this.measureReadoutEl.hidden = true;
        this.measureTargetRowEl.hidden = true;
      }
    }
  }

  private renderUI(
    records: readonly SceneAnnotationRecord[],
    selectedId: number | null
  ): void {
    this.countBadgeEl.textContent = String(records.length);
    this.syncModeAndToolButtonsUI();

    const selected =
      selectedId !== null ? records.find((r) => r.id === selectedId) ?? null : null;

    this.renderInspectorBoxes(selected);

    if (selected) {
      this.editorBoxEl.hidden = false;
      const kind: AnnotationKind = selected.kind ?? 'pin';
      const [x, y, z] = selected.worldPoint;
      const [nx, ny, nz] = selected.worldNormal;

      if (kind === 'move' && selected.objectTransform) {
        const tf = selected.objectTransform;
        const [dx, dy, dz] = tf.deltaTranslation;
        const [drx, dry, drz] = tf.deltaRotationDeg;
        const hasMove = Math.hypot(dx, dy, dz) >= 0.002;
        const hasRot = Math.hypot(drx, dry, drz) >= 0.1;
        const labelWord = hasMove && hasRot ? 'MOVE+ROT' : hasRot ? 'ROTATE' : 'MOVE';
        this.editorTitleEl.textContent = `${labelWord} #${selected.id} · ${selected.roomName.toUpperCase()}`;
        this.editorCoordsEl.textContent = hasMove
          ? `Δ[${tf.deltaTranslation.join(', ')}]m${hasRot ? ` · ΔRotY ${dry}°` : ''}`
          : `ΔRot[${drx}°, ${dry}°, ${drz}°]`;
        this.editorMeshEl.textContent = `${tf.targetName} · [${tf.initialWorldCenter.join(', ')}] → [${tf.newWorldCenter.join(', ')}] · Rot=[${tf.newRotationDeg.join('°, ')}°]`;
      } else if (kind === 'measure' && selected.measurement) {
        const m = selected.measurement;
        const targetText = m.targetMeasurement?.trim()
          ? ` → Target: ${m.targetMeasurement.trim()}`
          : '';
        this.editorTitleEl.textContent = `SPAN #${selected.id} · ${selected.roomName.toUpperCase()}`;
        this.editorCoordsEl.textContent = `${m.distanceM.toFixed(3)}m${targetText}`;
        this.editorMeshEl.textContent = `A [${m.startPoint.join(', ')}] → B [${m.endPoint.join(', ')}] · Δ[${m.deltaXYZ.join(', ')}]m`;
      } else {
        this.editorTitleEl.textContent = `PIN #${selected.id} · ${selected.roomName.toUpperCase()}`;
        this.editorCoordsEl.textContent = `[${x}, ${y}, ${z}]`;
        this.editorMeshEl.textContent = `${selected.meshInfo.meshName} · ${selected.meshInfo.geometrySummary} · n=[${nx}, ${ny}, ${nz}]`;
      }

      if (document.activeElement !== this.noteInputEl) {
        this.noteInputEl.value = selected.note;
      }
    } else {
      this.editorBoxEl.hidden = true;
      this.noteInputEl.value = '';
    }

    this.listEl.innerHTML = '';
    if (records.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'annotator-empty';
      empty.innerHTML =
        'Toggle <strong>Annotate Mode</strong> (or <strong>Shift + Click</strong>) and choose <strong>Pin</strong>, <strong>Move</strong>, <strong>Rotate</strong>, or <strong>Measure</strong> to record issues, object movements/rotations, or span measurements.';
      this.listEl.appendChild(empty);
      return;
    }

    for (const r of records) {
      const kind: AnnotationKind = r.kind ?? 'pin';
      const [x, y, z] = r.worldPoint;
      const isSel = r.id === selectedId;
      const card = document.createElement('div');
      card.className = `annotator-item kind-${kind} ${isSel ? 'is-selected' : ''}`;

      const head = document.createElement('div');
      head.className = 'annotator-item-head';

      const badge = document.createElement('span');
      badge.className = `annotator-item-badge kind-${kind}`;
      let prefix = '';
      if (kind === 'move' && r.objectTransform) {
        const [dx, dy, dz] = r.objectTransform.deltaTranslation;
        const [drx, dry, drz] = r.objectTransform.deltaRotationDeg;
        const hasMove = Math.hypot(dx, dy, dz) >= 0.002;
        const hasRot = Math.hypot(drx, dry, drz) >= 0.1;
        prefix = hasMove && hasRot ? 'MOVE+ROT ' : hasRot ? 'ROTATE ' : 'MOVE ';
      } else if (kind === 'measure') {
        prefix = 'SPAN ';
      }
      badge.textContent = `${prefix}#${r.id}`;

      const room = document.createElement('span');
      room.className = 'annotator-item-room';
      room.textContent = r.roomName;

      const coords = document.createElement('span');
      coords.className = 'annotator-item-coords';
      if (kind === 'move' && r.objectTransform) {
        const [dx, dy, dz] = r.objectTransform.deltaTranslation;
        const [drx, dry, drz] = r.objectTransform.deltaRotationDeg;
        const hasMove = Math.hypot(dx, dy, dz) >= 0.002;
        const hasRot = Math.hypot(drx, dry, drz) >= 0.1;
        coords.textContent = hasMove
          ? `Δ[${dx}, ${dy}, ${dz}]m${hasRot ? ` · ${dry}°` : ''}`
          : `ΔRotY ${dry >= 0 ? '+' : ''}${dry}°`;
      } else if (kind === 'measure' && r.measurement) {
        const m = r.measurement;
        const tgt = m.targetMeasurement?.trim();
        coords.textContent = tgt ? `${m.distanceM}m → ${tgt}` : `${m.distanceM}m`;
      } else {
        coords.textContent = `${x}, ${y}, ${z}`;
      }

      const flyBtn = document.createElement('button');
      flyBtn.type = 'button';
      flyBtn.className = 'hud-inline-btn annotator-item-btn';
      flyBtn.title = 'Fly camera to this annotation view';
      flyBtn.textContent = 'Fly';
      flyBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        this.store.selectAnnotation(r.id);
        this.scene.flyToCameraPose(r.cameraPose);
        this.onFloorModeChanged?.();
        if (kind === 'move' && r.objectTransform) {
          this.scene.selectMovedObjectByUuid(r.objectTransform.targetUuid);
        }
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'hud-inline-btn annotator-item-btn annotator-del-btn';
      delBtn.title =
        kind === 'move'
          ? 'Delete this move annotation and restore original object position'
          : 'Delete this annotation';
      delBtn.textContent = '×';
      delBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        if (kind === 'move' && r.objectTransform) {
          this.scene.resetMovedObject(r.objectTransform.targetUuid);
        }
        this.store.removeAnnotation(r.id);
      });

      head.append(badge, room, coords, flyBtn, delBtn);

      const noteLine = document.createElement('div');
      noteLine.className = 'annotator-item-note';
      if (kind === 'measure' && r.measurement) {
        const m = r.measurement;
        const tgt = m.targetMeasurement?.trim();
        const fallback = tgt
          ? `Span ${m.distanceM}m → Real/Target: ${tgt}`
          : `Measured span: ${m.distanceM}m (${(m.distanceM * 100).toFixed(1)}cm)`;
        noteLine.textContent = r.note.trim() || fallback;
      } else {
        noteLine.textContent = r.note.trim() || '(Click to add description...)';
      }

      const metaLine = document.createElement('div');
      metaLine.className = 'annotator-item-meta';
      if (kind === 'move' && r.objectTransform) {
        const tf = r.objectTransform;
        metaLine.textContent = `${tf.targetName} · [${tf.initialWorldCenter.join(', ')}] → [${tf.newWorldCenter.join(', ')}]`;
      } else if (kind === 'measure' && r.measurement) {
        const m = r.measurement;
        metaLine.textContent = `A [${m.startPoint.join(', ')}] → B [${m.endPoint.join(', ')}] · Δ[${m.deltaXYZ.join(', ')}]m`;
      } else {
        metaLine.textContent = `${r.meshInfo.meshName} · ${r.meshInfo.geometrySummary}`;
      }

      card.append(head, noteLine, metaLine);
      card.addEventListener('click', () => {
        this.store.selectAnnotation(r.id);
        this.scene.flyToCameraPose(r.cameraPose);
        this.onFloorModeChanged?.();
        if (kind === 'move' && r.objectTransform) {
          this.scene.selectMovedObjectByUuid(r.objectTransform.targetUuid);
        }
        setTimeout(() => {
          if (kind === 'measure') {
            this.measureTargetInputEl.focus();
          } else {
            this.noteInputEl.focus();
          }
        }, 20);
      });

      this.listEl.appendChild(card);
    }
  }
}
