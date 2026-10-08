import type { JSX } from 'preact';
import {
  activeTool,
  isCoarsePointer,
  isMobile,
  sectionCut,
  touchNavMode,
  viewMode,
  type ShellTool,
} from '../../state/shell-store.ts';
import { Icon, type IconName } from './icons.tsx';
import { useShell } from './shell-context.ts';

interface DockTool {
  readonly id: ShellTool;
  readonly label: string;
  readonly icon: IconName;
  readonly key: string;
  readonly hint: string;
}

const TOOLS: readonly DockTool[] = [
  { id: 'orbit', label: 'Orbit', icon: 'hand', key: 'Esc', hint: 'Drag to orbit · right-drag to pan · scroll to zoom' },
  { id: 'measure', label: 'Measure', icon: 'ruler', key: 'M', hint: 'Click two points to measure' },
  { id: 'note', label: 'Note', icon: 'pin', key: 'N', hint: 'Click any surface to pin a note' },
];

export function ToolDock(): JSX.Element | null {
  const ctl = useShell();
  const tool = activeTool.value;
  const navMode = touchNavMode.value;
  const isTouch = isCoarsePointer.value || isMobile.value;
  // Walk mode has its own overlay (crosshair, key hints, room chip).
  if (viewMode.value === 'walk') return null;
  const activeHint =
    tool === 'orbit' && isTouch
      ? navMode === 'pan'
        ? '1-finger pan · 2-finger pinch zoom · double-tap room'
        : '1-finger orbit · 2-finger pan & pinch zoom · double-tap room'
      : (TOOLS.find((t) => t.id === tool)?.hint ?? '');

  return (
    <div class="shell-dock-wrap">
      <div class="shell-dock-hint" aria-live="polite">
        {activeHint}
      </div>
      <nav class="shell-dock" aria-label="Tools">
        <button
          type="button"
          class={`shell-dock-btn${tool === 'orbit' && navMode === 'orbit' ? ' is-active' : ''}`}
          aria-pressed={tool === 'orbit' && navMode === 'orbit'}
          title="1-finger Orbit (Esc)"
          onClick={() => {
            ctl.setTool('orbit');
            ctl.setTouchNavMode('orbit');
          }}
        >
          <Icon name="hand" size={18} />
          <span>Orbit</span>
        </button>
        <button
          type="button"
          class={`shell-dock-btn${tool === 'orbit' && navMode === 'pan' ? ' is-active' : ''}`}
          aria-pressed={tool === 'orbit' && navMode === 'pan'}
          title="1-finger Pan (drag with one finger to pan across the property)"
          onClick={() => {
            ctl.setTool('orbit');
            ctl.setTouchNavMode(navMode === 'pan' ? 'orbit' : 'pan');
          }}
        >
          <Icon name="move" size={18} />
          <span>Pan</span>
        </button>
        {TOOLS.slice(1).map((t) => (
          <button
            key={t.id}
            type="button"
            class={`shell-dock-btn${tool === t.id ? ' is-active' : ''}`}
            aria-pressed={tool === t.id}
            title={`${t.label} (${t.key})`}
            onClick={() => ctl.toggleTool(t.id as Exclude<ShellTool, 'orbit'>)}
          >
            <Icon name={t.icon} size={18} />
            <span>{t.label}</span>
          </button>
        ))}
        <button
          type="button"
          class={`shell-dock-btn${sectionCut.value ? ' is-active' : ''}`}
          aria-pressed={sectionCut.value}
          title="Section: cut away ceilings to see inside"
          onClick={() => ctl.toggleSection()}
        >
          <Icon name="section" size={18} />
          <span>Section</span>
        </button>
        <span class="shell-dock-sep" aria-hidden="true" />
        <button
          type="button"
          class="shell-dock-btn"
          title="Recenter on the current room (F)"
          onClick={() => ctl.recenter()}
        >
          <Icon name="target" size={18} />
          <span>Recenter</span>
        </button>
      </nav>
    </div>
  );
}
