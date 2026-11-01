import type { RoomZoneId } from '../../../core/types/topology.ts';
import type { BrasswareFinishCode } from '../../../objects/sanitaryware/index.ts';

/** Canonical bathroom room identifiers across the 3 Main House bathrooms. */
export type BathroomRoomId =
  | 'room7DownstairsWc'
  | 'room20JackAndJillShower'
  | 'room17MasterBathroom';

/** Functional procurement trade category for sanitaryware, brassware, baths, wetroom & heating. */
export type BathroomProcurementCategory =
  | 'brassware'
  | 'showering'
  | 'accessories'
  | 'bath'
  | 'sanitaryware'
  | 'enclosureAndWetroom'
  | 'heatingAndMirrors';

/**
 * Critical 2026 UK Day-1 procurement & rough-in note for Junction 2 Interiors:
 * In the UK, Perrin & Rowe `3681`, `LSS3PF`, `TSS2BR8`, and `3520/1BR` INCLUDE their 1st-fix
 * rough-in valves / underfloor manifold block inside the UK box (separate `3681R`, `5664R`, and
 * `3440R` codes are US-only). Instruct Junction 2 on Day 1 to request advance 1st-fix body
 * dispatch from Perrin & Rowe Rainham during the 8–12 week `SB` / `BZ` / `BR` living-finish lead time.
 */
export const UK_FIRST_FIX_ROUGH_IN_NOTE =
  'UK Perrin & Rowe 3681, LSS3PF, TSS2BR8, and 3520/1BR boxes INCLUDE their 1st-fix rough-in valves/floor manifold in the UK (separate 3681R/5664R/3440R SKUs are US-only). Day-1 action: instruct Junction 2 to request advance 1st-fix body dispatch from Rainham during the 8–12wk SB/BZ/BR finish lead time.';

/**
 * 2026 UK sanitaryware note:
 * Perrin & Rowe discontinued its Staffordshire ceramic sanitaryware & washstands; this schedule pairs
 * Perrin & Rowe solid-brass cistern levers (`6772` / `6797`) and heavy 1¼" bottle traps (`6303`) with
 * Junction-2-stocked / vortex ceramic sanitaryware (`Geberit Acanto TurboFlush`, `GSI Classic Swirlflush®`,
 * and `Lefroy Brooks Lissa Doon` / period ceramic washstand basins — all enclosed Vanity Hall cabinets removed).
 */
export const UK_SANITARYWARE_PAIRING_NOTE =
  'Perrin & Rowe discontinued Staffordshire ceramics/washstands; P&R solid-brass cistern levers (6772/6797) and 1¼" bottle traps (6303SB/6303PF/6303BR) are paired with close-coupled / concealed-cistern vortex WCs, bespoke dark-oak architectural joinery in Room 17, and open-legged / wall-mounted period ceramic basins in Rooms 20 & 7 (zero off-the-shelf Vanity Hall cabinetry).';

/** Strictly typed procurement schedule line item linked directly to its 3D scene-graph node prefix. */
export interface BathroomProcurementLineItem {
  readonly id: string;
  readonly roomId: BathroomRoomId;
  readonly zoneId: RoomZoneId;
  readonly roomLabel: string;
  readonly category: BathroomProcurementCategory;
  readonly brand: string;
  readonly collection: string;
  readonly sku: string;
  readonly alternateSku?: string;
  readonly description: string;
  readonly finishCode?: BrasswareFinishCode | string;
  readonly quantity: number;
  readonly dimensionsMm: string;
  readonly ukRoughInIncludedInBox?: boolean;
  readonly leadTimeNote?: string;
  /** Unit UK RRP inc. 20% VAT in GBP (line total = `quantity * rrpIncVatGbp`). */
  readonly rrpIncVatGbp: number;
  /** Unit UK street / Junction 2 trade price inc. 20% VAT in GBP (line total = `quantity * tradeIncVatGbp`). */
  readonly tradeIncVatGbp: number;
  readonly sceneNodePrefix: string;
}

export interface BathroomRoomProcurementSummary {
  readonly roomId: BathroomRoomId;
  readonly zoneId: RoomZoneId;
  readonly roomLabel: string;
  readonly lineItemCount: number;
  readonly totalUnits: number;
  readonly rrpIncVatGbp: number;
  readonly tradeIncVatGbp: number;
}

export interface BathroomProcurementTotals {
  readonly lineItemCount: number;
  readonly totalUnits: number;
  readonly rrpIncVatGbp: number;
  readonly tradeIncVatGbp: number;
  readonly byRoom: Readonly<Record<BathroomRoomId, BathroomRoomProcurementSummary>>;
}

