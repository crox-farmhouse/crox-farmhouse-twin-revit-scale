import { describe, expect, it } from 'vitest';
import { DEFAULT_UNIFI_PROTECT_CAMERAS } from '../../../integrations/unifi/protect/adapter.ts';
import { transformEastWingTuple } from '../structure/ground-floor-materials.ts';

// The UniFi Protect adapter stores precomputed world-space poses for the East-wing cameras so the
// integration layer does not import home geometry. Guard them against drift.
describe('UniFi Protect East-wing camera poses', () => {
  const pose = (entityId: string) =>
    DEFAULT_UNIFI_PROTECT_CAMERAS.find((c) => c.entityId === entityId)?.pose3D;

  it('match transformEastWingTuple for the courtyard camera', () => {
    const p = pose('camera.unifi_south_courtyard');
    expect(p?.position).toEqual(transformEastWingTuple(-4.55, 3.15, 2.72));
    expect(p?.lookAt).toEqual(transformEastWingTuple(1.2, 0.7, 7.8));
  });

  it('match transformEastWingTuple for the east gable camera', () => {
    const p = pose('camera.unifi_east_gable');
    expect(p?.position).toEqual(transformEastWingTuple(5.08, 3.15, -0.6));
    expect(p?.lookAt).toEqual(transformEastWingTuple(9.2, 0.8, 2.8));
  });
});
