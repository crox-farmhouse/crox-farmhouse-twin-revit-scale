import type * as THREE from 'three';

/**
 * Verified Perrin & Rowe / coordinated metalware finish codes across the 3 Main House bathrooms:
 * - `'SB'`: Satin Brass (unlacquered living brushed aged solid brass — Room 7 Cloakroom WC)
 * - `'PF'`: Pewter (brushed nickel / warm pewter — Room 20 Upstairs Jack & Jill Shower Room)
 * - `'BR'`: Polished Brass (unlacquered mirror-bright solid brass — Room 17 Master Bathroom)
 */
export type BrasswareFinishCode = 'SB' | 'PF' | 'BR';

/**
 * Perrin & Rowe UK brassware design collections across the 3 Main House bathrooms:
 * - `'armstrong'`: Industrial-heritage machined cylinders & diamond-knurled collars (Room 7 `SB`)
 * - `'langbourn'`: Mid-century / contemporary smooth stepped collars & sleek levers (Room 20 `PF`)
 * - `'traditional'`: Country-house Edwardian turned baluster collars & white porcelain levers (Room 17 `BR`)
 */
export type PerrinRoweCollectionStyle = 'armstrong' | 'langbourn' | 'traditional';

/** Cardinal direction the fixture faces into the room (local `+Z` maps to this world direction). */
export type BathroomWallFacing = 'north' | 'south' | 'east' | 'west';

export interface BathroomMetalMaterialPalette {
  readonly primary: THREE.MeshPhysicalMaterial;
  readonly knurled: THREE.MeshPhysicalMaterial;
  readonly darkShadow: THREE.MeshStandardMaterial;
}

export interface ArmstrongWallBasinMixerOptions {
  /** Hierarchical scene-graph prefix, e.g. `'bootLobby.downstairsWc.basinMixer'`. */
  readonly namePrefix: string;
  /** `3681SB`, `3681PF`, or `3681BR`. */
  readonly finish: BrasswareFinishCode;
  /** Spout projection from wall face to nozzle centre in metres (default `0.177`, 207mm overall). */
  readonly spoutReachM?: number;
  /** Horizontal offset of the Ø46mm knurled single-lever mixer rose relative to spout at `x = 0` (default `0.105`). */
  readonly leverOffsetXM?: number;
  readonly style?: PerrinRoweCollectionStyle;
}

export interface ArmstrongDeck3HoleBasinMixerOptions {
  /** Hierarchical scene-graph prefix, e.g. `'upstairsShowerRoom.lissaDoonWashstand.armstrong3HoleMixer'`. */
  readonly namePrefix: string;
  /** `3606SB`, `3606PF`, or `3606BR`. */
  readonly finish: BrasswareFinishCode;
  /** Centre-to-centre spread between left Hot and right Cold deck valves in metres (default `0.200`). */
  readonly valveSpreadM?: number;
  readonly style?: PerrinRoweCollectionStyle;
}

export interface ArmstrongConcealedShowerSetOptions {
  /** Hierarchical scene-graph prefix, e.g. `'familyBathroom.shower.thermostaticSet'`. */
  readonly namePrefix: string;
  /** `5664PF` or `5664BR`. */
  readonly finish: BrasswareFinishCode;
  /** Centre height of the `5664` W90×H200mm concealed thermostatic 2-way plate above `y = 0` shower floor (default `1.08`). */
  readonly valveCenterYM?: number;
  /** Wall outlet height of the `5684` 400mm overhead shower arm above `y = 0` shower floor (default `1.98`). */
  readonly overheadArmYM?: number;
  /** Overhead arm reach in metres (`5684` = `0.400`). */
  readonly overheadArmReachM?: number;
  /** `5605` 8-inch Armstrong shower rose diameter in metres (default `0.198`). */
  readonly roseDiameterM?: number;
  /** Horizontal offset along wall (`local X`) for the `5640` 639mm slide rail & `5687` handshower (default `0.26`). */
  readonly slideRailOffsetXM?: number;
  /** Vertical centre of the `5640` 639mm slide rail above `y = 0` shower floor (default `1.28`). */
  readonly slideRailCenterYM?: number;
  readonly style?: PerrinRoweCollectionStyle;
}

