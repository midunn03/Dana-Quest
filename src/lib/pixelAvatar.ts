import { t, localized } from '../i18n/locale'
// Bộ vẽ nhân vật pixel theo cấu hình.
// Nhân vật được ghép từ các lớp (thân, đầu, mặt, tóc) trên lưới 16×24 ô. Mỗi bộ phận
// là một lớp riêng nên sau này có thể thay từng lớp bằng ảnh pixel do admin tải lên.

export const GRID_W = 16
export const GRID_H = 24
const OFFSET_Y = 1 // chừa 1 hàng phía trên để vẽ viền

export const genders = ['m', 'f'] as const
export const heads = ['tron', 'vuong', 'to', 'det', 'xoan'] as const
export const hairs = ['den', 'xu', 'haimai', 'mullet'] as const
export const sleeves = ['ngan', 'dai', 'coc'] as const
export const pantsKinds = ['dai', 'ngan'] as const

export type Gender = typeof genders[number]
export type HeadShape = typeof heads[number]
export type HairStyle = typeof hairs[number]
export type SleeveKind = typeof sleeves[number]
export type PantsKind = typeof pantsKinds[number]

export interface AvatarLook {
  gender: Gender
  head: HeadShape
  hair: HairStyle
  sleeve: SleeveKind
  pants: PantsKind
  skin: number
  hairColor: number
  shirt: number
  pantsColor: number
}

export const genderLabels: Record<Gender, string> = localized({ m: 'Nam', f: "Nữ" })
export const headLabels: Record<HeadShape, string> = localized({ tron: "Tròn", vuong: "Vuông", to: 'To', det: "Dẹt", xoan: "Trái xoan" })
export const hairLabels: Record<HairStyle, string> = localized({ den: "Đen thẳng", xu: "Xù", haimai: "2 mái", mullet: 'Mullet' })
export const sleeveLabels: Record<SleeveKind, string> = localized({ ngan: "Tay ngắn", dai: "Tay dài", coc: "Cộc tay" })
export const pantsLabels: Record<PantsKind, string> = localized({ dai: "Quần dài", ngan: "Quần ngắn" })

export const skinTones = [
  { name: t("Sáng"), color: '#f6d3b3' }, { name: 'Be', color: '#eeb990' }, { name: t("Nâu nhạt"), color: '#d9a06f' },
  { name: t("Nâu"), color: '#b97750' }, { name: t("Nâu đậm"), color: '#8a5a3c' },
] as const
export const hairColors = [
  { name: t("Đen"), color: '#23232b' }, { name: t("Nâu"), color: '#5a3a22' }, { name: t("Vàng"), color: '#c9a24a' },
  { name: t("Đỏ"), color: '#a8442e' }, { name: t("Tím"), color: '#6a5acd' },
] as const
export const shirtColors = [
  { name: t("Xanh biển"), color: '#2385bd' }, { name: 'Cam', color: '#d87743' }, { name: t("Xanh lá"), color: '#458764' },
  { name: t("Tím"), color: '#8575b0' }, { name: t("Hồng"), color: '#e2506a' }, { name: t("Trắng"), color: '#f2f0e6' },
] as const
export const pantsColors = [
  { name: 'Xanh jean', color: '#476477' }, { name: t("Đen"), color: '#2f3a4a' }, { name: t("Nâu"), color: '#8b6b4a' },
  { name: t("Xanh rêu"), color: '#3d6b57' }, { name: t("Tím than"), color: '#5b4f8a' },
] as const

export const defaultLook: AvatarLook = { gender: 'm', head: 'tron', hair: 'den', sleeve: 'ngan', pants: 'dai', skin: 1, hairColor: 0, shirt: 0, pantsColor: 0 }

// Mã nhân vật lưu trong tài khoản, ví dụ: c1.m.tron.den.ngan.dai.1.0.2.1
export function lookToCode(look: AvatarLook): string {
  return ['c1', look.gender, look.head, look.hair, look.sleeve, look.pants, look.skin, look.hairColor, look.shirt, look.pantsColor].join('.')
}

function pick<T extends string>(list: readonly T[], value: string | undefined): T | null {
  return list.find(item => item === value) ?? null
}
function index(value: string | undefined, length: number): number | null {
  if (value === undefined || !/^\d$/.test(value)) return null
  const number = Number(value)
  return number < length ? number : null
}

