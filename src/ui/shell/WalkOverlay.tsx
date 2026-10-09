import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { TwinWalkthroughState } from '../../app/twin-api.ts';
import {
  currentRoomId,
  isCoarsePointer,
  isMobile,
  navigatorOpen,
  viewMode,
  walkHintNonce,
} from '../../state/shell-store.ts';
import { Icon } from './icons.tsx';
import { useShell } from './shell-context.ts';

const HINT_AUTO_HIDE_MS = 6000;
const JOYSTICK_RADIUS_PX = 48;
const JOYSTICK_DEADZONE_PX = 6;

const HINTS: readonly { readonly keys: readonly string[]; readonly label: string }[] = [
  { keys: ['W', 'A', 'S', 'D'], label: 'Walk' },
  { keys: ['Shift'], label: 'Run' },
  { keys: ['Space'], label: 'Jump' },
  { keys: ['C'], label: 'Crouch' },
  { keys: ['F'], label: 'Use' },
  { keys: ['Esc'], label: 'Exit' },
];

function useWalkState(): TwinWalkthroughState {
  const ctl = useShell();
  const [state, setState] = useState<TwinWalkthroughState>(() => ctl.api.walkthrough.getState());
  useEffect(() => {
    setState(ctl.api.walkthrough.getState());
    return ctl.api.walkthrough.onStateChanged(setState);
  }, [ctl]);
  return state;
}

