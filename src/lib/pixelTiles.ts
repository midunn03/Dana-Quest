import L from 'leaflet'

/** Mỗi ô bản đồ 256 px được thu về PIXEL_CELLS × PIXEL_CELLS "viên pixel". Nhỏ hơn = pixel to hơn. */
export const PIXEL_CELLS = 128
/** Số mức sáng mỗi kênh màu (ít mức = màu "đóng khối" kiểu game cũ). */
export const COLOR_LEVELS = 7

export function posterize(data: Uint8ClampedArray, levels = COLOR_LEVELS) {
  const step = 255 / (levels - 1)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step
    data[i + 1] = Math.round(data[i + 1] / step) * step
    data[i + 2] = Math.round(data[i + 2] / step) * step
  }
}

/** Biến ảnh ô bản đồ đã tải thành ảnh pixel nhỏ (rồi CSS phóng to không làm mịn). Lỗi thì giữ ảnh gốc. */
function pixelate(tile: HTMLImageElement) {
  if (tile.dataset.pixelated || (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent))) return
  tile.dataset.pixelated = '1'
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = PIXEL_CELLS
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(tile, 0, 0, PIXEL_CELLS, PIXEL_CELLS)
    const image = ctx.getImageData(0, 0, PIXEL_CELLS, PIXEL_CELLS)
    posterize(image.data)
    ctx.putImageData(image, 0, 0)
    const url = canvas.toDataURL('image/png')
    tile.onload = null // tránh báo "đã tải xong" lần hai
    tile.src = url
  } catch {
    // Ảnh bị chặn CORS hoặc canvas không dùng được: giữ nguyên ô bản đồ gốc.
  }
}

export class PixelTileLayer extends L.TileLayer {
  createTile(coords: L.Coords, done: L.DoneCallback) {
    const tile = super.createTile(coords, done) as HTMLImageElement
    tile.addEventListener('load', () => pixelate(tile))
    return tile
  }
}

export function pixelTileLayer(url: string, options: L.TileLayerOptions) {
  return new PixelTileLayer(url, { ...options, crossOrigin: 'anonymous' })
}
