import * as THREE from 'three';
import type {
  AnimatedInteractable,
  FirstPersonPoseSample,
} from '../../engine/interaction/handlers/animated-interactable.ts';

export const GYM_TREADMILL_RUN_ID = 'gym-treadmill-run';
export const TOTAL_RUN_DURATION_SEC = 8.0;

export const OUTBUILDING_ORIGIN_X = -22.47;
export const OUTBUILDING_ORIGIN_Z = 16.0;
export const OB_ROT = Math.atan2(2.49, 28.98);
export const OB_COS = Math.cos(OB_ROT);
export const OB_SIN = Math.sin(OB_ROT);

/**
 * Runner on the Technogym Run Personal belt faces `+obV` (South, toward the 21.5" console
 * and South backlit mirror), which maps to world direction `(OB_SIN, OB_COS)` and camera yaw
 * `Math.atan2(-OB_SIN, -OB_COS)` (`≈ -3.056 rad`).
 */
export const RUN_YAW_RAD = Math.atan2(-OB_SIN, -OB_COS);

const BELT_RUNNER_OB_U = 3.70;
const BELT_RUNNER_OB_V = 4.125;
const BELT_SURFACE_OFFSET_Y = 0.196;
const BELT_DECK_REST_Y = 0.152;
const DISMOUNT_OB_U = 3.70;
const DISMOUNT_OB_V = 3.12;
const RUNNER_EYE_HEIGHT = 1.60;
const ROLLER_RADIUS_M = 0.043;
const SCREEN_REFRESH_INTERVAL_SEC = 0.12;

export type GymTreadmillRunPhase = 'idle' | 'running';

export interface GymTreadmillRunConfig {
  readonly runGroup: THREE.Group;
  readonly beltDeck: THREE.Mesh;
  readonly frontRoller: THREE.Mesh;
  readonly rearRoller: THREE.Mesh;
  readonly beltTexture: THREE.Texture;
  readonly screenMesh: THREE.Mesh;
  readonly gymFloorY: number;
  readonly clickableTargets?: readonly THREE.Object3D[];
}

interface TreadmillKinematicsSample {
  readonly obU: number;
  readonly obV: number;
  readonly footY: number;
  readonly speedKmh: number;
  readonly bpm: number;
  readonly pitchRad: number;
  readonly rollRad: number;
  readonly strideBounceY: number;
  readonly fovBoostDeg: number;
  readonly stageLabel: string;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Converts outbuilding local `(obU, obV)` coordinates to world `[x, z]`. */
export function outbuildingToWorldXZ(obU: number, obV: number): readonly [number, number] {
  return [
    OUTBUILDING_ORIGIN_X + obU * OB_COS + obV * OB_SIN,
    OUTBUILDING_ORIGIN_Z - obU * OB_SIN + obV * OB_COS,
  ];
}

/** Converts world `(worldX, worldZ)` coordinates to outbuilding local `[obU, obV]`. */
export function worldToOutbuildingUV(worldX: number, worldZ: number): readonly [number, number] {
  const dx = worldX - OUTBUILDING_ORIGIN_X;
  const dz = worldZ - OUTBUILDING_ORIGIN_Z;
  return [dx * OB_COS - dz * OB_SIN, dx * OB_SIN + dz * OB_COS];
}

/** Formats speed in km/h into a running pace string (`M:SS /KM`). */
export function formatRunningPacePerKm(speedKmh: number): string {
  if (speedKmh <= 0.3) {
    return '--:-- /KM';
  }
  const totalSec = Math.round(3600 / speedKmh);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')} /KM`;
}

/**
 * First-person interactive workout controller for the Gym **Technogym Run Personal** treadmill.
 *
 * Drives an 8.0-second multi-stage interval run (Step-On & Console Tap -> Tempo Jog ->
 * High-Speed Sprint Interval -> Cooldown & Dismount) with synchronized 1st-person stride
 * kinematics, scrolling elastomer belt UVs, spinning crowned rollers, deck cushion compression,
 * and live 21.5" Technogym Live touchscreen telemetry.
 */
export class GymTreadmillRunController implements AnimatedInteractable {
  public readonly id = GYM_TREADMILL_RUN_ID;
  public readonly label = 'Technogym Run Personal Treadmill';
  public readonly aliases = [
    'treadmill',
    'run',
    'technogym',
    'jog',
    'sprint',
    'cardio',
  ] as const;
  public readonly clickableTargets: readonly THREE.Object3D[];