export interface ArmstrongFreestandingBathMixerOptions {
  /** Hierarchical scene-graph prefix, e.g. `'familyBathroom.bathMixer'`. */
  readonly namePrefix: string;
  /** `3660BR` (or any Armstrong finish). */
  readonly finish: BrasswareFinishCode;
  /** Overall mixer top height above `y = 0` floor (`3660BR` = `0.958`). */
  readonly overallHeightM?: number;
  /** Spout outlet height above `y = 0` floor (`3660BR` = `0.827`). */
  readonly spoutOutletHeightM?: number;
  /** Spout reach along `local +Z` (`3660BR` = `0.210`). */
  readonly spoutReachM?: number;
  readonly style?: PerrinRoweCollectionStyle;
}

export interface ArmstrongRobeHookOptions {
  /** Hierarchical scene-graph prefix, e.g. `'familyBathroom.robeHook.north'`. */
  readonly namePrefix: string;
  /** `6221SB` (Armstrong), `6421PF` (Langbourn), or `6921BR` (Traditional). */
  readonly finish: BrasswareFinishCode;
  readonly style?: PerrinRoweCollectionStyle;
}

export interface PerrinRoweTowelRingOptions {
  /** Hierarchical scene-graph prefix, e.g. `'bootLobby.downstairsWc.towelRing'`. */
  readonly namePrefix: string;
  /** `6235SB` Armstrong wall-mounted towel ring (`Ø180mm`). */
  readonly finish: BrasswareFinishCode;
  readonly style?: PerrinRoweCollectionStyle;
}

export interface PerrinRoweConcealedCisternLeverOptions {
  /** Hierarchical scene-graph prefix, e.g. `'bootLobby.downstairsWc.cisternLever'`. */
  readonly namePrefix: string;
  /** `6772SB`, `6772PF`, or `6797BR` solid-brass extended concealed cistern lever. */
  readonly finish: BrasswareFinishCode;
  readonly style?: PerrinRoweCollectionStyle;
}

export interface ArmstrongPaperHolderOptions {
  /** Hierarchical scene-graph prefix, e.g. `'familyBathroom.paperHolder'`. */
  readonly namePrefix: string;
  /** `6258SB`, `6258PF`, or `6258BR` (`W147 × H98 × D46mm`). */
  readonly finish: BrasswareFinishCode;
  /** Whether to include a textured ivory toilet tissue roll on the holder arm (default `true`). */
  readonly includePaperRoll?: boolean;
  readonly style?: PerrinRoweCollectionStyle;
}

export interface BcDesignsCopperBoatBathOptions {
  /** Hierarchical scene-graph prefix, e.g. `'familyBathroom.copperBoatBath'`. */
  readonly namePrefix: string;
  /** Overall double-ended roll-top length along `local X` in metres (default `1.580`). */
  readonly lengthM?: number;
  /** Overall width along `local Z` in metres (default `0.735`). */
  readonly widthM?: number;
  /** Sweeping raised boat-end rim height at `±lengthM/2` in metres (default `0.715`). */
  readonly endHeightM?: number;
  /** Central saddle rim height at `x = 0` in metres (default `0.605`). */
  readonly centerHeightM?: number;
  /** Brassware finish for the `WAS050G` click-clack waste & external overflow pipe (default `'BR'`). */
  readonly brassFinish?: BrasswareFinishCode;
  /** Which end/side carries the external brass overflow standpipe (default `'west'`, i.e. `-X`). */
  readonly overflowEnd?: 'west' | 'east';
}

