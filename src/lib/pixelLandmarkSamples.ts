import { metersPerPixel, PIN_DOT_ZOOM, PIN_HIDE_ZOOM } from './markerScale'

export interface PixelLandmarkSpec {
  file: string
  /** Natural image aspect ratio (width / height). */
  aspect: number
  /** Full image width in real-world meters at map scale. */
  widthMeters: number
  /** Fraction of image height (0..1) aligned to the map coordinate (road deck or building base). */
  anchorY: number
  /** Exact [westOrStart, eastOrEnd] coordinates so bridges span end-to-end on the map. */
  span?: [[number, number], [number, number]]
  /** Optional visual center coordinate override. */
  center?: [number, number]
  /** Rotate sprite to match its geographic span bearing (for horizontal elevation bridges). */
  rotateWithSpan?: boolean
  /** Relative z-index offset so compact buildings stay tappable above wide bridge canvases. */
  zIndexOffset?: number
}

// Detailed transparent raster sprites, sized to real-world Da Nang footprints.
const specs: Record<string, PixelLandmarkSpec> = {
  'cau-rong': {
    file: 'dragon-bridge-pixel-v2.png',
    aspect: 1774 / 887,
    // OSM Dragon Bridge span west->east is ~760m; sprite fillX is 0.992 -> 766m full image width.
    widthMeters: 766,
    anchorY: 0.56,
    span: [[16.06110, 108.22435], [16.06121, 108.23145]],
    rotateWithSpan: true,
    zIndexOffset: 10,
  },
  'cau-song-han': {
    file: 'han-bridge-pixel-v2.png',
    aspect: 1774 / 887,
    // OSM Han River Bridge span west->east is ~495m; sprite fillX is 0.985 -> 503m full image width.
    widthMeters: 503,
    anchorY: 0.65,
    span: [[16.07189, 108.22484], [16.07249, 108.22942]],
    rotateWithSpan: true,
    zIndexOffset: 10,
  },
  'cau-tinh-yeu': {
    file: 'cau-tinh-yeu-pixel-v2.png',
    aspect: 1774 / 887,
    widthMeters: 150,
    anchorY: 0.82,
    zIndexOffset: 60,
  },
  'bao-tang-da-nang': {
    file: 'bao-tang-da-nang-pixel-v2.png',
    aspect: 1774 / 887,
    widthMeters: 195,
    anchorY: 0.84,
    zIndexOffset: 50,
  },
  'bao-tang-dieu-khac-cham': {
    file: 'bao-tang-dieu-khac-cham-pixel-v2.png',
    aspect: 1774 / 887,
    widthMeters: 175,
    anchorY: 0.84,
    zIndexOffset: 55,
  },
  'cong-vien-apec': {
    file: 'cong-vien-apec-pixel-v2.png',
    aspect: 1774 / 887,
    widthMeters: 185,
    anchorY: 0.82,
    zIndexOffset: 55,
  },
  'due-dau-an-50-nam': {
    file: 'due-gate-pixel-v2.png',
    aspect: 1774 / 887,
    widthMeters: 190,
    anchorY: 0.82,
    zIndexOffset: 50,
  },
  'cong-vien-bien-dong': {
    file: 'cong-vien-bien-dong-pixel-v2.png',
    aspect: 1568 / 1003,
    widthMeters: 190,
    anchorY: 0.84,
    zIndexOffset: 45,
  },
  'bai-bien-my-khe': {
    file: 'bai-bien-my-khe-pixel-v2.png',
    aspect: 1536 / 1024,
    widthMeters: 210,
    anchorY: 0.84,
    zIndexOffset: 45,
  },
  'bien-man-thai-sup': {
    file: 'bien-man-thai-sup-pixel-v2.png',
    aspect: 1752 / 897,
    widthMeters: 200,
    anchorY: 0.84,
    zIndexOffset: 45,
  },
  'chua-linh-ung-bai-but': {
    file: 'chua-linh-ung-bai-but-pixel-v2.png',
    aspect: 1024 / 1536,
    widthMeters: 145,
    anchorY: 0.90,
    zIndexOffset: 50,
  },
  'dinh-ban-co': {
    file: 'dinh-ban-co-pixel-v2.png',
    aspect: 1536 / 1024,
    widthMeters: 190,
    anchorY: 0.84,
    zIndexOffset: 45,
  },
  'hai-van-quan': {
    file: 'hai-van-quan-pixel-v2.png',
    aspect: 1774 / 887,
    widthMeters: 190,
    anchorY: 0.84,
    zIndexOffset: 45,
  },
  'ngu-hanh-son': {
    file: 'ngu-hanh-son-pixel-v2.png',
    aspect: 1536 / 1024,
    widthMeters: 280,
    anchorY: 0.84,
    zIndexOffset: 40,
  },
  'cau-vang-ba-na-hills': {
    file: 'cau-vang-ba-na-hills-pixel-v2.png',
    aspect: 1774 / 887,
    widthMeters: 150,
    center: [15.99500, 107.99623],
    anchorY: 0.72,
    zIndexOffset: 50,
  },
  'bai-bien-nam-o': {
    file: 'bai-bien-nam-o-pixel-v2.png',
    aspect: 1774 / 887,
    widthMeters: 210,
    anchorY: 0.84,
    zIndexOffset: 45,
  },
}