const ROOM_7_LABEL = 'Room 7 — Downstairs Cloakroom WC (Aged Satin Brass SB / English Bronze BZ)';
const ROOM_20_LABEL = 'Room 20 — Upstairs Jack & Jill Shower Room (1950s Mid-Century Pewter PF)';
const ROOM_17_LABEL = 'Room 17 — Master / Principal Bathroom (Country-House Heritage Polished Brass BR)';

/**
 * Verified 2026 UK specification & procurement schedule across all 3 Main House bathrooms
 * (all enclosed Vanity Hall cabinets, Mirostone tops & RUB-W bowls removed):
 * - Room 7 (`bootLobby.downstairsWc`): Perrin & Rowe `Armstrong` in `SB` Satin Brass (`3681SB`, `6800SB`, `6303SB`, `6221SB`, `6235SB`, `6258SB`), wall-mounted 0TH period ceramic cloakroom basin on Satin Brass brackets, Geberit `Acanto TurboFlush` vortex WC + `Duofix Sigma 12cm` + P&R `6772SB` extended concealed cistern lever, Balineum `Mercer` mirror
 * - Room 20 (`showerRoom`): Perrin & Rowe `Langbourn` in `PF` Pewter (`3955PF`, `6303PF`, `LSS3PF`, `6421PF`, `6447PF`), Lefroy Brooks `Lissa Doon` `LB 7503` (62cm 3TH) + `LB 4970BN` Brushed Silver Nickel stand, `GSI Classic Swirlflush®` (`871411`) vortex WC + P&R `6772PF` concealed lever, Schlüter `KERDI-SHOWER-LTS` + 60cm `KERDI-LINE` + `KERDI-BOARD-SN` niche, Vogue `Regency Tall` `LG013WM` & Balineum `Mercer` Matte Nickel mirror
 * - Room 17 (`familyBathroom`): BC Designs `BAC040` (1700mm) Copper Boat Bath + `WAS050G` + `WAS080G`, Perrin & Rowe `Traditional` in `BR` Unlacquered Polished Brass (`3520/1BR` floorstanding bath-shower mixer w/ legs & cradle, `TSS2BR8` concealed 8" shower set, `3705BR` 3-hole deck basin mixer + `6303BR` bottle trap on open Polished Brass washstand + 3TH heritage ceramic basin, `2× 6921BR` hooks, `6960BR` pivot paper holder), Matki `EauZone Plus` `EWP850-LB` Living Brass screen + `Continental 30` tray, `GSI Classic Swirlflush®` (`871411`) + P&R `6797BR` Traditional lever + Walnut seat, Vogue `Baroque` `LG014-BR` & Balineum `Mercer` Unlacquered Brass mirror
 */
