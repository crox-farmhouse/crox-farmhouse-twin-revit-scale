import * as THREE from 'three';
import { soundEngine } from '../../engine/audio/sound-engine.ts';
import type {
  AnimatedInteractable,
  FirstPersonPoseSample,
} from '../../engine/interaction/handlers/animated-interactable.ts';

export type SeatUpholsteryMaterial = 'velvet' | 'linen' | 'leather' | 'timber' | 'beanbag';

export interface SeatPoseConfig {
  readonly id: string;
  readonly label: string;
  readonly aliases: readonly string[];
  readonly anchor: THREE.Object3D;
  readonly clickableTargets: readonly THREE.Object3D[];
  /** Seat cushion top center in `anchor` local coordinates `[x, y, z]`. */
  readonly localSeatPos: readonly [number, number, number];
  /** Dismount standing foot position in `anchor` local coordinates `[x, y, z]`. */
  readonly localFootOffset: readonly [number, number, number];
  /** Natural forward look direction in `anchor` local coordinates `[dx, dy, dz]`. */
  readonly localForward: readonly [number, number, number];
  /** Seated eye height above `localSeatPos[1]` in metres (default `0.72`). */
  readonly seatedEyeHeightM?: number;
  /** Initial seated pitch in radians (default `-0.04`). */
  readonly pitchRad?: number;
  /** Horizontal proximity trigger radius in metres (default `0.95`). */
  readonly proximityRadiusM?: number;
  readonly material: SeatUpholsteryMaterial;
}

const EXCLUDED_MICRO_MESH_NAME_RE =
  /piping|flange|welt|seam|pleat|kickPanel|ropeCord|caster|starLeg|ferrule|sabot|stud|button|zipper/i;

/**
 * Collects raycastable cushion, backrest, armrest, and frame meshes under `root`,
 * skipping ultra-fine piping/welt/cord detail meshes so raycasting stays fast.
 */
export function collectSeatClickableMeshes(
  root: THREE.Object3D,
  predicate?: (mesh: THREE.Mesh) => boolean
): THREE.Object3D[] {
  const meshes: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (EXCLUDED_MICRO_MESH_NAME_RE.test(obj.name)) return;
    if (predicate && !predicate(obj)) return;
    meshes.push(obj);
  });
  return meshes.length > 0 ? meshes : [root];
}

/**
 * Synthesizes a subtle, material-accurate sit-down or stand-up sound at `worldPos`
 * using the Web Audio API. Fully encapsulated inside `seating-interactions.ts`.
 */
function playSeatAudio(
  material: SeatUpholsteryMaterial,
  mode: 'sit' | 'stand',
  worldPos: THREE.Vector3
): void {
  try {
    soundEngine.playSpatial(worldPos, (tk) => {
      const { now } = tk;
      const isSit = mode === 'sit';

      // 1. Low-frequency cushion / frame compression thump
      const startFreq =
        material === 'timber'
          ? isSit
            ? 142
            : 118
          : material === 'leather'
            ? isSit
              ? 156
              : 128
            : material === 'beanbag'
              ? isSit
                ? 86
                : 98
              : isSit
                ? 98
                : 112;
      const endFreq =
        material === 'timber'
          ? 68
          : material === 'leather'
            ? 84
            : material === 'beanbag'
              ? 38
              : 44;
      const bodyDuration = isSit ? 0.22 : 0.15;

      tk.tone({
        startTime: now,
        duration: bodyDuration,
        type: material === 'leather' ? 'triangle' : 'sine',
        freqStart: startFreq,
        freqEnd: endFreq,
        gainPeak: isSit ? 0.055 : 0.032,
        attackSec: 0.022,
      });

      // 2. Filtered fabric / air-sigh / microbead / leather texture layer
      const noiseDuration =
        material === 'beanbag' ? (isSit ? 0.34 : 0.24) : isSit ? 0.25 : 0.17;
      const centerFreq =
        material === 'velvet'
          ? 440
          : material === 'linen'
            ? 660
            : material === 'leather'
              ? 380
              : material === 'beanbag'
                ? 880
                : 760;
      const peakNoiseGain =
        material === 'timber'
          ? 0.016
          : material === 'beanbag'
            ? 0.042
            : 0.028;

      tk.noiseBurst({
        startTime: now + 0.01,
        duration: noiseDuration,
        filterType: 'bandpass',
        freqStart: centerFreq,
        freqEnd: isSit ? centerFreq * 0.62 : centerFreq * 1.18,
        q: material === 'beanbag' ? 2.4 : 1.6,
        gainPeak: isSit ? peakNoiseGain : peakNoiseGain * 0.65,
        attackSec: 0.03,
      });
    });
  } catch {
    // Ignore Web Audio errors in headless test environments
  }
}

