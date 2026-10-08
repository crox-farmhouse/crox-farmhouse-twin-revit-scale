import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import {
  currentRoomId,
  deviceRevision,
  isMobile,
  liveLevels,
  roomPanelOpen,
  timeOfDay,
  tradeView,
} from '../../state/shell-store.ts';
import type { CircuitLevels } from '../../types/knx.ts';
import type { TimeOfDay } from '../../types/scene.ts';
import type { RoomLightControl, RoomManifestEntry, TradeView } from '../../types/twin-ux.ts';
import { TRADE_VIEW_LABELS } from '../../types/twin-ux.ts';
import { Icon, type IconName } from './icons.tsx';
import { NotesSection } from './NotesSection.tsx';
import { getRoomLabel, getRoomLevelScenes, getRoomManifest } from './room-data.ts';
import { useShell } from './shell-context.ts';

interface TradeSections {
  readonly lights: boolean;
  readonly scenes: boolean;
  readonly heating: boolean;
  readonly devices: boolean;
  readonly wholeHouseLights: boolean;
}

/** Which panel sections each trade view shows (same model, different emphasis). */
const TRADE_SECTIONS: Readonly<Record<TradeView, TradeSections>> = {
  owner: { lights: true, scenes: true, heating: true, devices: true, wholeHouseLights: true },
  architect: { lights: true, scenes: false, heating: true, devices: true, wholeHouseLights: true },
  builder: { lights: false, scenes: false, heating: true, devices: false, wholeHouseLights: false },
  electrician: { lights: true, scenes: true, heating: false, devices: true, wholeHouseLights: true },
  plumber: { lights: false, scenes: false, heating: true, devices: false, wholeHouseLights: false },
};

function levelOf(levels: Readonly<CircuitLevels> | null, circuitId: string): number {
  if (!levels) return 0;
  const v: unknown = Reflect.get(levels, circuitId);
  return typeof v === 'number' ? v : 0;
}

interface LightRowProps {
  readonly light: RoomLightControl;
  readonly level: number;
}

function LightRow({ light, level }: LightRowProps): JSX.Element {
  const ctl = useShell();
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = Math.round(dragValue ?? level);
  const on = shown > 0;
  return (
    <li class={`shell-light${on ? ' is-on' : ''}`}>
      <button
        type="button"
        class={`shell-switch${on ? ' is-on' : ''}`}
        role="switch"
        aria-checked={on}
        aria-label={`${light.label}: ${on ? 'on' : 'off'}`}
        onClick={() => ctl.toggleLight(light.circuitId)}
      >
        <span class="shell-switch-knob" />
      </button>
      <div class="shell-light-body">
        <div class="shell-light-label">
          <span>{light.label}</span>
          {light.dimmable && <span class="shell-light-pct">{shown}%</span>}
        </div>
        {light.dimmable && (
          <input
            class="shell-range"
            type="range"
            min={0}
            max={100}
            step={1}
            value={shown}
            aria-label={`${light.label} brightness`}
            style={{ '--fill': `${shown}%` }}
            onInput={(e) => {
              const v = Number(e.currentTarget.value);
              setDragValue(v);
              ctl.setLightLevel(light.circuitId, v);
            }}
            onChange={() => setDragValue(null)}
            onPointerUp={() => setDragValue(null)}
          />
        )}
      </div>
    </li>
  );
}

