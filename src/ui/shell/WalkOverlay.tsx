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
const JOYSTICK_RADIUS_PX = 44;

const HINTS: readonly { readonly keys: readonly string[]; readonly label: string }[] = [
  { keys: ['W', 'A', 'S', 'D'], label: 'Move' },
  { keys: ['Mouse'], label: 'Look' },
  { keys: ['Shift'], label: 'Run' },
  { keys: ['F'], label: 'Interact' },
  { keys: ['C'], label: 'Crouch' },
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

/** Room + floor chip (top-left) with a "go to" spawn list. */
function WalkRoomChip(): JSX.Element {
  const ctl = useShell();
  const [open, setOpen] = useState(false);
  // The engine's room tracker follows the walker's feet, so this is the room you stand in.
  const roomId = currentRoomId.value;
  const entry = roomId ? ctl.api.rooms.getManifest(roomId) : undefined;
  const floorLabel = entry ? (entry.floor === 'first' ? 'First floor' : 'Ground floor') : 'Outside';
  const spawns = ctl.api.walkthrough.spawns();
  return (
    <div class={`shell-walk-room${navigatorOpen.value ? ' is-shifted' : ''}`}>
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

/** Virtual left thumbstick for mobile, tablet, and Pixel Fold walkthrough movement. */
function WalkTouchJoystick(): JSX.Element {
  const ctl = useShell();
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [knob, setKnob] = useState<{ x: number; y: number; sprinting: boolean }>({
    x: 0,
    y: 0,
    sprinting: false,
  });

  useEffect(() => {
    return () => {
      ctl.api.walkthrough.setTouchMove(0, 0, false);
    };
  }, [ctl]);

  const updateFromClient = (clientX: number, clientY: number): void => {
    const rawDx = clientX - originRef.current.x;
    const rawDy = clientY - originRef.current.y;
    const dist = Math.hypot(rawDx, rawDy);
    const scale = dist > JOYSTICK_RADIUS_PX ? JOYSTICK_RADIUS_PX / dist : 1;
    const dx = rawDx * scale;
    const dy = rawDy * scale;
    const normX = dx / JOYSTICK_RADIUS_PX;
    const normY = -dy / JOYSTICK_RADIUS_PX;
    const sprinting = dist / JOYSTICK_RADIUS_PX > 0.82;
    setKnob({ x: dx, y: dy, sprinting });
    ctl.api.walkthrough.setTouchMove(normX, normY, sprinting);
  };

  const resetStick = (): void => {
    activePointerId.current = null;
    setKnob({ x: 0, y: 0, sprinting: false });
    ctl.api.walkthrough.setTouchMove(0, 0, false);
  };

  return (
    <div
      ref={baseRef}
      class={`shell-walk-joystick shell-glass${knob.sprinting ? ' is-sprint' : ''}`}
      role="slider"
      aria-label="Walk movement thumbstick"
      aria-valuetext={knob.sprinting ? 'Running' : 'Walking'}
      onPointerDown={(e) => {
        e.stopPropagation();
        const el = baseRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        originRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        activePointerId.current = e.pointerId;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // Ignore synthetic pointer capture errors
        }
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        e.stopPropagation();
        updateFromClient(e.clientX, e.clientY);
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
      <div class="shell-walk-joystick-ring" aria-hidden="true" />
      <div
        class="shell-walk-joystick-knob"
        style={{ transform: `translate3d(${knob.x.toFixed(1)}px, ${knob.y.toFixed(1)}px, 0)` }}
        aria-hidden="true"
      />
      <span class="shell-walk-joystick-label">{knob.sprinting ? 'RUN' : 'MOVE'}</span>
    </div>
  );
}

/** Right-side touch action buttons (Interact + Crouch) for mobile, tablet & Pixel Fold. */
function WalkTouchActions({ state }: { readonly state: TwinWalkthroughState }): JSX.Element {
  const ctl = useShell();
  return (
    <div class="shell-walk-touch-actions">
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
 * to it, room chip top-left, virtual thumbstick + action pad on touch/mobile/foldable
 * devices, and an auto-hiding desktop hint bar.
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
          onClick={() => {
            ctl.api.walkthrough.interact();
          }}
        >
          <kbd>{showTouchControls ? 'TAP' : 'F'}</kbd>
          <span>{state.prompt}</span>
        </button>
      )}
      <WalkRoomChip />
      {showTouchControls && <WalkTouchJoystick />}
      {showTouchControls && <WalkTouchActions state={state} />}
      {!showTouchControls && <WalkHints />}
      {state.crouched && !showTouchControls && <span class="shell-walk-status shell-glass">Crouching</span>}
    </div>
  );
}
