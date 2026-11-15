import { t } from './i18n/locale'
import { useEffect, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallAppCard() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  useEffect(() => {
    const available = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent) }
    const complete = () => { setInstalled(true); setPrompt(null) }
    window.addEventListener('beforeinstallprompt', available)
    window.addEventListener('appinstalled', complete)
    return () => { window.removeEventListener('beforeinstallprompt', available); window.removeEventListener('appinstalled', complete) }
  }, [])
  async function install() {
    if (!prompt) return
    await prompt.prompt()
    if ((await prompt.userChoice).outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }
  return <section className="install-card" aria-label={t("Cài DANA QUEST")}>
    <div><strong>{installed ? t("DANA QUEST đã ở chế độ ứng dụng") : t("Cài DANA QUEST trên điện thoại")}</strong><p>{installed ? t("Bạn đang dùng bản toàn màn hình.") : ios ? t("Trong Safari, chọn Chia sẻ rồi “Thêm vào Màn hình chính”.") : prompt ? t("Cài trực tiếp từ trình duyệt, không cần App Store hoặc Google Play.") : t("Mở menu trình duyệt và chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.")}</p></div>
    {prompt && !installed && <button type="button" onClick={() => void install()}>{t("Cài ứng dụng")}</button>}
  </section>
}

