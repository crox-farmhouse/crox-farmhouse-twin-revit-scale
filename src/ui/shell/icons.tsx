import type { JSX } from 'preact';

/** Minimal inline SVG icon set (24×24 stroke icons, currentColor). */
export type IconName =
  | 'cube'
  | 'plan'
  | 'walk'
  | 'share'
  | 'gear'
  | 'help'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'close'
  | 'hand'
  | 'ruler'
  | 'pin'
  | 'section'
  | 'bulb'
  | 'power'
  | 'sun'
  | 'sunset'
  | 'moon'
  | 'gate'
  | 'flame'
  | 'download'
  | 'copy'
  | 'trash'
  | 'code'
  | 'menu'
  | 'panel'
  | 'target'
  | 'house'
  | 'sparkle'
  | 'device'
  | 'check'
  | 'eye'
  | 'move'
  | 'crouch'
  | 'jump'
  | 'volume'
  | 'volume-mute';

const PATHS: Readonly<Record<IconName, readonly string[]>> = {
  cube: ['M12 2 3 7v10l9 5 9-5V7z', 'M3 7l9 5 9-5', 'M12 12v10'],
  plan: ['M3 3h18v18H3z', 'M3 12h9', 'M12 3v18', 'M12 15h9'],
  walk: ['M13 4a1.5 1.5 0 1 0 0-.01', 'M9 21l2.5-6 2.5 2.5V21', 'M8 11l3-3 3 2 3 1', 'M11.5 15l-1-4'],
  share: ['M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7', 'M16 6l-4-4-4 4', 'M12 2v13'],
  gear: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  ],
  help: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  'chevron-down': ['M6 9l6 6 6-6'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  hand: [
    'M18 11V6a2 2 0 0 0-4 0v5',
    'M14 10V4a2 2 0 0 0-4 0v6',
    'M10 10.5V6a2 2 0 0 0-4 0v8',
    'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15',
  ],
  ruler: ['M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z', 'M7.5 10.5l2 2', 'M10.5 7.5l2 2', 'M13.5 4.5l2 2', 'M4.5 13.5l2 2'],
  pin: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  section: ['M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M20 4 8.1 15.9', 'M14.5 14.5 20 20', 'M8.1 8.1 12 12'],
  bulb: ['M9 18h6', 'M10 22h4', 'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z'],
  power: ['M18.4 6.6a9 9 0 1 1-12.8 0', 'M12 2v10'],
  sun: ['M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', 'M12 1v2', 'M12 21v2', 'M4.2 4.2l1.4 1.4', 'M18.4 18.4l1.4 1.4', 'M1 12h2', 'M21 12h2', 'M4.2 19.8l1.4-1.4', 'M18.4 5.6l1.4-1.4'],
  sunset: ['M17 18a5 5 0 0 0-10 0', 'M12 9V2', 'M4.2 10.2l1.4 1.4', 'M1 18h2', 'M21 18h2', 'M18.4 11.6l1.4-1.4', 'M23 22H1', 'M16 5l-4 4-4-4'],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z'],
  gate: ['M3 21V5', 'M21 21V5', 'M3 8h18', 'M3 16h18', 'M8 8v8', 'M13 8v8', 'M18 8v8'],
  flame: ['M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.3 1.6 1.4 2.8 2.5 2.8z'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  copy: ['M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  trash: ['M3 6h18', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6', 'M14 11v6', 'M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'],
  code: ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  panel: ['M3 3h18v18H3z', 'M15 3v18'],
  target: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  house: ['M3 10.5 12 3l9 7.5', 'M5 9v12h14V9', 'M10 21v-6h4v6'],
  sparkle: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', 'M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z'],
  device: ['M4 5h16v11H4z', 'M8 21h8', 'M12 16v5'],
  check: ['M20 6 9 17l-5-5'],
  eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  move: ['M5 9l-3 3 3 3', 'M9 5l3-3 3 3', 'M15 19l-3 3-3-3', 'M19 9l3 3-3 3', 'M2 12h20', 'M12 2v20'],
  jump: ['M12 19V5', 'M6 11l6-6 6 6', 'M5 21h14'],
  crouch: ['M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', 'M7 21l3-6 4 2v4', 'M10 11l4-2 3 3'],
  volume: [
    'M11 5L6 9H2v6h4l5 4V5z',
    'M15.54 8.46a5 5 0 0 1 0 7.07',
    'M19.07 4.93a10 10 0 0 1 0 14.14',
  ],
  'volume-mute': ['M11 5L6 9H2v6h4l5 4V5z', 'M22 9l-6 6', 'M16 9l6 6'],
};

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly className?: string;
}

export function Icon({ name, size = 18, className }: IconProps): JSX.Element {
  return (
    <svg
      className={`shell-icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
