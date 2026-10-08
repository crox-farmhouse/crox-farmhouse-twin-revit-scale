import type { JSX } from 'preact';
import {
  devDrawerOpen,
  devMode,
  floorMode,
  guestMode,
  navigatorOpen,
  openHelp,
  roomPanelOpen,
  settingsOpen,
  tradeView,
  viewMode,
  type ShellViewMode,
} from '../../state/shell-store.ts';
import type { FloorViewMode } from '../../types/scene.ts';
import { TRADE_VIEW_LABELS, type TradeView } from '../../types/twin-ux.ts';
import { Icon, type IconName } from './icons.tsx';
import { PROPERTY_NAME } from './room-data.ts';
import { useShell } from './shell-context.ts';

const FLOORS: readonly { readonly id: FloorViewMode; readonly label: string; readonly key: string }[] = [
  { id: 'ground', label: 'Ground', key: '1' },
  { id: 'first', label: 'First', key: '2' },
  { id: 'all', label: 'All', key: '3' },
];

const VIEWS: readonly {
  readonly id: ShellViewMode;
  readonly label: string;
  readonly icon: IconName;
  readonly hint: string;
}[] = [
  { id: '3d', label: '3D', icon: 'cube', hint: 'Orbit around the model' },
  { id: 'plan', label: 'Plan', icon: 'plan', hint: 'Top-down floor plan' },
  { id: 'walk', label: 'Walk', icon: 'walk', hint: 'Walk through at eye level (W)' },
];

const TRADE_VIEWS: readonly TradeView[] = ['owner', 'architect', 'builder', 'electrician', 'plumber'];

function isTradeView(value: string): value is TradeView {
  return TRADE_VIEWS.some((v) => v === value);
}

export function TopBar(): JSX.Element {
  const ctl = useShell();
  const floor = floorMode.value;
  const view = viewMode.value;
  const trade = tradeView.value;

  return (
    <header class="shell-topbar" role="banner">
      <div class="shell-topbar-left">
        <button
          type="button"
          class={`shell-icon-btn${navigatorOpen.value ? ' is-active' : ''}`}
          title="Rooms"
          aria-label="Toggle room list"
          aria-pressed={navigatorOpen.value}
          onClick={() => {
            navigatorOpen.value = !navigatorOpen.value;
          }}
        >
          <Icon name="menu" />
        </button>
        <div class="shell-brand">
          <Icon name="house" size={18} />
          <span class="shell-brand-name">{PROPERTY_NAME}</span>
          {guestMode.value && <span class="shell-badge">Shared view</span>}
        </div>
      </div>

      <div class="shell-topbar-center">
        <div class="shell-seg" role="group" aria-label="Floor">
          {FLOORS.map((f) => (
            <button
              key={f.id}
              type="button"
              class={`shell-seg-btn${floor === f.id ? ' is-active' : ''}`}
              aria-pressed={floor === f.id}
              title={`${f.label} floor (${f.key})`}
              onClick={() => ctl.setFloor(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div class="shell-seg" role="group" aria-label="View mode">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              class={`shell-seg-btn${view === v.id ? ' is-active' : ''}`}
              aria-pressed={view === v.id}
              title={v.hint}
              onClick={() => ctl.setViewMode(v.id)}
            >
              <Icon name={v.icon} size={15} />
              <span class="shell-seg-label">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div class="shell-topbar-right">
        <label class="shell-viewas" title="Show the model as a particular trade sees it">
          <Icon name="eye" size={15} />
          <span class="shell-viewas-label">View as</span>
          <select
            class="shell-select"
            value={trade}
            aria-label="View as"
            onChange={(e) => {
              const next = e.currentTarget.value;
              if (isTradeView(next)) ctl.setTradeView(next);
            }}
          >
            {TRADE_VIEWS.map((v) => (
              <option key={v} value={v}>
                {TRADE_VIEW_LABELS[v]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          class="shell-btn shell-btn-primary"
          title="Copy a link to this exact view"
          onClick={() => {
            void ctl.share();
          }}
        >
          <Icon name="share" size={16} />
          <span class="shell-btn-label">Share</span>
        </button>
        {devMode.value && (
          <button
            type="button"
            class={`shell-icon-btn${devDrawerOpen.value ? ' is-active' : ''}`}
            title="Developer tools"
            aria-label="Developer tools"
            aria-pressed={devDrawerOpen.value}
            onClick={() => {
              devDrawerOpen.value = !devDrawerOpen.value;
            }}
          >
            <Icon name="code" />
          </button>
        )}
        <button
          type="button"
          class="shell-icon-btn"
          title="Help (?)"
          aria-label="Help"
          onClick={() => openHelp(0)}
        >
          <Icon name="help" />
        </button>
        <button
          type="button"
          class={`shell-icon-btn${settingsOpen.value ? ' is-active' : ''}`}
          title="Settings"
          aria-label="Settings"
          onClick={() => {
            settingsOpen.value = true;
          }}
        >
          <Icon name="gear" />
        </button>
        <button
          type="button"
          class={`shell-icon-btn${roomPanelOpen.value ? ' is-active' : ''}`}
          title="Room controls"
          aria-label="Toggle room controls"
          aria-pressed={roomPanelOpen.value}
          onClick={() => {
            roomPanelOpen.value = !roomPanelOpen.value;
          }}
        >
          <Icon name="panel" />
        </button>
      </div>
    </header>
  );
}
