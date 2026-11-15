import { useEffect, useRef } from 'react'
import PixelAvatar from './PixelAvatar'
import { avatars, readAvatar } from './lib/avatar'
import { stageProgress, type Stage } from './lib/routeStages'

/**
 * Thanh tiến độ hành trình: mỗi chặng là một đoạn, nhân vật chạy dọc thanh theo vị trí thật.
 * Chặng đang đi có vạch chạy như đang tải; hoàn thành chặng thì nút chặng sáng lên và có thông báo nhỏ.
 */
export default function JourneyTrack({ stages, fraction, moving, arrived }: { stages: Stage[]; fraction: number; moving: boolean; arrived: boolean }) {
  const value = arrived ? 1 : fraction
  const { done, current, within } = stageProgress(stages, value)
  const announced = useRef(0)
  useEffect(() => {
    if (done > announced.current && stages.length > 1) {
      const text = done >= stages.length ? 'Đã đến nơi! Hoàn thành mọi chặng.' : `Hoàn thành chặng ${done}/${stages.length}`
      window.dispatchEvent(new CustomEvent('dana-toast', { detail: text }))
    }
    announced.current = Math.max(announced.current, done)
  }, [done, stages.length])
  if (!stages.length) return null
  const stage = stages[Math.min(current, stages.length - 1)]
  const percent = Math.round(value * 100)
  return <div className="journey" role="group" aria-label="Tiến độ hành trình">
    <div className="journey-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`Chặng ${Math.min(current + 1, stages.length)} trên ${stages.length}, ${percent}%`}>
      {stages.map(item => {
        const finished = item.index < done
        const fill = finished ? 100 : item.index === current ? within * 100 : 0
        return <div key={item.index} className={`journey-seg ${finished ? 'done' : item.index === current && !arrived ? 'current' : ''}`} style={{ flexGrow: item.to - item.from }}>
          <span className="journey-fill" style={{ width: `${fill}%` }} />
          <span className={`journey-node ${finished ? 'done' : ''}`} aria-hidden="true">{finished ? '✓' : item.index + 1}</span>
        </div>
      })}
      <span className="journey-flag" aria-hidden="true">{arrived ? '🏁' : '⚑'}</span>
      <div className="journey-runner" data-moving={moving && !arrived ? 'true' : 'false'} style={{ left: `${value * 100}%` }}><PixelAvatar avatar={readAvatar() ?? avatars[0]} /></div>
    </div>
    <p className="journey-caption">{arrived ? `Đã hoàn thành ${stages.length}/${stages.length} chặng` : `Chặng ${current + 1}/${stages.length} · ${stage.label}`}</p>
  </div>
}
