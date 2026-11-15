import { localeTag } from '../i18n/locale'
import { interpolate, t } from '../i18n/locale'
import { distanceMeters, type LocationSample } from './location'
export type Point = [number, number]
export interface RouteStep { distance: number; name: string; maneuver: { type: string; modifier?: string; location: Point; exit?: number }; geometry: { coordinates: Point[] } }
export interface WalkingRoute { distance: number; duration: number; geometry: { coordinates: Point[] }; legs: { steps: RouteStep[] }[] }
export interface RouteProgress { remaining: number; toTurn: number; next: RouteStep; offRoute: number; points: Point[] }
export const toLatLng = ([lng, lat]: Point): Point => [lat, lng]
export function formatMeters(value: number) { return value < 1000 ? `${Math.max(0, Math.round(value))} m` : `${(value / 1000).toLocaleString(localeTag(), { maximumFractionDigits: 1 })} km` }
export function turnText(step: RouteStep) {
  const { type, modifier, exit } = step.maneuver
  const street = step.name ? ` ${interpolate("vào ${0}",[step.name])}` : ''
  if (type === 'arrive') return t("Đến điểm đến")
  if (type.includes('roundabout') || type === 'rotary') return interpolate("Vào vòng xuyến${0}${1}",[exit ? interpolate(", ra lối thứ ${0}",[exit]) : '',street])
  if (modifier?.includes('uturn')) return interpolate("Quay đầu${0}",[street])
  if (modifier?.includes('left')) return `${modifier === 'slight left' ? t("Chếch trái") : modifier === 'sharp left' ? t("Rẽ ngoặt trái") : t("Rẽ trái")}${street}`
  if (modifier?.includes('right')) return `${modifier === 'slight right' ? t("Chếch phải") : modifier === 'sharp right' ? t("Rẽ ngoặt phải") : t("Rẽ phải")}${street}`
  return interpolate("Đi thẳng${0}",[step.name ? ` ${interpolate("trên ${0}",[step.name])}` : ''])
}
export function turnIcon(step?: RouteStep) { return step?.maneuver.type === 'arrive' ? '⚑' : step?.maneuver.modifier?.includes('uturn') ? '↶' : step?.maneuver.modifier?.includes('left') ? '↰' : step?.maneuver.modifier?.includes('right') ? '↱' : '↑' }
export function nextTurnText(step: RouteStep) { const text = turnText(step); return text[0].toLocaleLowerCase(localeTag()) + text.slice(1) }
export function routeProgress(route: WalkingRoute, sample: LocationSample): RouteProgress {
  const points = route.geometry.coordinates.map(toLatLng)
  const cumulative = [0]
  for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + distanceMeters(points[i - 1], points[i]))
  const project = (point: Point, minimum = 0) => {
    let best = { distance: Infinity, along: minimum, segment: 0, point: points[0] }
    const cos = Math.cos(point[0] * Math.PI / 180)
    for (let i = 1; i < points.length; i++) {
      if (cumulative[i] < minimum) continue
      const a = points[i - 1], b = points[i]
      const x = (b[1] - a[1]) * cos, y = b[0] - a[0]
      const t = Math.max(0, Math.min(1, (((point[1] - a[1]) * cos * x) + (point[0] - a[0]) * y) / (x * x + y * y || 1)))
      const projected: Point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      const along = cumulative[i - 1] + t * (cumulative[i] - cumulative[i - 1])
      const distance = distanceMeters(point, projected)
      if (along + 1 >= minimum && distance < best.distance) best = { distance, along, segment: i, point: projected }
    }
    return best
  }
  const position = project([sample.latitude, sample.longitude])
  let minimum = 0
  const steps = route.legs.flatMap(leg => leg.steps).map(step => { const at = project(toLatLng(step.maneuver.location), minimum).along; minimum = at; return { step, at } })
  const next = steps.find(({ step, at }) => step.maneuver.type !== 'depart' && at >= position.along - 5) ?? steps[steps.length - 1]
  const total = cumulative[cumulative.length - 1]
  const factor = total > 0 ? route.distance / total : 1
  return { remaining: Math.max(0, (total - position.along) * factor), toTurn: Math.max(0, (next.at - position.along) * factor), next: next.step, offRoute: position.distance, points: [position.point, ...points.slice(position.segment).filter((point, index) => index > 0 || distanceMeters(position.point, point) > .1)] }
}
export function validRoute(route: WalkingRoute) {
  return Number.isFinite(route?.distance) && route.distance >= 0 && Number.isFinite(route.duration) && route.duration >= 0 && route.geometry?.coordinates?.length >= 2 && route.geometry.coordinates.every(p => p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90) && route.legs?.length > 0 && route.legs.every(leg => leg.steps?.length > 0 && leg.steps.every(step => step.maneuver?.location?.length === 2 && step.maneuver.location.every(Number.isFinite)))
}