export interface LefroyBrooksCharterhouseWcOptions {
  /** Hierarchical scene-graph prefix, e.g. `'familyBathroom.charterhouseWc'`. */
  readonly namePrefix: string;
  /** Coordinated finish for `LB 1307` paddle lever, `LB 7241` bar hinges & flush/supply pipework. */
  readonly finish: BrasswareFinishCode;
  /**
   * Lefroy Brooks ceramic design profile:
   * - `'charterhouse1900'` (default): `1900 Classic Charterhouse` stepped rectangular cornice (`LB 7207` + `LB 7208` / `LB 7209` + `LB 7212`).
   * - `'laChapelle1910'`: `1910 La Chapelle` 45°-chamfered stepped octagonal front corners (`LB 7707` + `LB 7708`).
   * - `'lissaDoon'`: `Lissa Doon` softly rounded Edwardian contours (`LB 7507` + `LB 7508`).
   */
  readonly collection?: 'charterhouse1900' | 'laChapelle1910' | 'lissaDoon' | 'acantoVortex' | 'gsiClassicSwirlflush';
  /**
   * - `'closeCoupled'`: `LB 7207` pan + `LB 7208` stepped cistern (`W465 × D725 × H760mm`, pan rim `410mm`).
   * - `'lowLevel'`: `LB 7209` pan + `LB 7212` wall-hung stepped cistern connected by an exposed brass flush pipe,
   *   allowing the pan to step forward cleanly of low rear soil boxing (`lowBoxingDepthM` / `lowBoxingHeightM`).
   */
  readonly variant?: 'closeCoupled' | 'lowLevel' | 'backToWallVortex';
  /** Height of concealed cistern lever above floor when `variant === 'backToWallVortex'` (default `0.86`). */
  readonly concealedLeverYM?: number;
  /** Lateral X offset of concealed cistern lever when `variant === 'backToWallVortex'` (default `0.145`). */
  readonly concealedLeverXM?: number;
  /** Style of P&R concealed cistern lever (`6772` contemporary/metallic vs `6797` traditional porcelain). */
  readonly leverStyle?: PerrinRoweCollectionStyle;
  /** Optional rear low soil-boxing depth along `+Z` from the wall (`0` default; e.g. `0.18` in Room 7). */
  readonly lowBoxingDepthM?: number;
  /** Optional rear low soil-boxing height above floor (`0.382` in Room 7 so cistern mounts cleanly above it). */
  readonly lowBoxingHeightM?: number;
  /** Seat finish (`LB 7241`, default `'glossWhite'`). */
  readonly seatFinish?: 'glossWhite' | 'antiqueOak' | 'walnut' | 'darkOak';
}

export interface LefroyBrooksLaChapellePedestalBasinOptions {
  /** Hierarchical scene-graph prefix, e.g. `'upstairsShowerRoom.laChapelleBasin'`. */
  readonly namePrefix: string;
  /** Coordinated finish for `6800` slotted click-clack waste & overflow trim. */
  readonly finish: BrasswareFinishCode;
  /** Overall basin width along `local X` in metres (default `0.680` — 680mm W). */
  readonly widthM?: number;
  /** Overall basin projection from `z = 0` wall along `local +Z` in metres (default `0.535` — 535mm D). */
  readonly depthM?: number;
  /** Front rim height above `y = 0` finished floor in metres (default `0.860` — 860mm H). */
  readonly rimHeightM?: number;
}

export interface LefroyBrooksLissaDoonWashstandOptions {
  /** Hierarchical scene-graph prefix, e.g. `'upstairsShowerRoom.lissaDoonWashstand'`. */
  readonly namePrefix: string;
  /** Metalware finish (`'SB'` | `'PF'` | `'BR'`) for tubular console legs, ball joints, towel rails, `3606` mixer/waste & exposed `6303` bottle trap. */
  readonly finish: BrasswareFinishCode;
  /** Overall basin width along `local X` in metres (`LB 7503` default `0.700`). */
  readonly widthM?: number;
  /** Overall projection from wall `z = 0` along `local +Z` in metres (default `0.540`). */
  readonly depthM?: number;
  /** Front ceramic rim height above `y = 0` floor in metres (default `0.850`). */
  readonly rimHeightM?: number;
  /** Ceramic tap-hole drilling (`3` default for `LB 7503` + `3606` 3-hole deck mixer; `0` for wall mixer). */
  readonly tapHoles?: 0 | 3;
  /** Whether to mount the Perrin & Rowe `3606` Armstrong 3-hole deck mixer on the rear ceramic deck (default `true` when `tapHoles !== 0`). */
  readonly includeDeckMixer?: boolean;
  readonly mixerStyle?: PerrinRoweCollectionStyle;
  /** `'consoleLegs'` (open tubular stand w/ towel rails) or `'wallMountedBrackets'` (wall-hung ceramic cloakroom basin on cast solid-brass brackets + exposed 6303 trap). */
  readonly mountVariant?: 'consoleLegs' | 'wallMountedBrackets';
}

