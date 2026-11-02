import type { WalkingRoute } from './routing'

export const DEFAULT_STAGES = 4

export interface Stage { index: number; from: number; to: number; label: string }
export interface StageProgress { /** Số chặng đã xong. */ done: number; /** Chặng đang đi (0 = chặng 1); bằng số chặng khi đã xong hết. */ current: number; /** Tiến độ trong chặng đang đi, 0–1. */ within: number }

/**
 * Chia tuyến đường thành các chặng theo quãng đường, ưu tiên cắt ở chỗ rẽ gần nhất để mỗi chặng
 * có ý nghĩa (tuyến ngắn thì ít chặng hơn, ít nhất khoảng 100 m một chặng).
 */
export function planStages(route: WalkingRoute, wanted = DEFAULT_STAGES): Stage[] {
  const steps = route.legs.flatMap(leg => leg.steps)
  const total = steps.reduce((sum, step) => sum + step.distance, 0) || route.distance || 1
  const starts: number[] = []
  let at = 0
  for (const step of steps) { starts.push(at / total); at += step.distance }
  const count = Math.max(1, Math.min(wanted, Math.floor(route.distance / 100)))
  const maneuvers = steps.map((step, index) => ({ step, at: starts[index] })).filter(({ step, at: position }) => step.maneuver.type !== 'depart' && step.maneuver.type !== 'arrive' && position > 0 && position < 1)
  const bounds = [0]
  for (let k = 1; k < count; k++) {
    const ideal = k / count
    const tolerance = 0.3 / count
    const near = maneuvers.filter(({ at: position }) => Math.abs(position - ideal) <= tolerance).sort((a, b) => Math.abs(a.at - ideal) - Math.abs(b.at - ideal))[0]
    const wantedAt = near ? near.at : ideal
    bounds.push(Math.max(wantedAt, bounds[k - 1] + 0.5 / count))
  }
  bounds.push(1)
  return bounds.slice(0, -1).map((from, index) => {
    const to = bounds[index + 1]
    const mid = (from + to) / 2
    const stepIndex = starts.reduce((found, position, i) => position <= mid ? i : found, 0)
    const street = steps[stepIndex]?.name?.trim()
    return { index, from, to, label: street ? `Đi trên ${street}` : `Chặng ${index + 1}` }
  })
}

/** Tiến độ theo từng chặng từ tỉ lệ đã đi (0–1) của cả hành trình. */
export function stageProgress(stages: Stage[], fraction: number): StageProgress {
  const value = Math.max(0, Math.min(1, fraction))
  const done = stages.filter(stage => value >= stage.to - 1e-9).length
  const stage = stages[done]
  return { done, current: done, within: stage ? Math.max(0, Math.min(1, (value - stage.from) / (stage.to - stage.from))) : 1 }
}

/**
 * Tỉ lệ đã đi, chỉ tăng chứ không giảm: khi người chơi đi lệch hoặc app tính lại đường thì thanh tiến độ
 * không bị tụt lùi, mà đứng yên tới khi họ đi qua điểm xa nhất đã đạt.
 */
export function advanceFraction(previous: number, remaining: number, baseline: number): number {
  if (!(baseline > 0) || !Number.isFinite(remaining)) return previous
  return Math.max(previous, Math.max(0, Math.min(1, 1 - remaining / baseline)))
}
