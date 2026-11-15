import { t } from './i18n/locale'
import { useWallet } from './lib/useWallet'

export default function QuestLinks() {
  const { wallet, loading, error } = useWallet()
  return <nav className="quest-links" aria-label={t("Tiện ích hành trình")}>
    <a href="#/map">{t("Bản đồ")}</a><a href="#/album">{t("Album ảnh")}</a><a href="#/cua-hang">{t("Cửa hàng đổi xu")}</a>
    <span>{loading ? t("Đang đọc xu…") : error ? t("Chưa đọc được số xu") : `${wallet.balance??'—'} ${t('Xu Dana','Dana Coins')}`}</span>
  </nav>
}
