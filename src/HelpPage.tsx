// [UX-FLOW] Trang Hướng dẫn chơi Dana Quest (#/huong-dan)
import './HelpPage.css'
import { t } from './i18n/locale'
import PixelLogo from './PixelLogo'

export default function HelpPage() {
  return (
    <main className="help-page" aria-labelledby="help-title">
      <header className="help-header">
        <a href="#/map" className="help-back-link">
          ← {t('Bản đồ', 'Map')}
        </a>
        <a href="#/kham-pha" className="help-back-link">
          {t('Khám phá', 'Discover')}
        </a>
        <PixelLogo compact />
      </header>

      <article className="help-content">
        <h1 id="help-title">{t('Hướng dẫn chơi Dana Quest', 'How to Play Dana Quest')}</h1>
        <p className="help-subtitle">
          {t(
            'Khám phá vẻ đẹp Đà Nẵng qua những bước chân, câu đố và câu chuyện lịch sử - văn hóa.',
            'Discover Da Nang through footsteps, riddles, and cultural stories.'
          )}
        </p>

        {/* 2 Kiểu chơi */}
        <section className="help-section">
          <h2>{t('1. Hai kiểu chơi chính trong game', '1. Two Game Modes')}</h2>
          <div className="help-grid-two">
            <div className="help-card story-card">
              <div className="help-badge story-badge">✦ {t('Quest cốt truyện', 'Story Quest')}</div>
              <h3>{t('Chơi theo tuyến câu chuyện', 'Story-driven Adventure')}</h3>
              <p>
                {t(
                  'Hóa thân thành nhân vật, lần theo các manh mối tại địa điểm thực tế (ví dụ: Cầu Rồng, DUE). Giải từng thử thách để mở chương tiếp theo.',
                  'Step into a role, follow clues at real locations. Solve each checkpoint riddle to unlock the next chapter.'
                )}
              </p>
              <ul>
                <li>⏱ {t('Thời lượng: ~20 - 45 phút', 'Duration: ~20 - 45 mins')}</li>
                <li>🎯 {t('Cách chơi: Đến trạm → Giải đố → Mở khóa tiếp', 'How to play: Reach stop → Solve puzzle → Unlock next')}</li>
                <li>🎁 {t('Thưởng: XP nhân vật + Xu Dana dồi dào', 'Reward: Character XP + Dana Coins')}</li>
              </ul>
            </div>

            <div className="help-card place-card">
              <div className="help-badge place-badge">◆ {t('Địa điểm có nhiệm vụ', 'Destination Missions')}</div>
              <h3>{t('Khám phá 15 danh thắng Đà Nẵng', 'Explore 15 Da Nang Landmarks')}</h3>
              <p>
                {t(
                  'Tự do đến các địa điểm du lịch nổi tiếng (Bà Nà, Chùa Linh Ứng, Ngũ Hành Sơn...). Tự chọn 5-10 nhiệm vụ nhỏ để trải nghiệm.',
                  'Freely visit famous spots (Ba Na, Linh Ung, Marble Mountains...). Pick 5-10 mini missions to complete at your own pace.'
                )}
              </p>
              <ul>
                <li>⏱ {t('Thời lượng: Tự do, không giới hạn giờ', 'Duration: Flexible, explore at leisure')}</li>
                <li>🎯 {t('Cách chơi: Check-in GPS, chụp ảnh kỷ niệm, câu hỏi', 'How to play: GPS check-in, souvenir photo, quiz')}</li>
                <li>🎁 {t('Thưởng: 10 Xu Dana cho mỗi nhiệm vụ hoàn thành', 'Reward: 10 Dana Coins per completed mission')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cách nhận xu & đổi quà */}
        <section className="help-section">
          <h2>{t('2. Nhận xu & Đổi quà', '2. Coins & Rewards')}</h2>
          <div className="help-card reward-card">
            <p>
              {t(
                'Mỗi khi hoàn thành thử thách hoặc nhiệm vụ, bạn sẽ được thưởng Xu Dana vào Ví hành trình. Bạn có thể dùng xu này tại Cửa hàng đổi xu để lấy các phần quà hấp dẫn và voucher ưu đãi.',
                'Completing challenges earns Dana Coins in your Travel Wallet. Redeem your coins at the Coin Shop for vouchers and gifts.'
              )}
            </p>
            <div className="help-action-row">
              <a className="help-cta-btn" href="#/cua-hang">
                {t('Ghé Cửa hàng đổi xu', 'Visit Coin Shop')} ↗
              </a>
              <a className="help-cta-btn secondary" href="#/tai-khoan">
                {t('Xem ví của bạn', 'View Your Wallet')}
              </a>
            </div>
          </div>
        </section>

        {/* An toàn khi chơi */}
        <section className="help-section">
          <h2>{t('3. An toàn khi trải nghiệm ngoài phố', '3. Street Safety Rules')}</h2>
          <div className="help-card safety-card">
            <ul>
              <li>
                <strong>{t('Không nhìn màn hình khi băng qua đường:', 'Do not look at screens while crossing roads:')}</strong>{' '}
                {t('Luôn dừng lại ở khu vực an toàn để đọc câu hỏi và thao tác trên điện thoại.', 'Always stop in a safe spot to read puzzles.')}
              </li>
              <li>
                <strong>{t('Bảo quản tư trang cá nhân:', 'Protect your belongings:')}</strong>{' '}
                {t('Giữ chặt điện thoại khi chụp ảnh, chú ý túi xách ở nơi đông người.', 'Hold phone firmly and stay alert in crowds.')}
              </li>
              <li>
                <strong>{t('Tôn trọng không gian công cộng:', 'Respect public spaces:')}</strong>{' '}
                {t('Không vào khu vực cấm hoặc hạn chế tiếp cận. Giữ gìn cảnh quan chung.', 'Do not enter restricted areas. Keep surroundings clean.')}
              </li>
            </ul>
          </div>
        </section>

        {/* Bắt đầu chơi */}
        <section className="help-footer-action">
          <a className="help-start-play-btn" href="#/map">
            {t('Sẵn sàng rồi! Vào bản đồ chơi ngay', "Ready! Let's Go to the Map")} ↗
          </a>
        </section>
      </article>
    </main>
  )
}