export function lookFromCode(code: string | null | undefined): AvatarLook | null {
  if (!code) return null
  const [version, gender, head, hair, sleeve, pants, skin, hairColor, shirt, pantsColor, ...extra] = code.split('.')
  if (version !== 'c1' || extra.length) return null
  const look = {
    gender: pick(genders, gender), head: pick(heads, head), hair: pick(hairs, hair), sleeve: pick(sleeves, sleeve), pants: pick(pantsKinds, pants),
    skin: index(skin, skinTones.length), hairColor: index(hairColor, hairColors.length), shirt: index(shirt, shirtColors.length), pantsColor: index(pantsColor, pantsColors.length),
  }
  if (Object.values(look).some(value => value === null)) return null
  return look as AvatarLook
}

export function randomLook(random: () => number = Math.random): AvatarLook {
  const choose = <T,>(list: readonly T[]): T => list[Math.floor(random() * list.length)] as T
  return {
    gender: choose(genders), head: choose(heads), hair: choose(hairs), sleeve: choose(sleeves), pants: choose(pantsKinds),
    skin: Math.floor(random() * skinTones.length), hairColor: Math.floor(random() * hairColors.length),
    shirt: Math.floor(random() * shirtColors.length), pantsColor: Math.floor(random() * pantsColors.length),
  }
}

// ---- Hình dạng đầu: [hàng đầu, hàng cuối, cột trái, cột phải] ----
type Band = [number, number, number, number]
const HEADS: Record<HeadShape, Band[]> = {
  tron: [[3, 3, 4, 11], [4, 9, 3, 12], [10, 10, 4, 11]],
  vuong: [[3, 10, 3, 12]],
  to: [[2, 2, 4, 11], [3, 3, 3, 12], [4, 9, 2, 13], [10, 10, 3, 12]],
  det: [[4, 4, 3, 12], [5, 9, 2, 13], [10, 10, 3, 12]],
  xoan: [[2, 2, 6, 9], [3, 3, 5, 10], [4, 9, 4, 11], [10, 10, 5, 10], [11, 11, 6, 9]],
}

const OUTLINE = '#2b3a40'
const EYE = '#1e2b33'
const MOUTH = '#a85a4e'
const BLUSH = '#f2a3a3'
const SHOE = '#4a3b36'

function shade(hex: string, amount: number): string {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16)
    const next = Math.max(0, Math.min(255, Math.round(value * (1 + amount))))
    return next.toString(16).padStart(2, '0')
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

export interface PixelRun { x: number; y: number; w: number; color: string }