/** Top-left room indicator + teleport dropdown + quick Exit button on touch. */
function WalkRoomChip({ showTouchControls }: { readonly showTouchControls: boolean }): JSX.Element {
  const ctl = useShell();
  const [open, setOpen] = useState(false);
  const roomId = currentRoomId.value;
  const entry = roomId ? ctl.api.rooms.getManifest(roomId) : undefined;
  const floorLabel = entry ? (entry.floor === 'first' ? 'First floor' : 'Ground floor') : 'Outside';
  const spawns = ctl.api.walkthrough.spawns();
  return (
    <div class={`shell-walk-room${navigatorOpen.value ? ' is-shifted' : ''}`}>
      <div class="shell-walk-room-bar">
        <button
          type="button"
          class="shell-walk-chip shell-glass"
          aria-haspopup="menu"
          aria-expanded={open}
          title="Jump to another room"
          onClick={() => setOpen(!open)}
        >
          <span class="shell-walk-chip-eyebrow">{floorLabel}</span>
          <span class="shell-walk-chip-title">{ctl.roomLabel(roomId)}</span>
          <Icon name="chevron-down" size={14} />
        </button>
        {showTouchControls && (
          <button
            type="button"
            class="shell-walk-chip shell-walk-exit shell-glass"
            aria-label="Exit walkthrough back to 3D orbit view"
            title="Exit Walk (3D View)"
            onClick={() => ctl.setViewMode('3d')}
          >
            <Icon name="cube" size={15} />
            <span>Exit Walk</span>
          </button>
        )}
      </div>
      {open && (
        <div class="shell-walk-menu shell-glass" role="menu" aria-label="Go to room">
          {spawns.map((s) => (
            <button
              key={s.id}
              type="button"
              role="menuitem"
              class={`shell-walk-menu-item${s.zoneId === roomId ? ' is-active' : ''}`}
              onClick={() => {
                ctl.api.walkthrough.teleport(s.id);
                setOpen(false);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Floating-origin virtual left thumbstick for mobile, tablet, and Pixel Fold.
 * Touching anywhere inside the generous bottom-left touch zone anchors the stick
 * center at the finger's initial touch point so touching down never lurches.
 */
function WalkTouchJoystick(): JSX.Element {
  const ctl = useShell();
  const zoneRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const originClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stick, setStick] = useState<{
    active: boolean;
    baseOffsetX: number;
    baseOffsetY: number;
    knobX: number;
    knobY: number;
    sprinting: boolean;
  }>({
    active: false,
    baseOffsetX: 0,
    baseOffsetY: 0,
    knobX: 0,
    knobY: 0,
    sprinting: false,
  });

  useEffect(() => {
    return () => {
      ctl.api.walkthrough.setTouchMove(0, 0, false);
    };
  }, [ctl]);

  const updateFromMove = (clientX: number, clientY: number, baseOffsetX: number, baseOffsetY: number): void => {
    const rawDx = clientX - originClientRef.current.x;
    const rawDy = clientY - originClientRef.current.y;
    const dist = Math.hypot(rawDx, rawDy);
    if (dist <= JOYSTICK_DEADZONE_PX) {
      setStick({
        active: true,
        baseOffsetX,
        baseOffsetY,
        knobX: 0,
        knobY: 0,
        sprinting: false,
      });
      ctl.api.walkthrough.setTouchMove(0, 0, false);
      return;
    }
    const clampedDist = Math.min(JOYSTICK_RADIUS_PX, dist);
    const dirX = rawDx / dist;
    const dirY = rawDy / dist;
    const knobX = dirX * clampedDist;
    const knobY = dirY * clampedDist;
    const effectiveMag =
      (clampedDist - JOYSTICK_DEADZONE_PX) / (JOYSTICK_RADIUS_PX - JOYSTICK_DEADZONE_PX);
    const normX = dirX * effectiveMag;
    const normY = -dirY * effectiveMag;
    const sprinting = effectiveMag > 0.78;
    setStick({
      active: true,
      baseOffsetX,
      baseOffsetY,
      knobX,
      knobY,
      sprinting,
    });
    ctl.api.walkthrough.setTouchMove(normX, normY, sprinting);
  };

  const resetStick = (): void => {
    activePointerId.current = null;
    setStick({
      active: false,
      baseOffsetX: 0,
      baseOffsetY: 0,
      knobX: 0,
      knobY: 0,
      sprinting: false,
    });
    ctl.api.walkthrough.setTouchMove(0, 0, false);
  };

  return (
    <div
      ref={zoneRef}
      class="shell-walk-joystick-zone"
      role="slider"
      aria-label="Walk movement thumbstick"
      aria-valuetext={stick.sprinting ? 'Running' : stick.active ? 'Walking' : 'Idle'}
      onPointerDown={(e) => {
        if (activePointerId.current !== null) return;
        e.stopPropagation();
        const zone = zoneRef.current;
        if (!zone) return;
        const rect = zone.getBoundingClientRect();
        const defaultCenterX = rect.left + 78;
        const defaultCenterY = rect.bottom - 78;
        const baseOffsetX = Math.max(-44, Math.min(54, e.clientX - defaultCenterX));
        const baseOffsetY = Math.max(-54, Math.min(44, e.clientY - defaultCenterY));
        originClientRef.current = { x: e.clientX, y: e.clientY };
        activePointerId.current = e.pointerId;
        try {
          zone.setPointerCapture(e.pointerId);
        } catch {
          // Ignore synthetic pointer capture errors
        }
        setStick({
          active: true,
          baseOffsetX,
          baseOffsetY,
          knobX: 0,
          knobY: 0,
          sprinting: false,
        });
        ctl.api.walkthrough.setTouchMove(0, 0, false);
      }}
      onPointerMove={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        e.stopPropagation();
        updateFromMove(e.clientX, e.clientY, stick.baseOffsetX, stick.baseOffsetY);
      }}
      onPointerUp={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        e.stopPropagation();
        resetStick();
      }}
      onPointerCancel={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        e.stopPropagation();
        resetStick();
      }}
    >
      <div
        class={`shell-walk-joystick shell-glass${stick.active ? ' is-active' : ''}${stick.sprinting ? ' is-sprint' : ''}`}
        style={{
          transform: `translate3d(${stick.baseOffsetX.toFixed(1)}px, ${stick.baseOffsetY.toFixed(1)}px, 0)`,
        }}
      >
        <div class="shell-walk-joystick-ring" aria-hidden="true" />
        <div
          class="shell-walk-joystick-knob"
          style={{
            transform: `translate3d(${stick.knobX.toFixed(1)}px, ${stick.knobY.toFixed(1)}px, 0)`,
          }}
          aria-hidden="true"
        />
        <span class="shell-walk-joystick-label">{stick.sprinting ? 'RUN' : 'MOVE'}</span>
      </div>
    </div>
  );
}

/** Right-side touch action buttons (Jump, Crouch, Use/Interact) for mobile, tablet & Pixel Fold. */
function WalkTouchActions({ state }: { readonly state: TwinWalkthroughState }): JSX.Element {
  const ctl = useShell();
  return (
    <div
      class="shell-walk-touch-actions"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {state.prompt && (
        <button
          type="button"
          class="shell-walk-touch-btn is-primary shell-glass"
          aria-label={state.prompt}
          onClick={() => ctl.api.walkthrough.interact()}
        >
          <Icon name="sparkle" size={18} />
          <span>{state.prompt}</span>
        </button>
      )}
      <div class="shell-walk-touch-row">
        <button
          type="button"
          class={`shell-walk-touch-circle shell-glass${state.crouched ? ' is-active' : ''}`}
          aria-pressed={state.crouched}
          aria-label="Toggle crouch"
          title="Crouch"
          onClick={() => ctl.api.walkthrough.toggleCrouch()}
        >
          <Icon name="crouch" size={18} />
          <span>{state.crouched ? 'Stand' : 'Crouch'}</span>
        </button>
        <button
          type="button"
          class="shell-walk-touch-circle shell-glass"
          aria-label="Jump or climb"
          title="Jump"
          onClick={() => ctl.api.walkthrough.jump()}
        >
          <Icon name="jump" size={18} />
          <span>Jump</span>
        </button>
        <button
          type="button"
          class={`shell-walk-touch-circle shell-glass${state.prompt ? ' is-target' : ''}`}
          aria-label={state.prompt ?? 'Use object under crosshair'}
          title={state.prompt ?? 'Use / Interact'}
          onClick={() => ctl.api.walkthrough.interact()}
        >
          <Icon name="target" size={18} />
          <span>Use</span>
        </button>
      </div>
    </div>
  );
}

/** Compact bottom-centre key hints; auto-hides, `?` re-shows. */
function WalkHints(): JSX.Element {
  const nonce = walkHintNonce.value;
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), HINT_AUTO_HIDE_MS);
    return () => window.clearTimeout(t);
  }, [nonce]);
  return (
    <div class={`shell-walk-hints shell-glass${visible ? '' : ' is-hidden'}`} aria-hidden={!visible} role="note">
      {HINTS.map((h) => (
        <span key={h.label} class="shell-walk-hint">
          {h.keys.map((k) => (
            <kbd key={k}>{k}</kbd>
          ))}
          <span>{h.label}</span>
        </span>
      ))}
      <span class="shell-walk-hint shell-walk-hint-faint">
        <kbd>?</kbd>
        <span>Show again</span>
      </span>
    </div>
  );
}

/**
 * First-person walkthrough overlay: minimal crosshair, interaction pill next
 * to it, room chip top-left, floating-origin virtual thumbstick + action pad
 * on touch/mobile/foldable devices, and an auto-hiding desktop hint bar.
 */
export function WalkOverlay(): JSX.Element | null {
  const ctl = useShell();
  const state = useWalkState();
  const showTouchControls = isCoarsePointer.value || isMobile.value;
  if (viewMode.value !== 'walk' || !state.active) return null;
  return (
    <div class="shell-walk" aria-label="Walkthrough">
      <div class={`shell-walk-crosshair${state.prompt ? ' is-target' : ''}`} aria-hidden="true" />
      {state.prompt && (
        <button
          type="button"
          class="shell-walk-prompt"
          aria-live="polite"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            ctl.api.walkthrough.interact();
          }}
        >
          <kbd>{showTouchControls ? 'TAP' : 'F'}</kbd>
          <span>{state.prompt}</span>
        </button>
      )}
      <WalkRoomChip showTouchControls={showTouchControls} />
      {showTouchControls && <WalkTouchJoystick />}
      {showTouchControls && <WalkTouchActions state={state} />}
      {!showTouchControls && <WalkHints />}
      {state.crouched && !showTouchControls && <span class="shell-walk-status shell-glass">Crouching</span>}
    </div>
  );
}
