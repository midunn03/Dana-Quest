import PixelLogo from './PixelLogo'
import PixelScene from './PixelScene'
import PixelAvatar from './PixelAvatar'
import { avatars, readAvatar } from './lib/avatar'
import './Onboarding.css'
export default function WelcomePage() {
  const avatar = readAvatar() ?? avatars[0]
  return <main className="onboarding welcome-screen">
    <section className="welcome-game" aria-labelledby="page-title">
      <div className="welcome-copy"><span className="game-kicker">XIN CHÀO, NHÀ KHÁM PHÁ!</span>
        <h1 id="page-title" className="game-logo" aria-label="DANA QUEST"><PixelLogo /></h1>
        <p>Khám phá Đà Nẵng<br />như một trò chơi.</p>
      </div>
      <div className="scenery"><PixelScene className="px-scene-bg" /><div className="welcome-explorer"><PixelAvatar avatar={avatar} /></div><span className="scene-label">ĐÀ NẴNG · VIỆT NAM</span></div>
      <div className="welcome-actions"><a className="game-button" href="#/dang-nhap">Khám phá ngay <span aria-hidden="true">→</span></a><a className="quiet-link" href="#/dang-ky">Tạo tài khoản</a><p>Mỗi bước chân, một kỷ niệm mới.</p></div>
    </section>
  </main>
}

