// [UX-FLOW] Component CoachMarks: Bong bóng chỉ dẫn 5 bước tương tác lần đầu
import React, { useState, useEffect } from 'react'
import './CoachMarks.css'
import { t } from './i18n/locale'
import { isUxFlagEnabled } from './lib/uxFlags'

const STORAGE_KEY = 'dana-coach-marks-v1'

export interface CoachMarksProps {
  onFinish?: () => void
}

interface Step {
  title: string
  desc: string
  highlight?: string
}

export default function CoachMarks({ onFinish }: CoachMarksProps) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!isUxFlagEnabled('COACH_MARKS')) return
    try {
      const done = localStorage.getItem(STORAGE_KEY)
      if (!done) {
        setActive(true)
      }
    } catch {}
  }, [])

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, 'done')
    } catch {}
    setActive(false)
    onFinish?.()
  }

  if (!active || !isUxFlagEnabled('COACH_MARKS')) return null

  const steps: Step[] = [
    {
      title: t('Chào mừng bạn đến với Dana Quest! ✦', 'Welcome to Dana Quest! ✦'),
      desc: t(
        'Khám phá Đà Nẵng qua những câu chuyện thật, thử thách thật ngay trên đường phố.',
        'Explore Da Nang through real stories and on-site riddles.'
      ),
    },
    {
      title: t('1. Vị trí của bạn ⌖', '1. Your Location ⌖'),
      desc: t(
        'Ghim nhân vật thể hiện vị trí GPS của bạn trên bản đồ. Hãy bấm "Vị trí của tôi" nếu cần định vị lại.',
        'Your avatar pin shows your GPS position. Tap "My location" whenever you need to recenter.'
      ),
    },
    {
      title: t('2. Gợi ý hành trình gần bạn ✦', '2. Nearby Recommended Quests ✦'),
      desc: t(
        'StartHub gợi ý ngay quest gần bạn nhất để bạn có thể xuất phát trong vòng 1 chạm!',
        'StartHub highlights the closest quest so you can start with just 1 tap!'
      ),
    },
    {
      title: t('3. Hai kiểu chơi thú vị 🎁', '3. Two Exciting Game Modes 🎁'),
      desc: t(
        'Chọn "Quest cốt truyện" (giải đố liên hoàn) hoặc "Địa điểm" (khám phá danh thắng, chụp ảnh nhận xu).',
        'Choose "Story Quests" (chained puzzles) or "Landmarks" (explore spots, snap photos for coins).'
      ),
    },
    {
      title: t('4. Sẵn sàng lên đường! 🚀', '4. Ready to Explore! 🚀'),
      desc: t(
        'Nhớ luôn chú ý quan sát an toàn giao thông khi đi trên phố nhé. Chúc bạn có chuyến đi thật vui!',
        'Always stay safe and mind street traffic. Have a wonderful adventure!'
      ),
    },
  ]

  const current = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  return (
    <div className="coach-marks-overlay" role="dialog" aria-modal="true" aria-label={t('Hướng dẫn làm quen', 'Quick Tour')}>
      <div className="coach-marks-card">
        <header className="coach-marks-header">
          <span className="coach-marks-step-count">
            {stepIndex + 1}/{steps.length}
          </span>
          <button className="coach-marks-skip-btn" onClick={finish}>
            {t('Bỏ qua', 'Skip')}
          </button>
        </header>

        <div className="coach-marks-body">
          <h3 className="coach-marks-title">{current.title}</h3>
          <p className="coach-marks-desc">{current.desc}</p>
        </div>

        <footer className="coach-marks-footer">
          <div className="coach-marks-dots">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`coach-marks-dot ${i === stepIndex ? 'is-active' : ''}`}
              />
            ))}
          </div>

          <div className="coach-marks-buttons">
            {stepIndex > 0 && (
              <button
                className="coach-marks-prev-btn"
                onClick={() => setStepIndex(i => i - 1)}
              >
                ← {t('Trước', 'Back')}
              </button>
            )}
            <button
              className="coach-marks-next-btn"
              onClick={() => {
                if (isLast) finish()
                else setStepIndex(i => i + 1)
              }}
            >
              {isLast ? t('Bắt đầu chơi ngay! ↗', 'Start Playing! ↗') : t('Tiếp theo →', 'Next →')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
