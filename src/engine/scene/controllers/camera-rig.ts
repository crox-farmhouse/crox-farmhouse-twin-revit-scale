import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CameraTweenState } from '../../../types/scene.ts';

export type RigCamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;

const ORTHO_HALF_HEIGHT = 5.6;

/**
 * Perspective + orthographic cameras, orbit controls and eased camera fly-tos.
 */
export class CameraRig {
  public readonly perspCamera: THREE.PerspectiveCamera;
  public readonly orthoCamera: THREE.OrthographicCamera;
  public readonly controls: OrbitControls;

  private activeCamera: RigCamera;
  private cameraTween: CameraTweenState | null = null;
  private readonly onActiveCameraChanged: (camera: RigCamera) => void;

  public constructor(
    canvas: HTMLCanvasElement,
    onActiveCameraChanged: (camera: RigCamera) => void
  ) {
    this.onActiveCameraChanged = onActiveCameraChanged;

    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    this.perspCamera = new THREE.PerspectiveCamera(42, aspect, 0.15, 110);
    this.perspCamera.position.set(0.4, 7.8, 10.6);

    this.orthoCamera = new THREE.OrthographicCamera(
      -ORTHO_HALF_HEIGHT * aspect,
      ORTHO_HALF_HEIGHT * aspect,
      ORTHO_HALF_HEIGHT,
      -ORTHO_HALF_HEIGHT,
      -55,
      120
    );
    this.orthoCamera.position.set(9.2, 9.4, 9.4);
    this.orthoCamera.zoom = 1.08;
    this.orthoCamera.updateProjectionMatrix();

    this.activeCamera = this.perspCamera;

    this.controls = new OrbitControls(this.activeCamera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(-1.2, 1.05, 0.2);
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.minDistance = 1.6;
    this.controls.maxDistance = 44.0;
    this.controls.minZoom = 0.28;
    this.controls.maxZoom = 3.2;
  }

  public getActiveCamera(): RigCamera {
    return this.activeCamera;
  }

  public isOrthographic(): boolean {
    return this.activeCamera === this.orthoCamera;
  }

  /**
   * Switches to the orthographic or perspective camera (carrying over the
   * current position). No-op if that camera is already active.
   */
  public useCamera(orthographic: boolean): void {
    const next = orthographic ? this.orthoCamera : this.perspCamera;
    if (this.activeCamera === next) return;
    next.position.copy(this.activeCamera.position);
    this.activeCamera = next;
    this.controls.object = next;
    this.onActiveCameraChanged(next);
  }

  public startTween(endPos: THREE.Vector3, endTarget: THREE.Vector3, duration: number): void {
    this.cameraTween = {
      startPos: this.activeCamera.position.clone(),
      endPos,
      startTarget: this.controls.target.clone(),
      endTarget,
      elapsed: 0,
      duration,
    };
  }

  /** Advances any active fly-to. Returns true if the camera moved. */
  public updateTween(dtSeconds: number): boolean {
    const tween = this.cameraTween;
    if (!tween) return false;
    tween.elapsed += dtSeconds;
    const t = Math.min(1, tween.elapsed / tween.duration);
    const ease = 1 - Math.pow(1 - t, 3);
    this.activeCamera.position.lerpVectors(tween.startPos, tween.endPos, ease);
    this.controls.target.lerpVectors(tween.startTarget, tween.endTarget, ease);
    if (t >= 1) this.cameraTween = null;
    return true;
  }

  public resize(width: number, height: number): void {
    const aspect = width / height;
    this.perspCamera.aspect = aspect;
    this.perspCamera.updateProjectionMatrix();

    this.orthoCamera.left = -ORTHO_HALF_HEIGHT * aspect;
    this.orthoCamera.right = ORTHO_HALF_HEIGHT * aspect;
    this.orthoCamera.top = ORTHO_HALF_HEIGHT;
    this.orthoCamera.bottom = -ORTHO_HALF_HEIGHT;
    this.orthoCamera.updateProjectionMatrix();
  }
}