/**
 * Self-contained 1st-person seating interactable for a sofa, armchair, dining chair,
 * counter stool, bar stool, bench, beanbag, or pouffe.
 *
 * Clicking the seat in Orbit View or 1st-Person View (or pressing `F` while looking at
 * or standing near it in 1PV) smoothly transitions the camera onto the seat cushion facing
 * its natural viewing direction with full 360° free look (`allowFreeLook: true`).
 * Pressing `W`/`A`/`S`/`D`, Arrow keys, `Space`, or `F` (or clicking the seat again)
 * smoothly stands the player up to the clear floor spot in front of the seat.
 */
export class SeatInteractable implements AnimatedInteractable {
  public readonly id: string;
  public readonly label: string;
  public readonly aliases: readonly string[];
  public readonly clickableTargets: readonly THREE.Object3D[];

  private readonly anchor: THREE.Object3D;
  private readonly localSeatPos: THREE.Vector3;
  private readonly localFootOffset: THREE.Vector3;
  private readonly localForward: THREE.Vector3;
  private readonly seatedEyeHeightM: number;
  private readonly pitchRad: number;
  private readonly proximityRadiusM: number;
  private readonly material: SeatUpholsteryMaterial;

  private seated = false;
  private elapsedSec = 0;

  private readonly tmpSeatWorld = new THREE.Vector3();
  private readonly tmpFootWorld = new THREE.Vector3();
  private readonly tmpFwdWorld = new THREE.Vector3();
  private readonly tmpNormalMatrix = new THREE.Matrix3();

  public constructor(config: SeatPoseConfig) {
    this.id = config.id;
    this.label = config.label;
    this.aliases = config.aliases;
    this.anchor = config.anchor;
    this.clickableTargets = config.clickableTargets;
    this.localSeatPos = new THREE.Vector3(
      config.localSeatPos[0],
      config.localSeatPos[1],
      config.localSeatPos[2]
    );
    this.localFootOffset = new THREE.Vector3(
      config.localFootOffset[0],
      config.localFootOffset[1],
      config.localFootOffset[2]
    );
    this.localForward = new THREE.Vector3(
      config.localForward[0],
      config.localForward[1],
      config.localForward[2]
    ).normalize();
    this.seatedEyeHeightM = config.seatedEyeHeightM ?? 0.72;
    this.pitchRad = config.pitchRad ?? -0.04;
    this.proximityRadiusM = config.proximityRadiusM ?? 0.95;
    this.material = config.material;
  }

  private updateWorldVectors(): {
    readonly seatWorld: THREE.Vector3;
    readonly footWorld: THREE.Vector3;
    readonly yawRad: number;
  } {
    this.anchor.updateMatrixWorld(true);
    const mw = this.anchor.matrixWorld;
    this.tmpSeatWorld.copy(this.localSeatPos).applyMatrix4(mw);
    this.tmpFootWorld.copy(this.localFootOffset).applyMatrix4(mw);
    this.tmpNormalMatrix.getNormalMatrix(mw);
    this.tmpFwdWorld.copy(this.localForward).applyMatrix3(this.tmpNormalMatrix).normalize();
    const yawRad = Math.atan2(-this.tmpFwdWorld.x, -this.tmpFwdWorld.z);
    return {
      seatWorld: this.tmpSeatWorld,
      footWorld: this.tmpFootWorld,
      yawRad,
    };
  }