export const MAIN_HOUSE_BATHROOM_PROCUREMENT: readonly BathroomProcurementLineItem[] = [
  // =========================================================================
  // ROOM 7 — DOWNSTAIRS CLOAKROOM WC (`bootLobby.downstairsWc` — Aged Satin Brass `SB`)
  // =========================================================================
  {
    id: 'r7-basin-mixer-3681sb',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Armstrong',
    sku: '3681SB',
    alternateSku: '3681BZ (English Bronze £901 RRP / £766 st)',
    description:
      'Armstrong 2-hole wall-mounted basin mixer in Aged Satin Brass — UK box includes 1st-fix concealed brass wall rough-in body (request advance Rainham dispatch on Day 1)',
    finishCode: 'SB',
    quantity: 1,
    dimensionsMm: 'Spout reach 177mm (207mm overall), Ø60mm roses',
    ukRoughInIncludedInBox: true,
    leadTimeNote: '8–12wk SB/BZ finish lead time; request Day-1 advance 1st-fix body dispatch from Rainham',
    rrpIncVatGbp: 973,
    tradeIncVatGbp: 827,
    sceneNodePrefix: 'bootLobby.downstairsWc.basinMixer',
  },
  {
    id: 'r7-basin-waste-6800sb',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Armstrong / Contemporary',
    sku: '6800SB',
    alternateSku: '6800BZ',
    description: 'Slotted push-button basin waste in Aged Satin Brass',
    finishCode: 'SB',
    quantity: 1,
    dimensionsMm: 'Ø62mm flange × 1¼" BSP',
    rrpIncVatGbp: 110,
    tradeIncVatGbp: 93,
    sceneNodePrefix: 'bootLobby.downstairsWc.cloakroomWashstand',
  },
  {
    id: 'r7-bottle-trap-6303sb',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Contemporary / Armstrong',
    sku: '6303SB',
    alternateSku: '6303BZ',
    description:
      'Heavy 1¼" exposed solid-brass bottle trap with extension tube & stepped wall flange in Aged Satin Brass beneath wall-mounted cloakroom basin',
    finishCode: 'SB',
    quantity: 1,
    dimensionsMm: '1¼" BSP × 75mm seal × 300mm outlet tube',
    rrpIncVatGbp: 325,
    tradeIncVatGbp: 276,
    sceneNodePrefix: 'bootLobby.downstairsWc.cloakroomWashstand',
  },
  {
    id: 'r7-cloakroom-wall-basin-0th',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'sanitaryware',
    brand: 'Lefroy Brooks / Burlington',
    collection: 'Period Cloakroom Wall Basin (0TH)',
    sku: '0TH Cloakroom Basin + SB Wall Brackets',
    alternateSku: 'Burlington B8 51cm 0TH / Bespoke Open Washstand',
    description:
      'Wall-mounted 0-tap-hole period vitreous china cloakroom basin on solid Satin Brass wall brackets (replacing enclosed Vanity Hall cabinet; confirm J2 wall-hung basin vs open brass washstand)',
    finishCode: 'SB',
    quantity: 1,
    dimensionsMm: 'W560 × D440 × H845mm rim datum (0 tap holes)',
    rrpIncVatGbp: 690,
    tradeIncVatGbp: 552,
    sceneNodePrefix: 'bootLobby.downstairsWc.cloakroomWashstand',
  },
  {
    id: 'r7-single-hook-6221sb',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'accessories',
    brand: 'Perrin & Rowe',
    collection: 'Armstrong',
    sku: '6221SB',
    description: 'Armstrong wall-mounted single robe/coat hook with knurled collar in Aged Satin Brass',
    finishCode: 'SB',
    quantity: 1,
    dimensionsMm: 'W53 × H46 × D46mm',
    rrpIncVatGbp: 141,
    tradeIncVatGbp: 120,
    sceneNodePrefix: 'bootLobby.downstairsWc.robeHook',
  },
  {
    id: 'r7-towel-ring-6235sb',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'accessories',
    brand: 'Perrin & Rowe',
    collection: 'Armstrong',
    sku: '6235SB',
    description: 'Armstrong Ø180mm wall-mounted towel ring with knurled pivot collar in Aged Satin Brass',
    finishCode: 'SB',
    quantity: 1,
    dimensionsMm: 'Ø180mm × D62mm',
    rrpIncVatGbp: 206,
    tradeIncVatGbp: 175,
    sceneNodePrefix: 'bootLobby.downstairsWc.towelRing',
  },
  {
    id: 'r7-paper-holder-6258sb',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'accessories',
    brand: 'Perrin & Rowe',
    collection: 'Armstrong',
    sku: '6258SB',
    description: 'Armstrong wall-mounted toilet paper holder with knurled collar in Aged Satin Brass',
    finishCode: 'SB',
    quantity: 1,
    dimensionsMm: 'W147 × H98 × D46mm',
    rrpIncVatGbp: 299,
    tradeIncVatGbp: 254,
    sceneNodePrefix: 'bootLobby.downstairsWc.paperHolder',
  },
  {
    id: 'r7-vortex-wc-acanto-duofix',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'sanitaryware',
    brand: 'Geberit',
    collection: 'Acanto TurboFlush + Duofix Sigma 12cm',
    sku: '502.719.00.1 + 111.911.00.5',
    description:
      'Geberit Acanto TurboFlush rimless vortex WC pan & soft-close seat (502.719.00.1) with Duofix Sigma 12cm concealed cistern frame (111.911.00.5 stocked at Junction 2)',
    quantity: 1,
    dimensionsMm: 'W360 × D530 × H410mm pan + 120mm concealed cistern',
    rrpIncVatGbp: 980,
    tradeIncVatGbp: 735,
    sceneNodePrefix: 'bootLobby.downstairsWc.acantoVortexWc',
  },
  {
    id: 'r7-cistern-lever-6772sb',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Contemporary / Armstrong',
    sku: '6772SB',
    alternateSku: '6772BZ',
    description: 'Extended concealed cistern flush lever in Aged Satin Brass',
    finishCode: 'SB',
    quantity: 1,
    dimensionsMm: 'Ø56mm rose × extended spindle',
    rrpIncVatGbp: 222,
    tradeIncVatGbp: 189,
    sceneNodePrefix: 'bootLobby.downstairsWc.acantoVortexWc',
  },
  {
    id: 'r7-mirror-mercer-2-040lab',
    roomId: 'room7DownstairsWc',
    zoneId: 'bootLobby',
    roomLabel: ROOM_7_LABEL,
    category: 'heatingAndMirrors',
    brand: 'Balineum',
    collection: 'Mercer',
    sku: '2-040LAB',
    alternateSku: 'Origins Living Delphine DEL-00R069-BB',
    description: 'Balineum Mercer Brushed Aged Brass portrait wall mirror above cloakroom basin',
    finishCode: 'SB',
    quantity: 1,
    dimensionsMm: 'W680 × H700mm',
    rrpIncVatGbp: 595,
    tradeIncVatGbp: 506,
    sceneNodePrefix: 'bootLobby.downstairsWc.mirrorFrame',
  },

  // =========================================================================
  // ROOM 20 — UPSTAIRS JACK & JILL (`showerRoom` — 1950s Mid-Century Pewter `PF`, Stocked 3–7d!)
  // =========================================================================
  {
    id: 'r20-basin-mixer-3955pf',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Langbourn (Contemporary)',
    sku: '3955PF',
    description:
      'Langbourn 3-hole deck-mounted basin mixer with smooth stepped mid-century collars, lever handles & integral pop-up waste in Pewter',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: '200mm valve spread × 140mm spout reach (pop-up waste included)',
    leadTimeNote: 'Stocked UK finish (3–7 days)',
    rrpIncVatGbp: 967,
    tradeIncVatGbp: 822,
    sceneNodePrefix: 'showerRoom.sanitaryware.lissaDoonWashstand',
  },
  {
    id: 'r20-bottle-trap-6303pf',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Contemporary / Langbourn',
    sku: '6303PF',
    description:
      'Heavy 1¼" exposed solid-brass bottle trap with extension outlet tube & wall flange in Pewter',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: '1¼" BSP × 75mm seal × 300mm outlet tube',
    leadTimeNote: 'Stocked UK finish (3–7 days)',
    rrpIncVatGbp: 291,
    tradeIncVatGbp: 248,
    sceneNodePrefix: 'showerRoom.sanitaryware.lissaDoonWashstand',
  },
  {
    id: 'r20-shower-set-lss3pf',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'showering',
    brand: 'Perrin & Rowe',
    collection: 'Langbourn (Contemporary)',
    sku: 'LSS3PF',
    description:
      'Langbourn concealed 8" thermostatic shower set (concealed valve + 400mm wall arm + 8" rose + slide rail, handshower & wall outlet) in Pewter — UK box includes 1st-fix concealed thermostatic valve body',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: '400mm arm, Ø200mm 8" rose, 639mm slide rail',
    ukRoughInIncludedInBox: true,
    leadTimeNote: 'Stocked UK finish (3–7 days); 1st-fix valve included in UK box',
    rrpIncVatGbp: 3327,
    tradeIncVatGbp: 2828,
    sceneNodePrefix: 'showerRoom.thermostaticShowerSet',
  },
  {
    id: 'r20-robe-hook-6421pf',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'accessories',
    brand: 'Perrin & Rowe',
    collection: 'Langbourn (Contemporary)',
    sku: '6421PF',
    description: 'Langbourn wall-mounted single robe hook in Pewter',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: 'Ø50mm rose × D45mm',
    rrpIncVatGbp: 93,
    tradeIncVatGbp: 79,
    sceneNodePrefix: 'showerRoom.sanitaryware.robeHook',
  },
  {
    id: 'r20-paper-holder-6447pf',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'accessories',
    brand: 'Perrin & Rowe',
    collection: 'Langbourn (Contemporary)',
    sku: '6447PF',
    description: 'Langbourn wall-mounted toilet paper holder in Pewter',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: 'W150 × H95 × D68mm',
    rrpIncVatGbp: 259,
    tradeIncVatGbp: 220,
    sceneNodePrefix: 'showerRoom.sanitaryware.paperHolder',
  },
  {
    id: 'r20-washstand-lb7503-lb4970bn',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'sanitaryware',
    brand: 'Lefroy Brooks',
    collection: 'Lissa Doon (1950s Mid-Century)',
    sku: 'LB 7503 + LB 4970BN',
    alternateSku: 'Burlington Riviera 1950s Basin + Brushed Nickel Stand (at J2)',
    description:
      'Lissa Doon 62cm 3-tap-hole ceramic basin (LB 7503) on Brushed Silver Nickel open tubular washstand legs & towel rails (LB 4970BN)',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: 'W620 × D510 × H850mm (3 tap holes)',
    rrpIncVatGbp: 2947,
    tradeIncVatGbp: 2505,
    sceneNodePrefix: 'showerRoom.sanitaryware.lissaDoonWashstand',
  },
  {
    id: 'r20-vortex-wc-gsi-871411',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'sanitaryware',
    brand: 'GSI Ceramica',
    collection: 'Classic Swirlflush®',
    sku: '871211 + 878111 (Close-Coupled)',
    alternateSku: 'Burlington Riviera P21+T21 Close-Coupled w/ 6771PF',
    description:
      'GSI Classic Swirlflush® 1950s-contoured quiet vortex close-coupled WC pan, stepped ceramic cistern & soft-close seat',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: 'W360 × D550 × H410mm',
    rrpIncVatGbp: 890,
    tradeIncVatGbp: 712,
    sceneNodePrefix: 'showerRoom.sanitaryware.gsiSwirlflushWc',
  },
  {
    id: 'r20-cistern-lever-6772pf',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Contemporary / Langbourn',
    sku: '6771PF',
    alternateSku: '6772PF (extended spindle variant)',
    description: 'Close-coupled ceramic cistern flush lever in Pewter',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: 'Ø56mm rose × extended spindle',
    rrpIncVatGbp: 198,
    tradeIncVatGbp: 168,
    sceneNodePrefix: 'showerRoom.sanitaryware.gsiSwirlflushWc',
  },
  {
    id: 'r20-wetroom-kerdi-shower-lts',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'enclosureAndWetroom',
    brand: 'Schlüter-Systems',
    collection: 'KERDI-SHOWER-LTS + KERDI-LINE + KERDI-BOARD-SN',
    sku: 'KSLT965/1930S + KLH50G2E60 + KLA19EB60 + KSS10 + KERDI-BOARD-SN',
    description:
      'Bespoke-trimmed 1875×706mm sloped wetroom former (KSLT965/1930S), 60cm KERDI-LINE linear channel & Brushed Stainless grate (KLH50G2E60 + KLA19EB60), KSS10 tanking kit & KERDI-BOARD-SN recessed tiled shower niche',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: '1875 × 706mm wetroom stall, 600mm linear grate',
    rrpIncVatGbp: 1432,
    tradeIncVatGbp: 1217,
    sceneNodePrefix: 'showerRoom.kerdiLineLinearGrate',
  },
  {
    id: 'r20-towel-warmer-vogue-lg013wm',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'heatingAndMirrors',
    brand: 'Vogue UK',
    collection: 'Regency Tall',
    sku: 'LG013WM + EE006',
    description: 'Vogue UK Regency Tall wall-mounted towel warmer in Brushed Nickel with EE006 dual-fuel element',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: 'W500 × H1180 × D125mm',
    rrpIncVatGbp: 940,
    tradeIncVatGbp: 752,
    sceneNodePrefix: 'showerRoom.heatedTowelRail',
  },
  {
    id: 'r20-mirror-mercer-h24bcb75345',
    roomId: 'room20JackAndJillShower',
    zoneId: 'bedroom3',
    roomLabel: ROOM_20_LABEL,
    category: 'heatingAndMirrors',
    brand: 'Balineum',
    collection: 'Mercer',
    sku: 'H24BCB75345',
    alternateSku: 'Origins Living Delphine Arch DEL-00R069-BN',
    description: 'Balineum Mercer Matte Nickel wall mirror above Lissa Doon washstand',
    finishCode: 'PF',
    quantity: 1,
    dimensionsMm: 'W640 × H660mm',
    rrpIncVatGbp: 625,
    tradeIncVatGbp: 531,
    sceneNodePrefix: 'showerRoom.sanitaryware.mirrorFrame',
  },

  // =========================================================================
  // ROOM 17 — MASTER / PRINCIPAL BATHROOM (`familyBathroom` — Polished Brass `BR`)
  // =========================================================================
  {
    id: 'r17-copper-boat-bath-bac040',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'bath',
    brand: 'BC Designs',
    collection: 'Copper Boat Bath',
    sku: 'BAC040 (1700mm)',
    alternateSku: 'BAC045 (1500mm) / BAC070 (1800mm Copper/Acrylic)',
    description:
      'Freestanding double-ended roll-top Boat Bath in hand-burnished Copper with integral plinth',
    finishCode: 'Copper / BR',
    quantity: 1,
    dimensionsMm: 'L1700 × W740 × H715mm (centre saddle H605mm)',
    rrpIncVatGbp: 4290,
    tradeIncVatGbp: 3432,
    sceneNodePrefix: 'familyBathroom.copperBoatBath',
  },
  {
    id: 'r17-bath-waste-trap-was050g-was080g',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'bath',
    brand: 'BC Designs',
    collection: 'Traditional Brass Wastes',
    sku: 'WAS050G + WAS080G',
    description:
      'Exposed Polished Brass clicker bath waste & overflow (WAS050G) with Brass shallow floor P-trap (WAS080G)',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: 'Ø38mm overflow × 1½" shallow P-trap',
    rrpIncVatGbp: 465,
    tradeIncVatGbp: 372,
    sceneNodePrefix: 'familyBathroom.copperBoatBath',
  },
  {
    id: 'r17-bath-mixer-3520-1br',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Traditional',
    sku: '3520/1BR',
    alternateSku: '3521/1BR (Crossheads)',
    description:
      'Traditional floorstanding bath-shower mixer with twin standpipe legs, porcelain levers, handshower & telephone cradle in Unlacquered Polished Brass — UK box includes floor mounting kit',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: '180mm leg spread × H958mm × 210mm spout reach',
    ukRoughInIncludedInBox: true,
    leadTimeNote: '8–12wk BR finish lead time; request Day-1 advance floor manifold dispatch from Rainham',
    rrpIncVatGbp: 2830,
    tradeIncVatGbp: 2406,
    sceneNodePrefix: 'familyBathroom.bathMixer',
  },
  {
    id: 'r17-shower-set-tss2br8',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'showering',
    brand: 'Perrin & Rowe',
    collection: 'Traditional',
    sku: 'TSS2BR8',
    alternateSku: 'TSS2BR12 (12" Rose)',
    description:
      'Concealed Traditional 8" thermostatic shower set with porcelain lever, 8" deluge rose, slide rail & handshower in Unlacquered Polished Brass — UK box includes 1st-fix concealed valve body',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: '400mm arm, Ø200mm 8" rose, traditional slide rail',
    ukRoughInIncludedInBox: true,
    leadTimeNote: '8–12wk BR finish lead time; request Day-1 advance 1st-fix valve dispatch from Rainham',
    rrpIncVatGbp: 4083,
    tradeIncVatGbp: 3471,
    sceneNodePrefix: 'familyBathroom.shower.thermostaticSet',
  },
  {
    id: 'r17-basin-mixer-3705br',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Traditional',
    sku: '3705BR',
    description:
      'Traditional 3-hole deck-mounted basin mixer with white porcelain levers & integral pop-up waste in Unlacquered Polished Brass',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: '200mm valve spread × 135mm spout reach (pop-up waste included)',
    rrpIncVatGbp: 977,
    tradeIncVatGbp: 830,
    sceneNodePrefix: 'familyBathroom.darkOakVanityUnit',
  },
  {
    id: 'r17-bottle-trap-6303br',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Traditional / Contemporary',
    sku: '6303BR',
    description:
      'Heavy 1¼" exposed solid-brass bottle trap with extension outlet tube & wall flange in Unlacquered Polished Brass beneath open washstand',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: '1¼" BSP × 75mm seal × 300mm outlet tube',
    rrpIncVatGbp: 291,
    tradeIncVatGbp: 248,
    sceneNodePrefix: 'familyBathroom.darkOakVanityUnit',
  },
  {
    id: 'r17-bespoke-dark-oak-vanity-carrara',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'sanitaryware',
    brand: 'Bespoke Architectural Joinery + Kohler / Villeroy & Boch',
    collection: 'Smoked Dark Oak Veneer In-Frame Vanity + Honed Carrara + Undermount Bowl',
    sku: 'BESPOKE-DOV-920 + CARRARA-25 + CERAMIC-UM',
    alternateSku: 'Parker Howley / Catchpole & Rye Bespoke Dark Oak Vanity (zero Vanity Hall)',
    description:
      'Tailored in-frame smoked dark European oak veneer 2-door + top-frieze vanity unit with bracket plinth, Polished Brass knobs, 25mm Honed Bianco Carrara marble countertop & shaped upstand, and glazed white ceramic undermount basin',
    finishCode: 'Dark Oak / BR',
    quantity: 1,
    dimensionsMm: 'W920 (970mm scribed alcove) × D538 × H850mm',
    rrpIncVatGbp: 2650,
    tradeIncVatGbp: 2120,
    sceneNodePrefix: 'familyBathroom.darkOakVanityUnit',
  },
  {
    id: 'r17-robe-hooks-6921br',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'accessories',
    brand: 'Perrin & Rowe',
    collection: 'Traditional',
    sku: '6921BR',
    description: 'Traditional wall-mounted robe hooks in Unlacquered Polished Brass (paired on West wall North of walk-in shower for hanging bathrobes)',
    finishCode: 'BR',
    quantity: 2,
    dimensionsMm: 'Ø54mm rose × D48mm (each)',
    rrpIncVatGbp: 112,
    tradeIncVatGbp: 95,
    sceneNodePrefix: 'familyBathroom.robeHook',
  },
  {
    id: 'r17-paper-holder-6960br',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'accessories',
    brand: 'Perrin & Rowe',
    collection: 'Traditional',
    sku: '6960BR',
    description: 'Traditional twin-post pivot toilet roll holder in Unlacquered Polished Brass',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: 'W190 × H98 × D75mm',
    rrpIncVatGbp: 294,
    tradeIncVatGbp: 250,
    sceneNodePrefix: 'familyBathroom.paperHolder',
  },
  {
    id: 'r17-walkin-matki-eauzone-plus',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'enclosureAndWetroom',
    brand: 'Matki',
    collection: 'EauZone Plus + Continental 40 White Tray',
    sku: 'EWP950-LB + CL1590 + LPW90 + KERDI-BOARD-SN',
    alternateSku: 'Kaldewei Superplan 1500×900 Alpine White Enamelled Tray',
    description:
      'Enlarged SW walk-in shower with crisp gloss-white raised Matki Continental 40 stone-resin shower tray (1550 × 900 × 42mm) & LPW90 Polished Brass fast-flow waste, EauZone Plus 2000mm H 10mm glass panel in Unlacquered Living Brass (EWP950-LB), cream zellige wet-wall tiling & KERDI-BOARD-SN recessed niche',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: '950 × 2000mm 10mm glass, 1550 × 900 × 42mm gloss-white tray',
    rrpIncVatGbp: 2240,
    tradeIncVatGbp: 1850,
    sceneNodePrefix: 'familyBathroom.showerEnclosure',
  },
  {
    id: 'r17-floor-tumbled-limestone-flagstones',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'enclosureAndWetroom',
    brand: ' Artisans of Devizes / Mandarin Stone',
    collection: 'Tumbled Aged English / Bourgogne Limestone Flagstones',
    sku: 'LIMESTONE-TUMBLED-600X400',
    description:
      'Tumbled and honed warm pale cream-buff staggered rectangular limestone flagstones (~600 × 400mm courses) with soft lime-putty grout across Master Bathroom floor',
    finishCode: 'Tumbled Warm Limestone',
    quantity: 1,
    dimensionsMm: '600 × 400 × 15mm staggered courses (~9.8 m² net)',
    rrpIncVatGbp: 980,
    tradeIncVatGbp: 795,
    sceneNodePrefix: 'familyBathroom.westFloorSlab',
  },
  {
    id: 'r17-vortex-wc-gsi-871411-walnut',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'sanitaryware',
    brand: 'GSI Ceramica',
    collection: 'Classic Swirlflush® Heritage',
    sku: '871211 + 878111 + Walnut Seat (BR Hinges)',
    alternateSku: 'Burlington Regal Close-Coupled P2 + T21 w/ Walnut Seat & BR Hinges',
    description:
      'GSI Classic Swirlflush® heritage vortex close-coupled WC pan with stepped vitreous-china cistern & Walnut timber soft-close seat with Unlacquered Brass hinges',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: 'W360 × D550 × H410mm',
    rrpIncVatGbp: 1095,
    tradeIncVatGbp: 876,
    sceneNodePrefix: 'familyBathroom.gsiSwirlflushWc',
  },
  {
    id: 'r17-cistern-lever-6797br',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'brassware',
    brand: 'Perrin & Rowe',
    collection: 'Traditional',
    sku: '6796BR',
    alternateSku: '6797BR',
    description: 'Traditional close-coupled ceramic cistern flush lever with white porcelain paddle in Unlacquered Polished Brass',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: 'Ø56mm rose × traditional porcelain paddle',
    rrpIncVatGbp: 235,
    tradeIncVatGbp: 200,
    sceneNodePrefix: 'familyBathroom.gsiSwirlflushWc',
  },
  {
    id: 'r17-towel-warmer-vogue-baroque-lg014-br',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'heatingAndMirrors',
    brand: 'Vogue UK',
    collection: 'Regency Wall-Mounted',
    sku: 'LG013-BR + EE006 + VL003',
    description:
      'Vogue UK Regency ball-jointed wall-mounted ladder heated towel rail in Unlacquered Polished Brass mounted on West face of SE bulkhead wall with EE006 dual-fuel element & VL003 Brass crosshead valves',
    finishCode: 'BR',
    quantity: 1,
    dimensionsMm: 'W500 × H920 × D125mm',
    rrpIncVatGbp: 2180,
    tradeIncVatGbp: 1744,
    sceneNodePrefix: 'familyBathroom.heatedTowelRail',
  },
  {
    id: 'r17-bespoke-full-height-mirror-shelving',
    roomId: 'room17MasterBathroom',
    zoneId: 'familyBathroom',
    roomLabel: ROOM_17_LABEL,
    category: 'heatingAndMirrors',
    brand: 'Bespoke Architectural Joinery',
    collection: 'Full-Height Smoked Dark Oak Shelving & Brass-Beaded Bevelled Mirror',
    sku: 'BESPOKE-DOV-MIRROR-SHELVING',
    description:
      'Full-height built-in smoked dark oak apothecary & linen shelving unit rising to the 4.65m collar ceiling with central Unlacquered Brass-beaded bevelled demister mirror and concealed warm soffit light',
    finishCode: 'Dark Oak / BR',
    quantity: 1,
    dimensionsMm: 'W966 × H1640 × D175mm (countertop 3.01m to ceiling 4.65m)',
    rrpIncVatGbp: 1850,
    tradeIncVatGbp: 1480,
    sceneNodePrefix: 'familyBathroom.vanityFullHeightJoinery',
  },
];

