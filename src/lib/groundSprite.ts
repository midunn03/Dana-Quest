import L from 'leaflet'
import { metersPerPixel } from './markerScale'
import type { GroundInfo } from './placeContent'

/** Kích thước ảnh theo pixel màn hình tại một mức zoom (đúng tỉ lệ mét ngoài đời). */
export function groundSize(info: Pick<GroundInfo, 'lat' | 'widthM' | 'heightM'>, zoom: number): [number, number] {
  const mpp = metersPerPixel(info.lat, zoom)
  return [info.widthM / mpp, info.heightM / mpp]
}

type AnimEvent = L.ZoomAnimEvent
type MapInternals = L.Map & { _latLngToNewLayerPoint(latlng: L.LatLng, zoom: number, center: L.LatLng): L.Point; _zoomAnimated?: boolean }

/**
 * Lớp bản đồ dán ảnh "xuống mặt đất": ảnh gắn với tọa độ thật, rộng/cao theo mét,
 * phóng to thu nhỏ cùng bản đồ (không bị giới hạn kích thước như ghim) và xoay được.
 */
export class GroundSpriteLayer extends L.Layer {
  private img?: HTMLImageElement
  private mapRef?: L.Map
  private zoomShown = 0
  private url: string
  private info: GroundInfo
  private onClick?: () => void

  constructor(url: string, info: GroundInfo, onClick?: () => void) {
    super()
    this.url = url
    this.info = info
    this.onClick = onClick
  }

  onAdd(map: L.Map) {
    this.mapRef = map
    const img = L.DomUtil.create('img', 'ground-sprite leaflet-zoom-animated') as HTMLImageElement
    img.src = this.url
    img.alt = ''
    img.draggable = false
    img.style.transformOrigin = 'center'
    if (this.onClick) {
      const handler = this.onClick
      L.DomEvent.on(img, 'click', (event: Event) => { L.DomEvent.stopPropagation(event); handler() })
      img.classList.add('ground-clickable')
    }
    this.img = img
    map.getPane('overlayPane')!.appendChild(img)
    this.update()
    return this
  }

  onRemove() {
    this.img?.remove()
    this.img = undefined
    this.mapRef = undefined
    return this
  }

  getEvents() {
    return { zoom: this.update, viewreset: this.update, zoomanim: this.animate as unknown as L.LeafletEventHandlerFn }
  }

  /** Đặt kích thước theo zoom hiện tại và vị trí theo tâm tọa độ. */
  private update = () => {
    const map = this.mapRef
    if (!map || !this.img) return
    this.zoomShown = map.getZoom()
    const [w, h] = groundSize(this.info, this.zoomShown)
    this.img.style.width = `${w}px`
    this.img.style.height = `${h}px`
    this.place(map.latLngToLayerPoint([this.info.lat, this.info.lng]), 1)
  }

  private animate = (event: AnimEvent) => {
    const map = this.mapRef as MapInternals | undefined
    if (!map || !this.img) return
    const point = map._latLngToNewLayerPoint(L.latLng(this.info.lat, this.info.lng), event.zoom, event.center)
    this.place(point, 2 ** (event.zoom - this.zoomShown))
  }

  private place(center: L.Point, scale: number) {
    if (!this.img) return
    const w = parseFloat(this.img.style.width) || 0
    const h = parseFloat(this.img.style.height) || 0
    this.img.style.transform = `translate3d(${center.x - w / 2}px, ${center.y - h / 2}px, 0) rotate(${this.info.rotation}deg) scale(${scale})`
  }
}
