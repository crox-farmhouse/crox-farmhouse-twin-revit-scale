import type { BifoldPanelRef } from '../../../types/scene.ts';
import type { BifoldTrackConfig } from '../property-scene-profile.ts';

/**
 * Animates a concertina bifold door set between closed (0) and open (1).
 */
export class BifoldDoorAnimator {
  private readonly panels: readonly BifoldPanelRef[];
  private readonly track: BifoldTrackConfig;
  private open = false;
  private currentOpen = 0;

  public constructor(panels: readonly BifoldPanelRef[], track: BifoldTrackConfig) {
    this.panels = panels;
    this.track = track;
  }

  public getPanels(): readonly BifoldPanelRef[] {
    return this.panels;
  }

  public isOpen(): boolean {
    return this.open;
  }

  public toggle(): boolean {
    this.open = !this.open;
    return this.open;
  }

  /** Advances the fold animation. Returns true if any leaf moved. */
  public update(dtSeconds: number): boolean {
    const targetOpen = this.open ? 1 : 0;
    if (this.currentOpen === targetOpen) return false;

    const step = dtSeconds * 2.2;
    if (this.currentOpen < targetOpen) {
      this.currentOpen = Math.min(1, this.currentOpen + step);
    } else {
      this.currentOpen = Math.max(0, this.currentOpen - step);
    }
    // Smooth cubic ease-in-out for natural bifold track glide
    const t = this.currentOpen;
    const smoothT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const theta = smoothT * this.track.maxFoldAngle;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const { anchorRightX, trackZ, leafWidth } = this.track;

    for (const leaf of this.panels) {
      const k = leaf.openX; // index from right post (0..n-1)
      leaf.group.position.x = anchorRightX - (k + 0.5) * leafWidth * cosTheta;
      leaf.group.position.z = trackZ + 0.5 * leafWidth * sinTheta;
      leaf.group.rotation.y = leaf.dir * theta;
      leaf.group.updateMatrixWorld(true);
    }
    return true;
  }
}
