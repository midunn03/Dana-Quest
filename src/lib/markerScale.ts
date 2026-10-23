/** Tính kích thước ghim địa điểm theo mức thu phóng bản đồ (Web Mercator). */
export const PIN_HIDE_ZOOM = 11   // thấp hơn: ẩn hoàn toàn (xem cả tỉnh / cả nước)
export const PIN_DOT_ZOOM = 14    // thấp hơn: chỉ còn chấm nhỏ
export const PIN_LABEL_ZOOM = 16  // từ mức này mới hiện tên địa điểm
export const MAX_PIN_SCALE = 1.25
export const MIN_PIN_SCALE = 0.02
// Ở mức zoom 15 (khi vừa mở bản đồ) ghim rộng khoảng 44 px; zoom 16 trở lên là kích thước đầy đủ.
export const DEFAULT_MARKER_METERS = 200
export const DRAGON_MARKER_METERS = 320

/** Số mét thực tế ứng với 1 pixel màn hình tại vĩ độ và mức zoom đã cho. */
export function metersPerPixel(lat: number, zoom: number): number {
  return 156543.03392 * Math.cos(lat * Math.PI / 180) / 2 ** zoom
}

/**
 * Tỉ lệ vẽ ghim so với kích thước gốc: ghim đại diện cho `markerMeters` mét ngoài đời,
 * nên chiều rộng pixel = markerMeters / (mét trên mỗi pixel), giới hạn ở mức tối đa.
 */
export function pinScale(lat: number, zoom: number, markerMeters: number, baseWidth: number): number {
  const widthPx = markerMeters / metersPerPixel(lat, zoom)
  return Math.max(MIN_PIN_SCALE, Math.min(MAX_PIN_SCALE, widthPx / baseWidth))
}

export type PinMode = 'hidden' | 'dot' | 'full'
export function pinMode(zoom: number): PinMode {
  return zoom < PIN_HIDE_ZOOM ? 'hidden' : zoom < PIN_DOT_ZOOM ? 'dot' : 'full'
}
