import {t} from './i18n/locale'
import './NotFoundPage.css'
export default function NotFoundPage(){return (<main className="not-found-page">
        <h1>{t("Không tìm thấy trang")}</h1>
        <p>{t("Liên kết này không hợp lệ. Bạn có thể quay về trang chủ hoặc chọn điểm đến trên bản đồ.")}</p>
        <nav className="quest-nav" aria-label={t("Quay lại khám phá")}>
          <a href="#/">{t("Về trang chủ")}</a>
          <a href="#/map">{t("Mở bản đồ")}</a>
        </nav>
      </main>)}
