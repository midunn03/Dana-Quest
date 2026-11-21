import { interpolate, t } from './i18n/locale'
import { useEffect, useState } from 'react'
import { quests } from './data/quests'
import { useQuestProgress } from './lib/useQuestProgress'
import { useAuth } from './AuthContext'
import { accountPhotoCount, clearAccountPhotos } from './lib/accountSync'
import { displayText } from './lib/questDisplay'
import { preparePhoto } from './lib/photos'
import QuestCover from './QuestCover'
import ConfirmDialog from './ConfirmDialog'
import './QuestLibrary.css'

interface UserMemoryPhoto {
  id: string
  dataUrl: string
  questId?: string
  questTitle: string
  caption: string
  createdAt: number
  isSeeded?: boolean
}

interface SeededPhotoSpec {
  id: string
  file: string
  captionVi: string
  captionEn: string
  daysAgo: number
}

const SEEDED_ALBUM_PHOTOS: Record<string, SeededPhotoSpec[]> = {
  'due-dau-an-50-nam': [
    {
      id: 'seed-due-1',
      file: 'due-1.jpg',
      captionVi: 'Góc giảng đường và khuôn viên xanh ngày trải nghiệm',
      captionEn: 'Campus courtyard and lecture halls along the quest',
      daysAgo: 2,
    },
    {
      id: 'seed-due-2',
      file: 'due-2.jpg',
      captionVi: 'Khoảnh khắc check-in đáng nhớ trong sân trường DUE',
      captionEn: 'Memorable milestone check-in on the DUE campus',
      daysAgo: 2,
    },
    {
      id: 'seed-due-3',
      file: 'due-3.jpg',
      captionVi: 'Lối đi rợp bóng cây và nhịp sống sinh viên buổi sáng',
      captionEn: 'Shaded campus walkway and morning atmosphere',
      daysAgo: 2,
    },
  ],
  'bao-tang-da-nang': [
    {
      id: 'seed-bt-1',
      file: 'bao-tang-1.jpg',
      captionVi: 'Không gian kiến trúc Bảo tàng Đà Nẵng nhìn từ bên ngoài',
      captionEn: 'Da Nang Museum facade and surrounding grounds',
      daysAgo: 1,
    },
    {
      id: 'seed-bt-2',
      file: 'bao-tang-2.jpg',
      captionVi: 'Khu vực trưng bày hiện vật và dấu ấn lịch sử',
      captionEn: 'Inside the historical artifact and culture gallery',
      daysAgo: 1,
    },
    {
      id: 'seed-bt-3',
      file: 'bao-tang-3.jpg',
      captionVi: 'Nét kiến trúc di sản ngay tại khu vực tham quan',
      captionEn: 'Heritage architectural details around the museum site',
      daysAgo: 1,
    },
  ],
  'cau-rong': [
    {
      id: 'seed-cr-1',
      file: 'cau-rong-1.jpg',
      captionVi: 'Toàn cảnh Cầu Rồng vươn mình qua dòng sông Hàn',
      captionEn: 'Dragon Bridge spanning across the Han River',
      daysAgo: 3,
    },
    {
      id: 'seed-cr-2',
      file: 'cau-rong-2.jpg',
      captionVi: 'Sắc vàng rực rỡ bên sông khi phố lên đèn',
      captionEn: 'Golden skyline along the riverfront at twilight',
      daysAgo: 3,
    },
    {
      id: 'seed-cr-3',
      file: 'cau-rong-3.jpg',
      captionVi: 'Nhịp sống ven sông và bờ biển Đà Nẵng từ góc nhìn người đi bộ',
      captionEn: 'Vibrant riverfront and coastal atmosphere in Da Nang',
      daysAgo: 3,
    },
  ],
}

function readMemories(key: string): UserMemoryPhoto[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readDismissed(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error(t('Không đọc được ảnh.')))
    reader.onerror = () => reject(new Error(t('Không đọc được ảnh.')))
    reader.readAsDataURL(blob)
  })
}

