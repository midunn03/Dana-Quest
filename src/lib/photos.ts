import { openDatabase } from './storage'
import { hasSyncAccount, loadAccountPhotos, saveAccountPhoto, deleteAccountPhoto } from './accountSync'
import { readState } from './progress'
import { getDestination } from '../data/destinations'
import { getMissions } from '../data/missions'

export interface LocalPhoto { id: string; destinationId: string; missionId?: string; blob: Blob; createdAt?: number }
export const photoKey = (destinationId: string, missionId: string) => `${destinationId}:${missionId}`

export async function preparePhoto(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Hãy chọn ảnh JPG, PNG hoặc WebP. Ảnh HEIC cần chuyển sang JPG trước.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Ảnh quá lớn. Hãy chọn ảnh tối đa 10 MB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Không đọc được ảnh. Hãy chọn tệp ảnh khác.')); image.src = url })
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Trình duyệt không xử lý được ảnh.')
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Không xử lý được ảnh.')), 'image/jpeg', 0.82))
    if (blob.size > 3 * 1024 * 1024) throw new Error('Ảnh sau xử lý vẫn quá lớn. Hãy chọn ảnh nhỏ hơn.')
    return blob
  } finally { URL.revokeObjectURL(url) }
}

export async function savePhoto(photo: LocalPhoto): Promise<void> {
  const place = getDestination(photo.destinationId)
  const missionId = photo.missionId
  if (!place || !missionId || getMissions(place).find(item => item.id === missionId)?.kind !== 'photo' || photo.id !== photoKey(photo.destinationId, missionId)) throw new Error('Nhiệm vụ ảnh không hợp lệ.')
  if (photo.blob.type !== 'image/jpeg' || photo.blob.size === 0 || photo.blob.size > 3 * 1024 * 1024) throw new Error('Ảnh không hợp lệ hoặc quá lớn.')
  if (hasSyncAccount()) return saveAccountPhoto(photo)
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos', 'state'], 'readwrite')
    const request = transaction.objectStore('state').get('main')
    let failure: unknown
    request.onsuccess = () => {
      try {
        const progress = readState(request.result).destinations[photo.destinationId]
        if (!progress?.started || !progress.selected.includes(missionId) || progress.completed.includes(missionId)) throw new Error('Chỉ lưu ảnh cho nhiệm vụ đã chọn, đang thực hiện.')
        transaction.objectStore('photos').put(photo)
      } catch (error) { failure = error; transaction.abort() }
    }
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(failure ?? new Error('Không lưu được ảnh. Có thể bộ nhớ trình duyệt đã đầy.'))
  })
}

export async function deletePhoto(photoId: string): Promise<void> {
  if (hasSyncAccount()) return deleteAccountPhoto(photoId)
  if (!photoId) throw new Error('Không tìm thấy ảnh cần xóa.')
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite')
    transaction.objectStore('photos').delete(photoId)
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(new Error('Không xóa được ảnh. Tiến độ và Green Coins chưa bị thay đổi.'))
    transaction.onerror = () => { /* onabort reports the failed transaction */ }
  })
}

export async function loadPhotos(): Promise<LocalPhoto[]> {
  if (hasSyncAccount()) return loadAccountPhotos()
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction('photos').objectStore('photos').getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Không đọc được album trên trình duyệt.'))
  })
}
