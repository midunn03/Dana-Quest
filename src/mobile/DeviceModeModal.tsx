import { useState } from 'react'
import { t } from '../i18n/locale'
import { getRecommendedDeviceMode, type DeviceMode } from '../lib/deviceMode'

export interface DeviceModeModalProps {
  open: boolean
  currentMode?: DeviceMode
  onSelect: (mode: DeviceMode) => void
  onClose?: () => void
}

export default function DeviceModeModal({
  open,
  currentMode,
  onSelect,
  onClose,
}: DeviceModeModalProps) {
  const recommended = getRecommendedDeviceMode()
  const [selected, setSelected] = useState<DeviceMode>(() => currentMode ?? recommended)

  if (!open) return null

  const handleConfirm = () => {
    onSelect(selected)
    onClose?.()
  }

  return (
    <div className="device-mode-backdrop" role="dialog" aria-modal="true" aria-labelledby="device-mode-title">
      <div className="device-mode-card">
        <header className="device-mode-header">
          <span className="device-mode-brand">DANA QUEST</span>
          <h2 id="device-mode-title">{t('Chọn chế độ trải nghiệm', 'Choose your experience')}</h2>
          <p>
            {t(
              'Bạn muốn khám phá Đà Nẵng theo giao diện nào? Bạn luôn có thể đổi lại trong Cài đặt tài khoản.',
              'How would you like to explore Da Nang? You can always change this in Account Settings.'
            )}
          </p>
        </header>

        <div className="device-mode-options" role="radiogroup" aria-label={t('Chọn thiết bị', 'Select device mode')}>
          {/* Chế độ Máy tính / Web */}
          <div
            className={`device-mode-option ${selected === 'desktop' ? 'active' : ''}`}
            role="radio"
            aria-checked={selected === 'desktop'}
            tabIndex={0}
            onClick={() => setSelected('desktop')}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                setSelected('desktop')
              }
            }}
          >
            <div className="device-mode-icon-circle">💻</div>
            <div className="device-mode-info">
              <div className="device-mode-option-title">
                <strong>{t('Chơi trên máy tính (Web)', 'Desktop (Web layout)')}</strong>
                {recommended === 'desktop' && (
                  <span className="device-mode-rec-tag">{t('Gợi ý cho máy bạn', 'Recommended for you')}</span>
                )}
              </div>
              <p>
                {t(
                  'Bố cục màn hình rộng, bảng điều khiển và bản đồ song song, tối ưu thao tác chuột và bàn phím.',
                  'Wide screen layout, side-by-side atlas panels, optimized for keyboard and mouse.'
                )}
              </p>
            </div>
            <span className="device-mode-radio-mark" aria-hidden="true" />
          </div>

          {/* Chế độ Điện thoại / Mobile */}
          <div
            className={`device-mode-option ${selected === 'mobile' ? 'active' : ''}`}
            role="radio"
            aria-checked={selected === 'mobile'}
            tabIndex={0}
            onClick={() => setSelected('mobile')}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                setSelected('mobile')
              }
            }}
          >
            <div className="device-mode-icon-circle">📱</div>
            <div className="device-mode-info">
              <div className="device-mode-option-title">
                <strong>{t('Chơi trên điện thoại (Mobile)', 'Mobile App layout')}</strong>
                {recommended === 'mobile' && (
                  <span className="device-mode-rec-tag">{t('Gợi ý cho máy bạn', 'Recommended for you')}</span>
                )}
              </div>
              <p>
                {t(
                  'Bố cục di động ngón tay cái, bản đồ toàn màn hình, thanh điều hướng đáy và bảng vuốt kéo tiện lợi.',
                  'One-thumb navigation, full-screen map, bottom navigation bar, and swipeable bottom sheets.'
                )}
              </p>
            </div>
            <span className="device-mode-radio-mark" aria-hidden="true" />
          </div>
        </div>

        <footer className="device-mode-footer">
          <button
            type="button"
            className="device-mode-confirm-btn"
            onClick={handleConfirm}
          >
            {t('Xác nhận & Bắt đầu', 'Confirm & Start')}
          </button>
        </footer>
      </div>
    </div>
  )
}