export default function AlbumPage() {
  const { user } = useAuth()
  const { state, loading, error: progressError } = useQuestProgress()
  const [tab, setTab] = useState('all')
  const [oldCount, setOldCount] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const memoryKey = `dana-memory-gallery-v1:${user?.id || 'guest'}`
  const dismissedKey = `dana-memory-dismissed-v1:${user?.id || 'guest'}`
  const [memories, setMemories] = useState<UserMemoryPhoto[]>(() => readMemories(memoryKey))
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed(dismissedKey))
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [memoryError, setMemoryError] = useState('')

  useEffect(() => {
    setMemories(readMemories(memoryKey))
    setDismissed(readDismissed(dismissedKey))
  }, [memoryKey, dismissedKey])

  useEffect(() => {
    let alive = true
    if (user) {
      void accountPhotoCount()
        .then(count => {
          if (alive) setOldCount(count)
        })
        .catch(cause => {
          if (alive) setError(cause.message)
        })
    }
    return () => {
      alive = false
    }
  }, [user])

  const visible = quests.filter(
    q => tab === 'all' || (tab === 'started' && state.quests[q.id]) || (tab === 'completed' && state.quests[q.id]?.completedAt),
  )
  const activeAlbum = selectedAlbumId ? quests.find(q => q.id === selectedAlbumId) ?? null : null

  const photosForAlbum = (questId: string, questTitle: string): UserMemoryPhoto[] => {
    const uploaded = memories.filter(item => item.questId === questId || (!item.questId && item.questTitle === questTitle))
    const run = state.quests[questId]
    const seeds =
      run && SEEDED_ALBUM_PHOTOS[questId]
        ? SEEDED_ALBUM_PHOTOS[questId]
            .filter(seed => !dismissed.includes(seed.id))
            .map(seed => ({
              id: seed.id,
              dataUrl: `${import.meta.env.BASE_URL}photos/memories/${seed.file}`,
              questId,
              questTitle,
              caption: t(seed.captionVi, seed.captionEn),
              createdAt: (run.completedAt ?? run.startedAt ?? Date.now()) - seed.daysAgo * 86400000,
              isSeeded: true,
            }))
        : []
    return [...uploaded, ...seeds]
  }

  async function clear() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const count = await clearAccountPhotos()
      setOldCount(0)
      setConfirm(false)
      setNotice(
        interpolate('Đã xóa vĩnh viễn ${0} ảnh cũ của tài khoản này. Tiến độ và xu vẫn được giữ.', [count]),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Chưa xóa được ảnh.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleUpload(file?: File) {
    if (!file || uploading || !activeAlbum) return
    setUploading(true)
    setMemoryError('')
    try {
      const prepared = await preparePhoto(file)
      const dataUrl = await blobToDataUrl(prepared)
      const item: UserMemoryPhoto = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dataUrl,
        questId: activeAlbum.id,
        questTitle: displayText(activeAlbum.title),
        caption: caption.trim(),
        createdAt: Date.now(),
      }
      const next = [item, ...memories]
      try {
        localStorage.setItem(memoryKey, JSON.stringify(next))
      } catch {
        throw new Error(t('Bộ nhớ trình duyệt đã đầy, hãy xóa bớt ảnh cũ trước khi thêm mới.'))
      }
      setMemories(next)
      setCaption('')
    } catch (cause) {
      setMemoryError(cause instanceof Error ? cause.message : t('Chưa tải được ảnh lên.'))
    } finally {
      setUploading(false)
    }
  }

  function removeMemory(item: UserMemoryPhoto) {
    if (item.isSeeded) {
      const nextDismissed = [...dismissed, item.id]
      try {
        localStorage.setItem(dismissedKey, JSON.stringify(nextDismissed))
      } catch {}
      setDismissed(nextDismissed)
      return
    }
    const next = memories.filter(entry => entry.id !== item.id)
    try {
      localStorage.setItem(memoryKey, JSON.stringify(next))
    } catch {}
    setMemories(next)
  }

  if (activeAlbum) {
    const albumPhotos = photosForAlbum(activeAlbum.id, displayText(activeAlbum.title))
    return (
      <main className="library-page">
        <div className="library-frame">
          <header>
            <button
              type="button"
              className="dq-back-btn"
              onClick={() => {
                setSelectedAlbumId(null)
                setCaption('')
                setMemoryError('')
              }}
              aria-label={t('Về danh sách album')}
            >
              ← {t('Quay lại')}
            </button>
            <div>
              <h1>{displayText(activeAlbum.title)}</h1>
              <p>{displayText(activeAlbum.area)}</p>
            </div>
          </header>
          <section className="library-memories" aria-labelledby="library-album-detail-title">
            <div className="library-memories-head">
              <div>
                <h2 id="library-album-detail-title">
                  {t('Album ảnh kỷ niệm')} ({albumPhotos.length})
                </h2>
                <p>{t('Chỉ hiển thị ảnh thuộc địa điểm này. Bạn có thể tải ảnh mới lên hoặc lưu ảnh về máy.')}</p>
              </div>
            </div>
            <div className="library-upload-bar library-upload-bar--single">
              <input
                type="text"
                value={caption}
                onChange={event => setCaption(event.target.value)}
                placeholder={t('Ghi chú ngắn cho ảnh (tùy chọn)...')}
                maxLength={120}
              />
              <label className="library-upload-btn">
                {uploading ? t('Đang xử lý ảnh…') : t('📷 Tải ảnh lên album này')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={event => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    void handleUpload(file)
                  }}
                />
              </label>
            </div>
            {memoryError && (
              <p role="alert" className="library-memory-error">
                {memoryError}
              </p>
            )}
            {albumPhotos.length ? (
              <div className="library-memory-grid">
                {albumPhotos.map(item => (
                  <article className="library-memory-card" key={item.id}>
                    <img src={item.dataUrl} alt={item.caption || item.questTitle} loading="lazy" />
                    <div className="library-memory-body">
                      {item.caption && <p>{item.caption}</p>}
                      <small>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</small>
                      <div className="library-memory-actions">
                        <a href={item.dataUrl} download={`dana-quest-${activeAlbum.id}-${item.id}.jpg`}>
                          {t('⬇ Tải ảnh về')}
                        </a>
                        <button type="button" onClick={() => removeMemory(item)}>
                          {t('Xóa ảnh')}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="library-empty">
                <h2>{t('Album này chưa có ảnh nào')}</h2>
                <p>{t('Hãy bấm “📷 Tải ảnh lên album này” để lưu lại những khoảnh khắc tại đây.')}</p>
              </div>
            )}
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="library-page">
      <div className="library-frame">
        <header>
          <a className="ap-back dq-back-btn" href="#/tai-khoan" aria-label={t('Về tài khoản')}>
            ← {t('Quay lại')}
          </a>
          <div>
            <h1>{t('Thư viện kỷ niệm')}</h1>
            <p>{t('Chọn một địa điểm để xem album ảnh kỷ niệm và tải ảnh của bạn lên.')}</p>
          </div>
        </header>
        <nav aria-label={t('Lọc thư viện')}>
          {[
            ['all', t('Tất cả')],
            ['started', t('Đã bắt đầu')],
            ['completed', t('Hoàn thành')],
          ].map(([value, label]) => (
            <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>
              {label}
            </button>
          ))}
        </nav>
        {loading && <p role="status">{t('Đang tải tiến độ…')}</p>}
        {(error || progressError) && <p role="alert">{error || progressError}</p>}
        <div className="library-grid quest-cover-grid">
          {visible.map(quest => {
            const run = state.quests[quest.id]
            const albumCount = photosForAlbum(quest.id, displayText(quest.title)).length
            return (
              <button
                type="button"
                className="quest-cover-card library-card library-album-card"
                key={quest.id}
                onClick={() => setSelectedAlbumId(quest.id)}
              >
                <div className="quest-cover-media">
                  <QuestCover id={quest.id} />
                  <span className={`library-status-pill ${run?.completedAt ? 'is-done' : run ? 'is-active' : 'is-idle'}`}>
                    {run?.completedAt ? t('Đã hoàn thành') : run ? t('Đang khám phá') : t('Chưa bắt đầu')}
                  </span>
                  <span className="library-count-pill">
                    📷 {albumCount ? `${albumCount} ${t('ảnh', 'photos')}` : t('0 ảnh', '0 photos')}
                  </span>
                </div>
                <div className="quest-cover-body">
                  <h2>{displayText(quest.title)}</h2>
                  <p>{displayText(quest.area)}</p>
                  <div className="library-album-footer">
                    <span>{albumCount ? t('Xem album ảnh', 'View photo album') : t('Mở album ảnh', 'Open album')}</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        {!visible.length && !loading && (
          <section className="library-empty">
            <h2>{t('Chưa có hành trình trong mục này')}</h2>
            <p>{t('Chọn “Tất cả” để xem toàn bộ album địa điểm.')}</p>
            <button onClick={() => setTab('all')}>{t('Xem tất cả quest')}</button>
          </section>
        )}
        <section className="library-cleanup">
          <h2>{t('Ảnh cũ của tài khoản')}</h2>
          <p>
            {oldCount === null
              ? t('Đang kiểm tra ảnh cũ…')
              : oldCount
              ? interpolate('Có ${0} ảnh cũ vẫn lưu trên máy chủ. Ảnh không còn được hiển thị trong thư viện quest.', [oldCount])
              : t('Không còn ảnh cũ trong tài khoản.')}
          </p>
          {!!oldCount && (
            <button className="library-delete" disabled={busy} onClick={() => setConfirm(true)}>
              {t('Xóa vĩnh viễn ảnh cũ của tôi')}
            </button>
          )}
          {notice && <p role="status">{t(notice)}</p>}
        </section>
      </div>
      <ConfirmDialog
        open={confirm}
        title={t('Xóa vĩnh viễn ảnh cũ?')}
        message={interpolate(
          'Xóa ${0} ảnh của đúng tài khoản đang đăng nhập. Không khôi phục được ảnh qua ứng dụng. Ảnh bìa quest, tiến độ và phần thưởng được giữ nguyên.',
          [oldCount ?? 0],
        )}
        confirmLabel={t('Xóa vĩnh viễn ảnh cũ')}
        busy={busy}
        busyLabel={t('Đang xóa…')}
        tone="danger"
        onCancel={() => setConfirm(false)}
        onConfirm={() => void clear()}
      />
    </main>
  )
}
