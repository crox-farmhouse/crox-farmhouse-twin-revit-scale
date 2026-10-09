import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { clampPivot, PIVOT_MAX_DISTANCE } from './pivot-math.ts';

/** Raycasts the visible scene at a normalized-device-coordinate position. */
export type SurfacePicker = (ndcX: number, ndcY: number) => THREE.Vector3 | null;

type NavCamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;

/** What the grab-pan controller needs from its owning camera rig. */
export interface GrabPanHost {
  readonly controls: OrbitControls;
  getActiveCamera(): NavCamera;
  /** Stops any in-flight fly-to so user input wins. */
  cancelTween(): void;
}

/** Distance (m) along the cursor ray used when nothing is hit at all. */
const FALLBACK_RAY_DISTANCE = 8;
/** Ignore floor-plane hits further than this (grazing angles near the horizon). */
const MAX_PLANE_HIT_DISTANCE = 80;
interface ScreenPoint {
  x: number;
  y: number;
}

interface PanState {
  /** World point that stays glued under the cursor. */
  readonly anchor: THREE.Vector3;
  /** Mouse pointer that drives the pan, or null for a two-finger touch pan. */
  readonly mousePointerId: number | null;
}

/**
 * Pointer-driven navigation that complements OrbitControls:
 *  - grab-and-drag panning (the picked surface point stays exactly under the cursor),
 *  - orbit pivot moved to the depth of the surface under the cursor on rotate start,
 *  - wheel zoom speed tied to the depth of the surface under the cursor.
 *
 * OrbitControls' own panning must be disabled (`enablePan = false`); rotate and zoom
 * remain handled by OrbitControls.
 */
export class GrabPanController {
  private readonly host: GrabPanHost;
  private readonly canvas: HTMLCanvasElement;
  private picker: SurfacePicker | null = null;
  private pan: PanState | null = null;
  private singleFingerPan = false;

  private readonly raycaster = new THREE.Raycaster();
  private readonly plane = new THREE.Plane();
  private readonly tmpNdc = new THREE.Vector2();
  private readonly tmpVec = new THREE.Vector3();
  private readonly tmpVec2 = new THREE.Vector3();

