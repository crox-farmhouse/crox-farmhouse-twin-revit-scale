# HDR environment panoramas

2K equirectangular Radiance `.hdr` files used by
[`environment-lighting.ts`](../../../src/engine/lighting/environment-lighting.ts) for the sky box
and image-based lighting. All are **CC0 1.0 (public domain)** from [Poly Haven](https://polyhaven.com/hdris);
no attribution is required, credited here anyway.

| File | Poly Haven asset | Author | Notes |
| --- | --- | --- | --- |
| `english_countryside_day_2k.hdr` | [meadow_2](https://polyhaven.com/a/meadow_2) | Sergej Majboroda | Clear blue sky, hedgerow trees, sun ~27° high |
| `english_countryside_dusk_2k.hdr` | [spruit_sunrise](https://polyhaven.com/a/spruit_sunrise) | Greg Zaal | Low golden sun ~8° above a hazy field |
| `english_countryside_night_2k.hdr` | [kloppenheim_02](https://polyhaven.com/a/kloppenheim_02) | Greg Zaal | Moonlit field, distant village glow |

Conventions the code relies on (see `src/engine/lighting/env/env-presets.ts`):

- The sun / moon disc sits at texture column `u ≈ 0.6` (Poly Haven's standard alignment); the
  environment is rotated at runtime so the disc lines up with the directional sun light.
- `hdrSunV` in the preset is the disc's row (0 = zenith). Re-measure both if you swap a file.
- Keep files ≤ ~7 MB (2K). They are fetched once and PMREM-filtered on the GPU.

To replace one: download the 2K `.hdr` from
`https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/<name>_2k.hdr`, keep the file name above,
update `hdrSunU` / `hdrSunV` / the comment in `env-presets.ts`, and update this table.