function RoomSections({ entry, sections }: { readonly entry: RoomManifestEntry; readonly sections: TradeSections }): JSX.Element {
  const ctl = useShell();
  const levels = liveLevels.value;
  // Re-render on device/UFH changes.
  void deviceRevision.value;

  const levelScenes = entry.scenes.length === 0 ? getRoomLevelScenes(entry.zoneId) : [];
  const ufh = ctl.deps.scene.getUfhSystem();
  const ufhZone = ufh?.getZoneForRoom(entry.zoneId);
  const anyOn = entry.lights.some((l) => levelOf(levels, l.circuitId) > 0.5);

  return (
    <>
      {sections.lights && entry.lights.length > 0 && (
        <section class="shell-card">
          <div class="shell-card-head">
            <span class="shell-card-title">
              <Icon name="bulb" size={15} /> Lights
            </span>
            <button
              type="button"
              class="shell-chip"
              disabled={!anyOn}
              onClick={() => {
                for (const l of entry.lights) ctl.setLightLevel(l.circuitId, 0);
              }}
            >
              Room off
            </button>
          </div>
          <ul class="shell-lights" role="list">
            {entry.lights.map((l) => (
              <LightRow key={l.circuitId} light={l} level={levelOf(levels, l.circuitId)} />
            ))}
          </ul>
        </section>
      )}

      {sections.scenes && (entry.scenes.length > 0 || levelScenes.length > 0) && (
        <section class="shell-card">
          <div class="shell-card-head">
            <span class="shell-card-title">
              <Icon name="sparkle" size={15} /> Scenes
            </span>
          </div>
          <div class="shell-chips">
            {entry.scenes.map((s) => (
              <button key={s.id} type="button" class="shell-chip shell-chip-lg" onClick={() => ctl.recallScene(s)}>
                {s.label}
              </button>
            ))}
            {levelScenes.map((s) => (
              <button
                key={s.id}
                type="button"
                class="shell-chip shell-chip-lg"
                onClick={() => ctl.applyLevels(s.levels, `${s.label.replace(/^S\d+\s*/, '')} scene`)}
              >
                {s.label.replace(/^S\d+\s*/, '')}
              </button>
            ))}
          </div>
        </section>
      )}

      {sections.heating && ufh && ufhZone && (
        <section class="shell-card">
          <div class="shell-card-head">
            <span class="shell-card-title">
              <Icon name="flame" size={15} /> Heating
            </span>
            <span class={`shell-temp${ufhZone.heatingOn ? ' is-on' : ''}`}>{ufhZone.targetTempC}°C</span>
          </div>
          <div class="shell-row">
            <div class="shell-row-text">
              <span>{ufhZone.shortName || ufhZone.name}</span>
              <span class="shell-muted">{ufhZone.manifoldLabel}</span>
            </div>
            <button
              type="button"
              class={`shell-switch${ufhZone.heatingOn ? ' is-on is-warm' : ''}`}
              role="switch"
              aria-checked={ufhZone.heatingOn}
              aria-label={`Underfloor heating ${ufhZone.heatingOn ? 'on' : 'off'}`}
              onClick={() => ctl.toggleUfhZoneForRoom(entry.zoneId)}
            >
              <span class="shell-switch-knob" />
            </button>
          </div>
        </section>
      )}

      {sections.devices && entry.devices.length > 0 && (
        <section class="shell-card">
          <div class="shell-card-head">
            <span class="shell-card-title">
              <Icon name="device" size={15} /> Devices
            </span>
          </div>
          <div class="shell-chips">
            {entry.devices.map((d) => (
              <button
                key={d.interactableId}
                type="button"
                class="shell-chip shell-chip-lg"
                onClick={() => ctl.activateDevice(d.interactableId, d.label)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

const TOD_OPTIONS: readonly { readonly id: TimeOfDay; readonly label: string; readonly icon: IconName }[] = [
  { id: 'day', label: 'Day', icon: 'sun' },
  { id: 'dusk', label: 'Dusk', icon: 'sunset' },
  { id: 'night', label: 'Night', icon: 'moon' },
];

function WholeHouse({ sections }: { readonly sections: TradeSections }): JSX.Element {
  const ctl = useShell();
  void deviceRevision.value;
  const gatesOpen = ctl.isGateOpenOrOpening();
  const tod = timeOfDay.value;
  return (
    <section class="shell-card shell-card-house">
      <div class="shell-card-head">
        <span class="shell-card-title">
          <Icon name="house" size={15} /> Whole house
        </span>
      </div>
      {sections.wholeHouseLights && (
        <div class="shell-house-actions">
          <button type="button" class="shell-action" onClick={() => ctl.allLightsOff()}>
            <Icon name="power" size={18} />
            <span>All off</span>
          </button>
          <button type="button" class="shell-action" onClick={() => ctl.eveningScene()}>
            <Icon name="sparkle" size={18} />
            <span>Evening</span>
          </button>
          <button
            type="button"
            class={`shell-action${gatesOpen ? ' is-active' : ''}`}
            onClick={() => ctl.toggleGates()}
          >
            <Icon name="gate" size={18} />
            <span>{gatesOpen ? 'Close gates' : 'Open gates'}</span>
          </button>
        </div>
      )}
      <div class="shell-row">
        <span class="shell-muted">Time of day</span>
        <div class="shell-seg shell-seg-sm" role="group" aria-label="Time of day">
          {TOD_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              class={`shell-seg-btn${tod === o.id ? ' is-active' : ''}`}
              aria-pressed={tod === o.id}
              title={o.label}
              onClick={() => ctl.setTimeOfDay(o.id)}
            >
              <Icon name={o.icon} size={14} />
              <span class="shell-seg-label">{o.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RoomPanel(): JSX.Element {
  const roomId = currentRoomId.value;
  const entry = roomId ? getRoomManifest(roomId) : undefined;
  const trade = tradeView.value;
  const sections = TRADE_SECTIONS[trade];
  const open = roomPanelOpen.value;

  return (
    <aside
      class={`shell-panel shell-glass${open ? ' is-open' : ''}${isMobile.value ? ' is-drawer' : ''}`}
      aria-label="Room controls"
      aria-hidden={!open}
    >
      <div class="shell-panel-head">
        <div class="shell-panel-heading">
          <span class="shell-panel-eyebrow">
            {entry ? (entry.floor === 'first' ? 'First floor' : 'Ground floor') : 'Property'}
            {trade !== 'owner' && ` · ${TRADE_VIEW_LABELS[trade]} view`}
          </span>
          <span class="shell-panel-title shell-panel-title-lg">{getRoomLabel(entry?.zoneId ?? roomId)}</span>
        </div>
        <button
          type="button"
          class="shell-icon-btn shell-icon-btn-sm"
          aria-label="Hide room controls"
          title="Hide room controls"
          onClick={() => {
            roomPanelOpen.value = false;
          }}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div class="shell-panel-scroll" key={entry?.zoneId ?? 'none'}>
        {entry ? (
          <RoomSections entry={entry} sections={sections} />
        ) : (
          <p class="shell-empty shell-empty-lg">
            Pick a room from the list, or double-click inside the model, to see its lights, heating and notes.
          </p>
        )}
        <NotesSection roomId={entry?.zoneId ?? null} />
        <WholeHouse sections={sections} />
      </div>
    </aside>
  );
}