  public trigger(): boolean {
    this.seated = !this.seated;
    this.elapsedSec = 0;
    const { seatWorld } = this.updateWorldVectors();
    playSeatAudio(this.material, this.seated ? 'sit' : 'stand', seatWorld);
    return true;
  }

  public describe(): string {
    return this.seated ? `Stand Up from ${this.label}` : `Sit on ${this.label}`;
  }

  public step(dtSeconds: number): boolean {
    if (this.seated) {
      this.elapsedSec += dtSeconds;
    }
    return false;
  }

  public collectDynamicObjects(_out: Set<THREE.Object3D>): void {
    // Seat geometry does not move when sat on, keeping all sofa/chair meshes static-batchable.
  }

  public isFirstPersonActive(): boolean {
    return this.seated;
  }

  public sampleFirstPersonPose(): FirstPersonPoseSample | null {
    if (!this.seated) return null;
    const { seatWorld, footWorld, yawRad } = this.updateWorldVectors();
    const breathBobY = Math.sin(this.elapsedSec * 1.65) * 0.0035;
    return {
      poseId: this.id,
      eyePosition: [
        seatWorld.x,
        seatWorld.y + this.seatedEyeHeightM + breathBobY,
        seatWorld.z,
      ],
      footPosition: [footWorld.x, footWorld.y, footWorld.z],
      yawRad,
      pitchRad: this.pitchRad,
      allowFreeLook: true,
      activePrompt: `Stand Up from ${this.label}`,
    };
  }

  public cancelFirstPerson(): void {
    if (!this.seated) return;
    this.seated = false;
    this.elapsedSec = 0;
    const { seatWorld } = this.updateWorldVectors();
    playSeatAudio(this.material, 'stand', seatWorld);
  }

  public isPlayerInProximityZone(footX: number, footY: number, footZ: number): boolean {
    const { seatWorld, footWorld } = this.updateWorldVectors();
    if (this.seated) {
      const distFoot = Math.hypot(footX - footWorld.x, footZ - footWorld.z);
      const distSeat = Math.hypot(footX - seatWorld.x, footZ - seatWorld.z);
      return (
        Math.min(distFoot, distSeat) <= 1.85 &&
        Math.abs(footY - footWorld.y) <= 1.1
      );
    }
    const distToSeat = Math.hypot(footX - seatWorld.x, footZ - seatWorld.z);
    const distToDismount = Math.hypot(footX - footWorld.x, footZ - footWorld.z);
    return (
      (distToSeat <= this.proximityRadiusM || distToDismount <= this.proximityRadiusM * 0.78) &&
      Math.abs(footY - footWorld.y) <= 0.65
    );
  }
}

/**
 * Discovers all sofas, armchairs, dining chairs, kitchen island stools, golf bar stools,
 * benches, beanbags, and pouffes across the Crox Farmhouse scene hierarchy and registers
 * each one as a 1st-person `SeatInteractable`.
 */