  readonly #runGroup: THREE.Group;
  readonly #beltDeck: THREE.Mesh;
  readonly #frontRoller: THREE.Mesh;
  readonly #rearRoller: THREE.Mesh;
  readonly #beltTexture: THREE.Texture;
  readonly #screenMesh: THREE.Mesh;
  readonly #gymFloorY: number;

  #phase: GymTreadmillRunPhase = 'idle';
  #elapsedSec = 0;
  #stridePhase = 0.45;
  #distanceMeters = 0;
  #screenRefreshAccumSec = 0;
  #liveCanvas: HTMLCanvasElement | null = null;

  public constructor(config: GymTreadmillRunConfig) {
    this.#runGroup = config.runGroup;
    this.#beltDeck = config.beltDeck;
    this.#frontRoller = config.frontRoller;
    this.#rearRoller = config.rearRoller;
    this.#beltTexture = config.beltTexture;
    this.#screenMesh = config.screenMesh;
    this.#gymFloorY = config.gymFloorY;
    this.clickableTargets = config.clickableTargets ?? [config.runGroup];
  }

  public getPhase(): GymTreadmillRunPhase {
    return this.#phase;
  }

  public getElapsedSec(): number {
    return this.#elapsedSec;
  }

  public getDistanceMeters(): number {
    return this.#distanceMeters;
  }

