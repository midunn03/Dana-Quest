import './Discovery.css'
import { t } from './i18n/locale'
import {requestLogin} from './lib/authPrompt'
import {NavigationIcon} from './MainNavigation'
export default function QuestGuestPage(){return <main className="discovery-page" aria-labelledby="guest-quest-title"><header className="discovery-header"><span className="city-pill">{t("Đà Nẵng")}</span></header><div className="discovery-title-row"><div><h1 id="guest-quest-title">{t("Quest của bạn")}</h1><p>{t("Những hành trình đã tham gia, ở cùng một nơi.")}</p></div></div><section className="discovery-empty"><NavigationIcon kind="quests"/><h2>{t("Hành trình đầu tiên đang chờ bạn")}</h2><p>{t("Đăng nhập để xem các quest đã tham gia, tiếp tục hành trình và lưu tiến độ của bạn.")}</p><button className="ev-primary" onClick={requestLogin}>{t("Đăng nhập hoặc tạo tài khoản")}</button><a href="#/kham-pha">{t("Khám phá các quest")}</a></section></main>}
