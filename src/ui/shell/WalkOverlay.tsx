import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { TwinWalkthroughState } from '../../app/twin-api.ts';
import { currentRoomId, navigatorOpen, viewMode, walkHintNonce } from '../../state/shell-store.ts';
import { Icon } from './icons.tsx';
import { useShell } from './shell-context.ts';

const HINT_AUTO_HIDE_MS = 6000;

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
 * to it, room chip top-left and an auto-hiding hint bar. Exit lives in the
 * top bar (Walk toggle / Exit walk button).
 */
export function WalkOverlay(): JSX.Element | null {
  const ctl = useShell();
  const state = useWalkState();
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
          <kbd>F</kbd>
          <span>{state.prompt}</span>
        </button>
      )}
      <WalkRoomChip />
      <WalkHints />
      {state.crouched && <span class="shell-walk-status shell-glass">Crouching</span>}
    </div>
  );
}