export const LANDMARK_SPRITE_MIN_ZOOM = PIN_DOT_ZOOM // 14: hide 3D objects below this zoom
export const LANDMARK_DOT_MIN_ZOOM = PIN_HIDE_ZOOM   // 11: hide even dots below this zoom
const MAX_LANDMARK_WIDTH_PX = 2000
const MIN_LANDMARK_WIDTH_PX = 14

export type LandmarkRenderMode = 'hidden' | 'dot' | 'sprite'

export interface LandmarkLayout {
  mode: LandmarkRenderMode
  position: [number, number]
  widthPx: number
  heightPx: number
  anchorX: number
  anchorY: number
  rotationDeg: number
  originYPercent: number
  zIndexOffset: number
}

export const hasPixelLandmarkSample = (id?: string) => !!specs[id ?? '']

export function getPixelLandmarkSpec(id?: string): PixelLandmarkSpec | null {
  return specs[id ?? ''] ?? null
}

export function pixelLandmarkImageUrl(id?: string): string | null {
  const spec = specs[id ?? '']
  return spec ? `${import.meta.env.BASE_URL}art/map/${spec.file}` : null
}

export function pixelLandmarkSample(id?: string) {
  const spec = specs[id ?? '']
  return spec ? '<img src="' + import.meta.env.BASE_URL + 'art/map/' + spec.file + '" alt="" aria-hidden="true" draggable="false"/>' : ''
}

export function computeLandmarkLayout(
  placeId: string | undefined,
  fallbackPosition: [number, number],
  zoom: number,
  selected = false,
): LandmarkLayout {
  const spec = getPixelLandmarkSpec(placeId)
  const position: [number, number] = spec?.span
    ? [(spec.span[0][0] + spec.span[1][0]) / 2, (spec.span[0][1] + spec.span[1][1]) / 2]
    : (spec?.center ?? fallbackPosition)

  if (zoom < LANDMARK_DOT_MIN_ZOOM && !selected) {
    return {
      mode: 'hidden',
      position,
      widthPx: 1,
      heightPx: 1,
      anchorX: 0.5,
      anchorY: 0.5,
      rotationDeg: 0,
      originYPercent: 50,
      zIndexOffset: 0,
    }
  }

  if (zoom < LANDMARK_SPRITE_MIN_ZOOM || !spec) {
    const size = selected ? 16 : 12
    return {
      mode: 'dot',
      position,
      widthPx: size,
      heightPx: size,
      anchorX: size / 2,
      anchorY: size / 2,
      rotationDeg: 0,
      originYPercent: 50,
      zIndexOffset: selected ? 200 : 30,
    }
  }

  let rotationDeg = 0
  let targetMeters = spec.widthMeters

  if (spec.span) {
    const [[lat1, lng1], [lat2, lng2]] = spec.span
    const avgLat = (lat1 + lat2) / 2
    const dxMeters = (lng2 - lng1) * 111320 * Math.cos((avgLat * Math.PI) / 180)
    const dyMeters = -(lat2 - lat1) * 111320
    const spanMeters = Math.hypot(dxMeters, dyMeters)
    if (!targetMeters) targetMeters = spanMeters
    if (spec.rotateWithSpan) {
      rotationDeg = (Math.atan2(dyMeters, dxMeters) * 180) / Math.PI
    }
  }

  const mpp = metersPerPixel(position[0], zoom)
  const widthPx = Math.min(MAX_LANDMARK_WIDTH_PX, Math.max(MIN_LANDMARK_WIDTH_PX, targetMeters / mpp))
  const heightPx = widthPx / spec.aspect
  const zBase = spec.zIndexOffset ?? 45

  return {
    mode: 'sprite',
    position,
    widthPx,
    heightPx,
    anchorX: widthPx / 2,
    anchorY: heightPx * spec.anchorY,
    rotationDeg,
    originYPercent: Math.round(spec.anchorY * 100),
    zIndexOffset: selected ? 200 : zBase,
  }
}