  public getCurrentSpeedKmh(): number {
    if (this.#phase !== 'running') return 0;
    return this.#evaluateKinematics(this.#elapsedSec).speedKmh;
  }

  public trigger(): boolean {
    if (this.#phase === 'idle') {
      this.#phase = 'running';
      this.#elapsedSec = 0;
      this.#stridePhase = 0.45;
      this.#distanceMeters = 0;
      this.#screenRefreshAccumSec = SCREEN_REFRESH_INTERVAL_SEC;
      this.#beltTexture.wrapS = THREE.RepeatWrapping;
      this.#beltTexture.wrapT = THREE.RepeatWrapping;
      this.#updateConsoleScreen(false);
      return true;
    }
    this.cancelFirstPerson();
    return true;
  }

  public describe(): string {
    return this.#phase === 'running' ? 'Stop Treadmill Run' : 'Run on Technogym Treadmill';
  }

  public isFirstPersonActive(): boolean {
    return this.#phase === 'running';
  }

  public cancelFirstPerson(): void {
    this.#phase = 'idle';
    this.#elapsedSec = 0;
    this.#stridePhase = 0.45;
    this.#screenRefreshAccumSec = 0;
    this.#beltDeck.position.y = BELT_DECK_REST_Y;
    this.#beltDeck.updateMatrixWorld(true);
    this.#updateConsoleScreen(true);
  }

  public isPlayerInProximityZone(footX: number, footY: number, footZ: number): boolean {
    const [obU, obV] = worldToOutbuildingUV(footX, footZ);
    return (
      Math.abs(footY - this.#gymFloorY) < 0.65 &&
      obU >= 3.05 &&
      obU <= 4.35 &&
      obV >= 3.05 &&
      obV <= 5.05
    );
  }

  public collectDynamicObjects(out: Set<THREE.Object3D>): void {
    out.add(this.#beltDeck);
    out.add(this.#frontRoller);
    out.add(this.#rearRoller);
    out.add(this.#screenMesh);
    this.#runGroup.traverse((c) => out.add(c));
  }

  public step(dtSeconds: number): boolean {
    if (this.#phase !== 'running' || !Number.isFinite(dtSeconds) || dtSeconds <= 0) {
      return false;
    }

    this.#elapsedSec += dtSeconds;
    const clampedT = Math.min(this.#elapsedSec, TOTAL_RUN_DURATION_SEC);
    const kin = this.#evaluateKinematics(clampedT);
    const beltSpeedMps = kin.speedKmh / 3.6;

    this.#distanceMeters += beltSpeedMps * dtSeconds;
    this.#stridePhase += (6.2 + beltSpeedMps * 2.35) * dtSeconds;

    // 1. Scroll the elastomer belt texture UV so tread ribs and pace stripes race backward
    this.#beltTexture.wrapS = THREE.RepeatWrapping;
    this.#beltTexture.wrapT = THREE.RepeatWrapping;
    this.#beltTexture.offset.y = (this.#beltTexture.offset.y + beltSpeedMps * dtSeconds * 1.8) % 1;

    // 2. Rotate front & rear crowned steel rollers proportionally to belt linear speed
    const rollerDeltaRad = (beltSpeedMps / ROLLER_RADIUS_M) * dtSeconds;
    this.#frontRoller.rotation.x += rollerDeltaRad;
    this.#rearRoller.rotation.x += rollerDeltaRad;
    this.#frontRoller.updateMatrixWorld(true);
    this.#rearRoller.updateMatrixWorld(true);

    // 3. Subtle elastomer deck cushion compression (`0.004m`) on each footstrike
    const cushionScale =
      clampedT < 6.4
        ? 1
        : 1 - easeInOutCubic(clamp01((clampedT - 6.4) / (TOTAL_RUN_DURATION_SEC - 6.4)));
    this.#beltDeck.position.y =
      BELT_DECK_REST_Y - Math.abs(Math.sin(this.#stridePhase)) * 0.004 * cushionScale;
    this.#beltDeck.updateMatrixWorld(true);

    // 4. Refresh the 21.5" Technogym Live touchscreen telemetry every ~0.12s
    this.#screenRefreshAccumSec += dtSeconds;
    if (this.#screenRefreshAccumSec >= SCREEN_REFRESH_INTERVAL_SEC) {
      this.#screenRefreshAccumSec = 0;
      this.#updateConsoleScreen(false);
    }

    if (this.#elapsedSec >= TOTAL_RUN_DURATION_SEC) {
      this.#phase = 'idle';
      this.#beltDeck.position.y = BELT_DECK_REST_Y;
      this.#beltDeck.updateMatrixWorld(true);
      this.#updateConsoleScreen(true);
    }

    return true;
  }

  public sampleFirstPersonPose(): FirstPersonPoseSample | null {
    if (this.#phase !== 'running') {
      return null;
    }
    const clampedT = Math.min(Math.max(0, this.#elapsedSec), TOTAL_RUN_DURATION_SEC);
    const kin = this.#evaluateKinematics(clampedT);
    const [worldX, worldZ] = outbuildingToWorldXZ(kin.obU, kin.obV);
    const footY = kin.footY;
    const eyeY = footY + RUNNER_EYE_HEIGHT + kin.strideBounceY;

    return {
      eyePosition: [worldX, eyeY, worldZ],
      footPosition: [worldX, footY, worldZ],
      yawRad: RUN_YAW_RAD,
      pitchRad: kin.pitchRad,
      rollRad: kin.rollRad,
      fovBoostDeg: kin.fovBoostDeg,
    };
  }

  #evaluateKinematics(t: number): TreadmillKinematicsSample {
    const beltSurfaceY = this.#gymFloorY + BELT_SURFACE_OFFSET_Y;
    const sinStride = Math.sin(this.#stridePhase);
    const absSinStride = Math.abs(sinStride);

    // Stage 1 (0.00s -> 0.85s): Step On & Console Tap (`0 -> 5.5 km/h` brisk walk)
    if (t < 0.85) {
      const u = clamp01(t / 0.85);
      const s = easeInOutCubic(u);
      const mountS = easeInOutCubic(clamp01(t / 0.35));
      const obU = BELT_RUNNER_OB_U;
      const obV = 3.85 + (BELT_RUNNER_OB_V - 3.85) * mountS;
      const footY = this.#gymFloorY + BELT_SURFACE_OFFSET_Y * mountS;
      const speedKmh = 5.5 * s;
      const bpm = 92 + (118 - 92) * s;
      const pitchRad = -0.24 + (-0.10 - -0.24) * s;
      const strideBounceY = absSinStride * 0.016 * s;
      const rollRad = sinStride * 0.008 * s;
      const fovBoostDeg = 0.8 * s;
      return {
        obU,
        obV,
        footY,
        speedKmh,
        bpm,
        pitchRad,
        rollRad,
        strideBounceY,
        fovBoostDeg,
        stageLabel: 'WARMUP WALK',
      };
    }

    // Stage 2 (0.85s -> 3.20s): Tempo Jog (`5.5 -> 11.5 km/h`, pace `5:13 /km`, HR `118 -> 142 BPM`)
    if (t < 3.20) {
      const u = clamp01((t - 0.85) / (3.20 - 0.85));
      const s = easeInOutCubic(u);
      const speedKmh = 5.5 + (11.5 - 5.5) * s;
      const bpm = 118 + (142 - 118) * s;
      const pitchRad = -0.10 + (-0.06 - -0.10) * s;
      const strideBounceY = absSinStride * 0.038;
      const rollRad = sinStride * 0.016;
      const fovBoostDeg = 2.2;
      return {
        obU: BELT_RUNNER_OB_U,
        obV: BELT_RUNNER_OB_V,
        footY: beltSurfaceY,
        speedKmh,
        bpm,
        pitchRad,
        rollRad,
        strideBounceY,
        fovBoostDeg,
        stageLabel: 'TEMPO JOG',
      };
    }

    // Stage 3 (3.20s -> 6.40s): High-Speed Sprint Interval (`16.8 km/h`, pace `3:34 /km`, HR `142 -> 172 BPM`)
    if (t < 6.40) {
      const u = clamp01((t - 3.20) / (6.40 - 3.20));
      const s = easeInOutCubic(u);
      const ramp = easeInOutCubic(clamp01((t - 3.20) / 0.50));
      const speedKmh = 11.5 + (16.8 - 11.5) * ramp;
      const bpm = 142 + (172 - 142) * s;
      const pitchRad = -0.06;
      const strideBounceY = absSinStride * 0.052;
      const rollRad = sinStride * 0.024;
      const fovBoostDeg = 5.8;
      return {
        obU: BELT_RUNNER_OB_U,
        obV: BELT_RUNNER_OB_V,
        footY: beltSurfaceY,
        speedKmh,
        bpm,
        pitchRad,
        rollRad,
        strideBounceY,
        fovBoostDeg,
        stageLabel: 'SPRINT INTERVAL',
      };
    }

    // Stage 4 (6.40s -> 8.00s): Cooldown & Dismount (`16.8 -> 0.0 km/h`, step off to gym floor)
    const u = clamp01((t - 6.40) / (TOTAL_RUN_DURATION_SEC - 6.40));
    const s = easeInOutCubic(u);
    const fade = 1 - s;
    const obU = DISMOUNT_OB_U;
    const obV = BELT_RUNNER_OB_V + (DISMOUNT_OB_V - BELT_RUNNER_OB_V) * s;
    const footY = this.#gymFloorY + BELT_SURFACE_OFFSET_Y * fade;
    const speedKmh = 16.8 * fade;
    const bpm = 172 - (172 - 122) * s;
    const pitchRad = -0.06 * fade;
    const strideBounceY = absSinStride * 0.052 * fade * fade;
    const rollRad = sinStride * 0.024 * fade;
    const fovBoostDeg = 5.8 * fade;
    return {
      obU,
      obV,
      footY,
      speedKmh,
      bpm,
      pitchRad,
      rollRad,
      strideBounceY,
      fovBoostDeg,
      stageLabel: 'COOLDOWN',
    };
  }

  #ensureScreenTexture(): {
    readonly texture: THREE.Texture;
    readonly emissiveTexture: THREE.Texture | null;
    readonly canvas: HTMLCanvasElement | null;
  } | null {
    const mat = this.#screenMesh.material;
    if (!mat || Array.isArray(mat)) {
      return null;
    }
    const stdMat = mat as THREE.MeshStandardMaterial;
    if (!stdMat.map) {
      if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 300;
        this.#liveCanvas = c;
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        stdMat.map = tex;
        stdMat.emissiveMap = tex;
      } else {
        const tex = new THREE.Texture();
        stdMat.map = tex;
        stdMat.emissiveMap = tex;
      }
    }
    const tex = stdMat.map;
    const img = tex.image as HTMLCanvasElement | undefined;
    if (img && typeof img.getContext === 'function') {
      this.#liveCanvas = img;
    } else if (
      !this.#liveCanvas &&
      typeof document !== 'undefined' &&
      typeof document.createElement === 'function'
    ) {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 300;
      this.#liveCanvas = c;
    }
    return {
      texture: tex,
      emissiveTexture: stdMat.emissiveMap ?? null,
      canvas: this.#liveCanvas,
    };
  }

  #updateConsoleScreen(standby: boolean): void {
    const target = this.#ensureScreenTexture();
    if (!target) {
      return;
    }
    const { texture, emissiveTexture, canvas } = target;
    if (canvas && typeof canvas.getContext === 'function') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const w = canvas.width || 512;
        const h = canvas.height || 300;
        const sx = w / 512;
        const sy = h / 300;

        ctx.fillStyle = '#14171c';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#1e232b';
        ctx.fillRect(16 * sx, 14 * sy, (512 - 32) * sx, (300 - 28) * sy);

        if (standby) {
          ctx.fillStyle = '#9aa3b0';
          ctx.font = `700 ${Math.round(13 * sy)}px Arial, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText('TECHNOGYM LIVE', 28 * sx, 34 * sy);

          ctx.fillStyle = '#22b55b';
          ctx.fillRect(196 * sx, 232 * sy, 120 * sx, 38 * sy);
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 ${Math.round(15 * sy)}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('START', 256 * sx, 255 * sy);
        } else {
          const kin = this.#evaluateKinematics(
            Math.min(Math.max(0, this.#elapsedSec), TOTAL_RUN_DURATION_SEC)
          );
          const paceStr = formatRunningPacePerKm(kin.speedKmh);

          // Top status header
          ctx.fillStyle = '#f5c400';
          ctx.font = `800 ${Math.round(12 * sy)}px Arial, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(`TECHNOGYM LIVE  •  ${kin.stageLabel}`, 28 * sx, 34 * sy);

          // 4 Live Telemetry Cards: SPEED (KM/H), PACE (/KM), BPM, DISTANCE (M)
          const cards = [
            {
              label: 'SPEED (KM/H)',
              value: kin.speedKmh.toFixed(1),
              accent: '#4fc3f7',
            },
            {
              label: 'PACE (/KM)',
              value: paceStr,
              accent: '#ffb74d',
            },
            {
              label: 'BPM',
              value: `${Math.round(kin.bpm)}`,
              accent: '#ef5350',
            },
            {
              label: 'DISTANCE (M)',
              value: `${Math.round(this.#distanceMeters)}`,
              accent: '#66bb6a',
            },
          ] as const;

          const cardW = 108 * sx;
          const cardH = 88 * sy;
          const cardGap = 10 * sx;
          const startX = 25 * sx;
          const cardY = 48 * sy;

          for (let i = 0; i < cards.length; i++) {
            const c = cards[i]!;
            const cx = startX + i * (cardW + cardGap);
            ctx.fillStyle = '#272d37';
            ctx.fillRect(cx, cardY, cardW, cardH);
            ctx.fillStyle = c.accent;
            ctx.fillRect(cx, cardY, cardW, 4 * sy);

            ctx.fillStyle = '#9aa3b0';
            ctx.font = `700 ${Math.round(10 * sy)}px Arial, sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(c.label, cx + 8 * sx, cardY + 22 * sy);

            ctx.fillStyle = '#f4f7fb';
            ctx.font = `900 ${Math.round(20 * sy)}px Arial, sans-serif`;
            ctx.fillText(c.value, cx + 8 * sx, cardY + 58 * sy);
          }

          // Active Interval Profile Bars across the bottom
          const barCount = 16;
          const profileHeights = [
            0.28, 0.35, 0.48, 0.62, 0.68, 0.72, 0.75, 0.92,
            1.0, 1.0, 0.98, 0.95, 0.88, 0.62, 0.4, 0.25,
          ] as const;
          const activeIdx = Math.min(
            barCount - 1,
            Math.floor(clamp01(this.#elapsedSec / TOTAL_RUN_DURATION_SEC) * barCount)
          );
          const barsX = 28 * sx;
          const barsBottomY = 262 * sy;
          const maxBarH = 96 * sy;
          const barW = 24 * sx;
          const barGap = 4.5 * sx;

          for (let i = 0; i < barCount; i++) {
            const bh = (profileHeights[i] ?? 0.5) * maxBarH;
            const bx = barsX + i * (barW + barGap);
            ctx.fillStyle =
              i === activeIdx ? '#f5c400' : i < activeIdx ? '#29b6f6' : '#343b46';
            ctx.fillRect(bx, barsBottomY - bh, barW, bh);
          }
        }
      }
    }

    texture.needsUpdate = true;
    if (emissiveTexture && emissiveTexture !== texture) {
      emissiveTexture.needsUpdate = true;
    }
  }
}