export function registerPropertySeatingInteractions(
  roots: readonly THREE.Object3D[],
  interactions: {
    registerAnimatedInteractable(device: AnimatedInteractable): string;
  }
): readonly SeatInteractable[] {
  const byName = new Map<string, THREE.Object3D>();
  const pergolaSeatMeshes: THREE.Mesh[] = [];

  for (const root of roots) {
    root.traverse((obj) => {
      if (obj.name && !byName.has(obj.name)) {
        byName.set(obj.name, obj);
      }
      if (obj instanceof THREE.Mesh && obj.name === 'courtyard.grapeVinePergola.seat') {
        pergolaSeatMeshes.push(obj);
      }
    });
  }

  const registered: SeatInteractable[] = [];
  const addSeat = (config: SeatPoseConfig): void => {
    if (config.clickableTargets.length === 0) return;
    const seat = new SeatInteractable(config);
    interactions.registerAnimatedInteractable(seat);
    registered.push(seat);
  };

  // 1. Sitting Room — Twin Barker & Stonehouse 2-Seater Linen Sofas
  const eastSofa = byName.get('sittingRoom.barkerAndStonehouseSofa.east');
  if (eastSofa) {
    addSeat({
      id: 'seat:sittingRoom.barkerAndStonehouseSofa.east',
      label: 'East Linen Sofa',
      aliases: ['sit on east sofa', 'sitting room east sofa', 'barker and stonehouse east sofa'],
      anchor: eastSofa,
      clickableTargets: collectSeatClickableMeshes(eastSofa),
      localSeatPos: [-0.06, 0.44, 0],
      localFootOffset: [-0.82, 0, 0],
      localForward: [-1, 0, 0],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 1.15,
      material: 'linen',
    });
  }

  const westSofa = byName.get('sittingRoom.barkerAndStonehouseSofa.west');
  if (westSofa) {
    addSeat({
      id: 'seat:sittingRoom.barkerAndStonehouseSofa.west',
      label: 'West Linen Sofa',
      aliases: ['sit on west sofa', 'sitting room west sofa', 'barker and stonehouse west sofa'],
      anchor: westSofa,
      clickableTargets: collectSeatClickableMeshes(westSofa),
      localSeatPos: [0.06, 0.44, 0],
      localFootOffset: [0.82, 0, 0],
      localForward: [1, 0, 0],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 1.15,
      material: 'linen',
    });
  }

  // 2. Living Room — Loaf Chaise Sectional Cinema Sofa (Chaise Lounger + Main Sofa)
  const chaiseSofa = byName.get('livingRoom.chaiseSofa');
  if (chaiseSofa) {
    const isChaisePart = (mesh: THREE.Mesh): boolean =>
      /chaise|westArm|backPillow\.1|scatters\.1|leg\.1|leg\.2|leg\.5|leg\.6/i.test(mesh.name);
    const chaiseTargets = collectSeatClickableMeshes(chaiseSofa, isChaisePart);
    const mainTargets = collectSeatClickableMeshes(chaiseSofa, (m) => !isChaisePart(m));

    addSeat({
      id: 'seat:livingRoom.chaiseSofa.chaise',
      label: 'Loaf Chaise Lounger',
      aliases: ['sit on chaise', 'chaise longue', 'living room chaise'],
      anchor: chaiseSofa,
      clickableTargets: chaiseTargets,
      localSeatPos: [-0.83, 0.45, -0.22],
      localFootOffset: [-0.83, 0, -1.18],
      localForward: [0, 0, -1],
      seatedEyeHeightM: 0.7,
      proximityRadiusM: 1.15,
      material: 'velvet',
    });

    addSeat({
      id: 'seat:livingRoom.chaiseSofa.main',
      label: 'Loaf Cinema Sofa',
      aliases: ['sit on living room sofa', 'cinema sofa', 'loaf sofa'],
      anchor: chaiseSofa,
      clickableTargets: mainTargets,
      localSeatPos: [0.42, 0.45, -0.05],
      localFootOffset: [0.42, 0, -0.92],
      localForward: [0, 0, -1],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 1.2,
      material: 'velvet',
    });
  }

  // 3. Vaulted Sitting Area — Twin Linen Armchairs
  const sittingArmchairLeft = byName.get('sitting.armchairLeft');
  if (sittingArmchairLeft) {
    addSeat({
      id: 'seat:sitting.armchairLeft',
      label: 'Left Linen Armchair',
      aliases: ['sit on left armchair', 'sitting area left armchair'],
      anchor: sittingArmchairLeft,
      clickableTargets: collectSeatClickableMeshes(sittingArmchairLeft),
      localSeatPos: [0, 0.46, 0.02],
      localFootOffset: [0, 0, 0.72],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 0.95,
      material: 'linen',
    });
  }

  const sittingArmchairRight = byName.get('sitting.armchairRight');
  if (sittingArmchairRight) {
    addSeat({
      id: 'seat:sitting.armchairRight',
      label: 'Right Linen Armchair',
      aliases: ['sit on right armchair', 'sitting area right armchair'],
      anchor: sittingArmchairRight,
      clickableTargets: collectSeatClickableMeshes(sittingArmchairRight),
      localSeatPos: [0, 0.46, 0.02],
      localFootOffset: [0, 0, 0.72],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 0.95,
      material: 'linen',
    });
  }

  // 4. Kitchen — 3 Backless Oak & Brass Counter Stools at the Hague Blue Island
  for (let i = 1; i <= 3; i++) {
    const stool = byName.get(`kitchen.island.counterStool_${i}`);
    if (!stool) continue;
    addSeat({
      id: `seat:kitchen.island.counterStool.${i}`,
      label: `Kitchen Island Stool ${i}`,
      aliases: [`sit on island stool ${i}`, `kitchen bar stool ${i}`],
      anchor: stool,
      clickableTargets: collectSeatClickableMeshes(stool),
      localSeatPos: [0, 0.68, 0],
      localFootOffset: [0, 0, 0.58],
      localForward: [0, 0, -1],
      seatedEyeHeightM: 0.7,
      proximityRadiusM: 0.85,
      material: 'timber',
    });
  }

  // 5. Dining Room — 10 Neptune Wycombe Upholstered Dining Chairs
  for (let i = 1; i <= 10; i++) {
    const chair = byName.get(`familyRoom.neptuneWycombeDiningTable.chair.${i}`);
    if (!chair) continue;
    addSeat({
      id: `seat:familyRoom.diningChair.${i}`,
      label: `Dining Chair ${i}`,
      aliases: [`sit on dining chair ${i}`, `neptune wycombe chair ${i}`],
      anchor: chair,
      clickableTargets: collectSeatClickableMeshes(chair),
      localSeatPos: [0, 0.47, 0],
      localFootOffset: [0, 0, -0.56],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 0.85,
      material: 'timber',
    });
  }

  // 6. Dining Room Walk-in Cupboard — Oak Boot Bench
  const bootBenchSeat = byName.get('familyRoom.walkInCupboard.benchSeat');
  if (bootBenchSeat) {
    const shoeShelf = byName.get('familyRoom.walkInCupboard.shoeShelf');
    const targets: THREE.Object3D[] = [bootBenchSeat];
    if (shoeShelf) targets.push(shoeShelf);
    addSeat({
      id: 'seat:familyRoom.walkInCupboard.bootBench',
      label: 'Walk-in Cupboard Boot Bench',
      aliases: ['sit on boot bench', 'cupboard bench'],
      anchor: bootBenchSeat,
      clickableTargets: targets,
      localSeatPos: [0, 0.02, 0],
      localFootOffset: [0.55, -0.48, 0],
      localForward: [1, 0, 0],
      seatedEyeHeightM: 0.7,
      proximityRadiusM: 0.85,
      material: 'timber',
    });
  }

  // 7. Study — Leather Executive Task Chair at South Dual-Monitor Desk
  const studyChair = byName.get('study.southWallDesk.chair');
  if (studyChair) {
    addSeat({
      id: 'seat:study.southWallDesk.chair',
      label: 'Study Leather Desk Chair',
      aliases: ['sit at study desk', 'sit on desk chair', 'study chair', 'office chair'],
      anchor: studyChair,
      clickableTargets: collectSeatClickableMeshes(studyChair),
      localSeatPos: [0, 0.49, 0.02],
      localFootOffset: [-0.56, 0, -0.35],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 0.95,
      material: 'leather',
    });
  }

  // 8. Outbuildings Barn — 3 Tan Saddle-Leather Golf Viewing Bar Stools
  for (let i = 1; i <= 3; i++) {
    const barStool = byName.get(`outbuildings.barn.golfViewingBar.stool.${i}`);
    if (!barStool) continue;
    addSeat({
      id: `seat:outbuildings.barn.barStool.${i}`,
      label: `Golf Bar Stool ${i}`,
      aliases: [`sit on bar stool ${i}`, `golf bar stool ${i}`],
      anchor: barStool,
      clickableTargets: collectSeatClickableMeshes(barStool),
      localSeatPos: [0, 0.76, 0],
      localFootOffset: [-0.55, 0, 0],
      localForward: [1, 0, 0],
      seatedEyeHeightM: 0.68,
      proximityRadiusM: 0.85,
      material: 'leather',
    });
  }

  // 9. Outbuildings Mezzanine — 3 Lounge Beanbags & Chunky Knitted Pouffe
  const beanbagTerracotta = byName.get('outbuildings.mezzanine.beanbag.navyFront');
  if (beanbagTerracotta) {
    addSeat({
      id: 'seat:outbuildings.mezzanine.beanbag.terracotta',
      label: 'Terracotta Corduroy Beanbag',
      aliases: ['sit on terracotta beanbag', 'mezzanine beanbag'],
      anchor: beanbagTerracotta,
      clickableTargets: collectSeatClickableMeshes(beanbagTerracotta),
      localSeatPos: [0, 0.34, 0.04],
      localFootOffset: [0, 0, 0.65],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.62,
      proximityRadiusM: 0.95,
      material: 'beanbag',
    });
  }

  const beanbagTapestry = byName.get('outbuildings.mezzanine.beanbag.tapestry');
  if (beanbagTapestry) {
    addSeat({
      id: 'seat:outbuildings.mezzanine.beanbag.tapestry',
      label: 'Bohemian Tapestry Beanbag',
      aliases: ['sit on tapestry beanbag'],
      anchor: beanbagTapestry,
      clickableTargets: collectSeatClickableMeshes(beanbagTapestry),
      localSeatPos: [0, 0.32, 0.04],
      localFootOffset: [0, 0, 0.65],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.62,
      proximityRadiusM: 0.95,
      material: 'beanbag',
    });
  }

  const beanbagSheepskin = byName.get('outbuildings.mezzanine.beanbag.navyBack');
  if (beanbagSheepskin) {
    addSeat({
      id: 'seat:outbuildings.mezzanine.beanbag.sheepskin',
      label: 'Cream Sheepskin Beanbag',
      aliases: ['sit on sheepskin beanbag'],
      anchor: beanbagSheepskin,
      clickableTargets: collectSeatClickableMeshes(beanbagSheepskin),
      localSeatPos: [0, 0.34, 0.04],
      localFootOffset: [0, 0, 0.65],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.62,
      proximityRadiusM: 0.95,
      material: 'beanbag',
    });
  }

  const mezzaninePouffe = byName.get('outbuildings.mezzanine.pouffe');
  if (mezzaninePouffe) {
    addSeat({
      id: 'seat:outbuildings.mezzanine.pouffe',
      label: 'Chunky Knitted Pouffe',
      aliases: ['sit on pouffe', 'mezzanine pouffe'],
      anchor: mezzaninePouffe,
      clickableTargets: collectSeatClickableMeshes(mezzaninePouffe),
      localSeatPos: [0, 0.18, 0],
      localFootOffset: [0, -0.18, -0.58],
      localForward: [0, 0, -1],
      seatedEyeHeightM: 0.64,
      proximityRadiusM: 0.85,
      material: 'beanbag',
    });
  }

  // 10. Outbuildings Gym — Slatted Oak Hydration & Towel Bench
  const gymHydrationBench = byName.get('outbuildings.gym.hydrationBench');
  if (gymHydrationBench) {
    addSeat({
      id: 'seat:outbuildings.gym.hydrationBench',
      label: 'Gym Oak Slatted Bench',
      aliases: ['sit on gym bench', 'hydration bench'],
      anchor: gymHydrationBench,
      clickableTargets: collectSeatClickableMeshes(gymHydrationBench),
      localSeatPos: [0, 0.48, 0.12],
      localFootOffset: [0.62, 0.1, 0.12],
      localForward: [1, 0, 0],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 0.95,
      material: 'timber',
    });
  }

  // 11. Outbuildings 1st Floor Stable Bedroom — Dressing Stool, End-of-Bed Bench & Balcony Armchairs
  const dressingStool = byName.get('outbuildings.firstFloor.stableBedroom.dressingStool');
  if (dressingStool) {
    addSeat({
      id: 'seat:outbuildings.stableBedroom.dressingStool',
      label: 'Bouclé Dressing Table Stool',
      aliases: ['sit at dressing table', 'dressing stool'],
      anchor: dressingStool,
      clickableTargets: collectSeatClickableMeshes(dressingStool),
      localSeatPos: [0, 0.46, 0],
      localFootOffset: [0, 0, 0.52],
      localForward: [0, 0, -1],
      seatedEyeHeightM: 0.7,
      proximityRadiusM: 0.85,
      material: 'velvet',
    });
  }

  const endBench = byName.get('outbuildings.firstFloor.stableBedroom.endBench');
  if (endBench) {
    addSeat({
      id: 'seat:outbuildings.stableBedroom.endBench',
      label: 'Upholstered Bedroom Bench',
      aliases: ['sit on bedroom bench', 'end of bed bench'],
      anchor: endBench,
      clickableTargets: collectSeatClickableMeshes(endBench),
      localSeatPos: [0, 0.08, 0],
      localFootOffset: [0.56, -0.32, 0],
      localForward: [1, 0, 0],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 0.95,
      material: 'velvet',
    });
  }

  for (let i = 1; i <= 2; i++) {
    const balconyChair = byName.get(`outbuildings.firstFloor.stableEastBalcony.armchair.${i}`);
    if (!balconyChair) continue;
    addSeat({
      id: `seat:outbuildings.stableEastBalcony.armchair.${i}`,
      label: `Balcony Woven Lounge Chair ${i}`,
      aliases: [`sit on balcony chair ${i}`, `terrace armchair ${i}`],
      anchor: balconyChair,
      clickableTargets: collectSeatClickableMeshes(balconyChair),
      localSeatPos: [0, 0.36, -0.02],
      localFootOffset: [0, 0, -0.58],
      localForward: [0, 0, -1],
      seatedEyeHeightM: 0.7,
      proximityRadiusM: 0.9,
      material: 'linen',
    });
  }

  // 12. Courtyard & Pergola — Garden Bench, Rattan Patio Bench & 6 Teak Pergola Dining Chairs
  const courtyardGardenBench = byName.get('courtyard.gardenBench');
  if (courtyardGardenBench) {
    addSeat({
      id: 'seat:courtyard.gardenBench',
      label: 'Courtyard Teak Garden Bench',
      aliases: ['sit on garden bench', 'courtyard bench'],
      anchor: courtyardGardenBench,
      clickableTargets: collectSeatClickableMeshes(courtyardGardenBench),
      localSeatPos: [0, 0.435, 0.02],
      localFootOffset: [0, 0, 0.62],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 1.05,
      material: 'timber',
    });
  }

  const rattanPatioBench = byName.get('courtyard.rattanPatioWestBench');
  if (rattanPatioBench) {
    addSeat({
      id: 'seat:courtyard.rattanPatioWestBench',
      label: 'Patio Slatted Bench',
      aliases: ['sit on patio bench', 'terrace bench'],
      anchor: rattanPatioBench,
      clickableTargets: collectSeatClickableMeshes(rattanPatioBench),
      localSeatPos: [0, 0.435, 0.02],
      localFootOffset: [0, 0, 0.62],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 1.05,
      material: 'timber',
    });
  }

  for (let i = 0; i < pergolaSeatMeshes.length; i++) {
    const seatMesh = pergolaSeatMeshes[i]!;
    const chairGroup = seatMesh.parent;
    if (!chairGroup) continue;
    const chairNum = i + 1;
    addSeat({
      id: `seat:courtyard.grapeVinePergola.chair.${chairNum}`,
      label: `Pergola Teak Chair ${chairNum}`,
      aliases: [`sit on pergola chair ${chairNum}`, `outdoor dining chair ${chairNum}`],
      anchor: chairGroup,
      clickableTargets: collectSeatClickableMeshes(chairGroup),
      localSeatPos: [0, 0.46, 0],
      localFootOffset: [0, 0, -0.56],
      localForward: [0, 0, 1],
      seatedEyeHeightM: 0.72,
      proximityRadiusM: 0.85,
      material: 'timber',
    });
  }

  return registered;
}
