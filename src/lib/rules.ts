export interface DestinationProgress {
  selected: string[]
  completed: string[]
  started: boolean
  startedAt?: number
  completedAt?: Record<string, number>
}
export const emptyProgress = (): DestinationProgress => ({ selected: [], completed: [], started: false })
export const requiredCount = (selectedCount: number) => Math.ceil(selectedCount * 0.8)
export const isDestinationComplete = (progress: DestinationProgress) =>
  progress.started && progress.selected.length >= 5 && progress.completed.length >= requiredCount(progress.selected.length)