export function renderLook(look: AvatarLook): PixelRun[] {
  const grid: (string | null)[][] = Array.from({ length: GRID_H }, () => Array<string | null>(GRID_W).fill(null))
  const put = (x: number, y: number, color: string) => {
    const row = grid[y + OFFSET_Y]
    if (row && x >= 0 && x < GRID_W) row[x] = color
  }
  const fill = (x1: number, x2: number, y: number, color: string) => { for (let x = x1; x <= x2; x++) put(x, y, color) }

  const skin = skinTones[look.skin]!.color
  const hair = hairColors[look.hairColor]!.color
  const shirt = shirtColors[look.shirt]!.color
  const pants = pantsColors[look.pantsColor]!.color
  const female = look.gender === 'f'

  // Hình dạng đầu
  const spans = new Map<number, [number, number]>()
  for (const [from, to, left, right] of HEADS[look.head]) for (let y = from; y <= to; y++) spans.set(y, [left, right])
  const rows = [...spans.keys()]
  const top = Math.min(...rows)
  const bottom = Math.max(...rows)
  const span = (y: number): [number, number] => spans.get(Math.min(Math.max(y, top), bottom))!

  // 1. Chân, quần, giày
  const body = female ? { l: 5, r: 10 } : { l: 4, r: 11 }
  const legWidth = female ? 2 : 3
  const legs: [number, number][] = [[body.l, body.l + legWidth - 1], [body.r - legWidth + 1, body.r]]
  fill(body.l, body.r, 17, pants)
  for (const [from, to] of legs) {
    for (let y = 18; y <= 20; y++) fill(from, to, y, look.pants === 'dai' || y === 18 ? pants : skin)
  }
  fill(legs[0][0] - 1, legs[0][1], 21, SHOE)
  fill(legs[1][0], legs[1][1] + 1, 21, SHOE)

  // 2. Tay và tay áo
  const sleeveEnd = look.sleeve === 'dai' ? 17 : look.sleeve === 'ngan' ? 14 : 12
  for (const [from, to] of [[body.l - 2, body.l - 1], [body.r + 1, body.r + 2]] as const) {
    for (let y = 12; y <= 17; y++) fill(from, to, y, y <= sleeveEnd ? shirt : skin)
  }

  // 3. Thân áo (hàng cuối đậm hơn để có chiều sâu) và cổ
  for (let y = 12; y <= 16; y++) fill(body.l, body.r, y, y === 16 ? shade(shirt, -0.16) : shirt)
  fill(7, 8, 12, skin)
  fill(7, 8, 11, skin)

  // 4. Đầu và khuôn mặt
  for (const [y, [left, right]] of spans) fill(left, right, y, skin)
  for (const x of [5, 10]) { put(x, 6, EYE); put(x, 7, EYE) }
  fill(7, 8, 9, MOUTH)
  if (female) {
    put(4, 5, EYE); put(11, 5, EYE) // lông mi
    put(4, 8, BLUSH); put(11, 8, BLUSH) // má hồng
  }

  // 5. Tóc (vẽ sau cùng nên phủ lên đầu và vai)
  const [topLeft, topRight] = span(top)
  switch (look.hair) {
    case 'den': {
      fill(topLeft + 1, topRight - 1, top - 1, hair)
      for (const y of [top, top + 1]) fill(...span(y), y, hair)
      put(span(top + 2)[0], top + 2, hair); put(span(top + 2)[1], top + 2, hair)
      if (female) for (let y = top + 3; y <= bottom - 1; y++) { put(span(y)[0], y, hair); put(span(y)[1], y, hair) }
      break
    }
    case 'xu': {
      fill(topLeft + 1, topRight - 1, top - 2, hair)
      fill(topLeft - 1, topRight + 1, top - 1, hair)
      for (const y of [top, top + 1]) fill(span(y)[0] - 1, span(y)[1] + 1, y, hair)
      for (const y of [top + 2, top + 3]) {
        const [left, right] = span(y)
        fill(left - 1, left, y, hair); fill(right, right + 1, y, hair)
      }
      break
    }
    case 'haimai': {
      fill(topLeft + 1, topRight - 1, top - 1, hair)
      fill(topLeft, topRight, top, hair)
      const [left, right] = span(top + 1)
      fill(left, 6, top + 1, hair); fill(9, right, top + 1, hair)
      const [sideLeft, sideRight] = span(top + 2)
      fill(sideLeft, sideLeft + 1, top + 2, hair); fill(sideRight - 1, sideRight, top + 2, hair)
      if (female) for (let y = top + 3; y <= bottom - 1; y++) { put(span(y)[0], y, hair); put(span(y)[1], y, hair) }
      break
    }
    case 'mullet': {
      fill(topLeft + 1, topRight - 1, top - 1, hair)
      for (const y of [top, top + 1]) fill(...span(y), y, hair)
      for (let y = top + 2; y <= bottom + 2; y++) {
        const [left, right] = span(y)
        put(left - 1, y, hair); put(right + 1, y, hair)
        if (y >= bottom + 1) { put(left, y, hair); put(right, y, hair) }
      }
      break
    }
  }

  // 6. Viền: ô trống nằm cạnh ô có màu
  const outlined = grid.map(row => [...row])
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (grid[y]![x]) continue
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => Boolean(grid[y + dy!]?.[x + dx!]))
      if (near) outlined[y]![x] = OUTLINE
    }
  }

  // Gộp các ô liền kề cùng màu trên một hàng thành một hình chữ nhật
  const runs: PixelRun[] = []
  for (let y = 0; y < GRID_H; y++) {
    let x = 0
    while (x < GRID_W) {
      const color = outlined[y]![x]
      if (!color) { x++; continue }
      let end = x
      while (end + 1 < GRID_W && outlined[y]![end + 1] === color) end++
      runs.push({ x, y, w: end - x + 1, color })
      x = end + 1
    }
  }
  return runs
}

// Chuỗi SVG (dùng cho xem thử hoặc xuất ảnh); giao diện React dùng renderLook trực tiếp.
export function lookToSvg(look: AvatarLook): string {
  const rects = renderLook(look).map(run => `<rect x="${run.x}" y="${run.y}" width="${run.w}" height="1" fill="${run.color}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_W} ${GRID_H}" shape-rendering="crispEdges">${rects}</svg>`
}