  public constructor(host: GrabPanHost, canvas: HTMLCanvasElement) {
    this.host = host;
    this.canvas = canvas;
    canvas.addEventListener('pointerdown', this.onPointerDown, { capture: true });
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: true });
  }

  public setSurfacePicker(picker: SurfacePicker | null): void {
    this.picker = picker;
  }

  public isPanning(): boolean {
    return this.pan !== null;
  }

  public setSingleFingerPan(enabled: boolean): void {
    this.singleFingerPan = enabled;
    this.host.controls.touches.ONE = enabled ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
  }

  public isSingleFingerPan(): boolean {
    return this.singleFingerPan;
  }

  public dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown, { capture: true });
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.pan = null;
  }

  /**
   * World point under the given NDC position: scene surface, else the horizontal
   * plane through the current pivot, else a point 8 m down the cursor ray.
   */
  public pickWorldPoint(ndcX: number, ndcY: number): THREE.Vector3 {
    const picked = this.picker?.(ndcX, ndcY) ?? null;
    if (picked) return picked.clone();

    const camera = this.host.getActiveCamera();
    camera.updateMatrixWorld();
    this.raycaster.setFromCamera(this.tmpNdc.set(ndcX, ndcY), camera);
    const ray = this.raycaster.ray;
    this.plane.set(new THREE.Vector3(0, 1, 0), -this.host.controls.target.y);
    const hit = ray.intersectPlane(this.plane, new THREE.Vector3());
    if (hit && hit.distanceTo(ray.origin) <= MAX_PLANE_HIT_DISTANCE) return hit;
    return ray.at(FALLBACK_RAY_DISTANCE, new THREE.Vector3());
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private readonly onPointerDown = (e: PointerEvent): void => {
    const controls = this.host.controls;
    if (!controls.enabled) return;

    if (e.pointerType === 'touch') {
      this.host.cancelTween();
      const isOrtho = this.host.getActiveCamera() instanceof THREE.OrthographicCamera;
      controls.enablePan = true;
      controls.zoomToCursor = false;
      controls.touches.ONE =
        this.singleFingerPan || isOrtho ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
      return;
    }

    // Desktop mouse/pen: GrabPanController handles surface-anchored pan; OrbitControls handles rotate/dolly.
    controls.enablePan = false;
    controls.zoomToCursor = true;

    const action = this.mouseAction(e);
    if (action === 'none') return;
    this.host.cancelTween();
    if (action === 'pan') {
      this.beginPan({ x: e.clientX, y: e.clientY }, e.pointerId);
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch {
        // Pointer may already be released (synthetic events); panning still works.
      }
    } else if (action === 'rotate' && controls.enableRotate) {
      this.retargetPivot(e.clientX, e.clientY);
    }
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    const pan = this.pan;
    if (!pan) return;
    if (!this.host.controls.enabled) {
      this.endPan();
      return;
    }
    if (pan.mousePointerId !== null && e.pointerId === pan.mousePointerId) {
      this.applyPan(pan.anchor, { x: e.clientX, y: e.clientY });
    }
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    if (this.pan && this.pan.mousePointerId === e.pointerId) {
      this.endPan();
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
    }
  };

  private readonly onWheel = (): void => {
    const controls = this.host.controls;
    if (!controls.enabled || !controls.enableZoom || this.pan) return;
    this.host.cancelTween();
    // OrbitControls natively handles cursor-directed dolly (`controls.zoomToCursor = true`)
    // without needing a full-scene CPU raycast or mid-scroll target depth jump.
  };

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private mouseAction(e: PointerEvent): 'pan' | 'rotate' | 'none' {
    const buttons = this.host.controls.mouseButtons;
    const mapped =
      e.button === 0 ? buttons.LEFT : e.button === 1 ? buttons.MIDDLE : e.button === 2 ? buttons.RIGHT : null;
    const modifier = e.ctrlKey || e.metaKey || e.shiftKey;
    // Mirrors OrbitControls: a modifier swaps ROTATE <-> PAN.
    if (mapped === THREE.MOUSE.PAN) return modifier ? 'rotate' : 'pan';
    if (mapped === THREE.MOUSE.ROTATE) return modifier ? 'pan' : 'rotate';
    return 'none';
  }

  private toNdc(p: ScreenPoint): THREE.Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    return new THREE.Vector2(((p.x - rect.left) / w) * 2 - 1, -((p.y - rect.top) / h) * 2 + 1);
  }

  private beginPan(screen: ScreenPoint, mousePointerId: number | null): void {
    const ndc = this.toNdc(screen);
    this.pan = { anchor: this.pickWorldPoint(ndc.x, ndc.y), mousePointerId };
    this.host.controls.dispatchEvent({ type: 'start' });
  }

  private endPan(): void {
    if (!this.pan) return;
    this.pan = null;
    this.host.controls.dispatchEvent({ type: 'end' });
  }

  /**
   * Translates camera + pivot in the camera's screen plane so `anchor` projects
   * exactly onto the cursor. Works for perspective and orthographic cameras.
   */
  private applyPan(anchor: THREE.Vector3, screen: ScreenPoint): void {
    const camera = this.host.getActiveCamera();
    camera.updateMatrixWorld();
    const ndc = this.toNdc(screen);
    const ndcZ = this.tmpVec.copy(anchor).project(camera).z;
    if (!Number.isFinite(ndcZ)) return;
    const underCursor = this.tmpVec2.set(ndc.x, ndc.y, ndcZ).unproject(camera);
    const delta = this.tmpVec.copy(anchor).sub(underCursor);
    if (delta.lengthSq() < 1e-12) return;
    camera.position.add(delta);
    this.host.controls.target.add(delta);
    camera.updateMatrixWorld();
    this.host.controls.dispatchEvent({ type: 'change' });
  }

  /**
   * Moves the orbit pivot to the depth of the surface under the cursor, keeping it on
   * the current view axis so the view does not jump (OrbitControls always looks at
   * its target). The camera itself never moves.
   */
  private retargetPivot(clientX: number, clientY: number): void {
    const controls = this.host.controls;
    const camera = this.host.getActiveCamera();
    const ndc = this.toNdc({ x: clientX, y: clientY });
    const hit = this.pickWorldPoint(ndc.x, ndc.y);

    const forward = camera.getWorldDirection(new THREE.Vector3());
    const depth = hit.clone().sub(camera.position).dot(forward);
    const minDepth = controls.minDistance * 1.02;
    const maxDepth = Math.min(controls.maxDistance, PIVOT_MAX_DISTANCE);
    const clampedDepth = THREE.MathUtils.clamp(depth, minDepth, Math.max(minDepth, maxDepth));
    const candidate = camera.position.clone().addScaledVector(forward, clampedDepth);
    const result = clampPivot(camera.position, candidate, undefined, maxDepth, minDepth);
    // Only ever apply on-axis corrections here; off-axis ones would rotate the view.
    if (!result.onViewRay) return;
    controls.target.copy(result.pivot);
  }
}