/** Returns all procurement line items scheduled for the given Main House bathroom room. */
export function getBathroomProcurementByRoom(
  roomId: BathroomRoomId
): readonly BathroomProcurementLineItem[] {
  return MAIN_HOUSE_BATHROOM_PROCUREMENT.filter((item) => item.roomId === roomId);
}

function summarizeBathroomRoom(
  roomId: BathroomRoomId,
  zoneId: RoomZoneId,
  roomLabel: string
): BathroomRoomProcurementSummary {
  const items = getBathroomProcurementByRoom(roomId);
  let totalUnits = 0;
  let rrpIncVatGbp = 0;
  let tradeIncVatGbp = 0;
  for (const item of items) {
    totalUnits += item.quantity;
    rrpIncVatGbp += item.quantity * item.rrpIncVatGbp;
    tradeIncVatGbp += item.quantity * item.tradeIncVatGbp;
  }
  return {
    roomId,
    zoneId,
    roomLabel,
    lineItemCount: items.length,
    totalUnits,
    rrpIncVatGbp: Math.round(rrpIncVatGbp * 100) / 100,
    tradeIncVatGbp: Math.round(tradeIncVatGbp * 100) / 100,
  };
}

/** Computes per-room and grand-total UK RRP & Trade (inc. VAT) figures across all 3 Main House bathrooms. */
export function computeBathroomProcurementTotals(): BathroomProcurementTotals {
  const room7 = summarizeBathroomRoom('room7DownstairsWc', 'bootLobby', ROOM_7_LABEL);
  const room20 = summarizeBathroomRoom('room20JackAndJillShower', 'bedroom3', ROOM_20_LABEL);
  const room17 = summarizeBathroomRoom('room17MasterBathroom', 'familyBathroom', ROOM_17_LABEL);

  return {
    lineItemCount: room7.lineItemCount + room20.lineItemCount + room17.lineItemCount,
    totalUnits: room7.totalUnits + room20.totalUnits + room17.totalUnits,
    rrpIncVatGbp: Math.round((room7.rrpIncVatGbp + room20.rrpIncVatGbp + room17.rrpIncVatGbp) * 100) / 100,
    tradeIncVatGbp:
      Math.round((room7.tradeIncVatGbp + room20.tradeIncVatGbp + room17.tradeIncVatGbp) * 100) / 100,
    byRoom: {
      room7DownstairsWc: room7,
      room20JackAndJillShower: room20,
      room17MasterBathroom: room17,
    },
  };
}
