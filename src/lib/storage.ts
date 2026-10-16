import { notify } from './notifications'
import { hasSyncAccount, loadAccountProgress, resetAccountProgress, saveAccountAction } from './accountSync'
import { isDestinationComplete } from './rules'
import { newState, readState, updateProgress, type ProgressAction, type ProgressState } from './progress'

let database: Promise<IDBDatabase> | undefined
export function openDatabase(): Promise<IDBDatabase> {
  if (!database) database = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Trình duyệt không hỗ trợ lưu dữ liệu cục bộ.')); return }
    const request = indexedDB.open('dana-quest-local', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('state')
      request.result.createObjectStore('photos', { keyPath: 'id' })
    }
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); database = undefined }
      resolve(request.result)
    }
    request.onerror = () => { database = undefined; reject(new Error('Không mở được bộ nhớ cục bộ. Hãy kiểm tra quyền lưu trữ của trình duyệt.')) }
    request.onblocked = () => { database = undefined; reject(new Error('Hãy đóng các tab DANA QUEST khác rồi tải lại.')) }
  })
  return database
}

export async function loadProgress(): Promise<ProgressState> {
  if (hasSyncAccount()) return loadAccountProgress()
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction('state').objectStore('state').get('main')
    request.onsuccess = () => { try { resolve(readState(request.result)) } catch (error) { reject(error) } }
    request.onerror = () => reject(new Error('Không đọc được tiến độ đã lưu.'))
  })
}

// Đặt lại tiến độ khi dữ liệu đã lưu bị hỏng. Bản sao dữ liệu hỏng được giữ
// lại (khóa `main-corrupt-<thời điểm>` trên trình duyệt, file `.corrupt-*`
// trên máy chủ) để có thể khôi phục thủ công. Ảnh đã lưu không bị xóa.
export async function resetProgressData(): Promise<ProgressState> {
  if (hasSyncAccount()) return resetAccountProgress()
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('state', 'readwrite')
    const store = transaction.objectStore('state')
    const request = store.get('main')
    request.onsuccess = () => {
      try {
        store.put(request.result ?? null, `main-corrupt-${Date.now()}`)
        store.put(newState(), 'main')
      } catch (error) { reject(error) }
    }
    request.onerror = () => reject(new Error('Không đọc được dữ liệu cũ để sao lưu.'))
    transaction.oncomplete = () => resolve(newState())
    transaction.onabort = () => reject(new Error('Không đặt lại được tiến độ. Hãy thử lại.'))
  })
}

export async function saveAction(action: ProgressAction): Promise<ProgressState> {
  if (hasSyncAccount()) return saveAccountAction(action)
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['state', 'photos'], 'readwrite')
    const store = transaction.objectStore('state')
    const request = store.get('main')
    let result: ProgressState
    let failure: unknown
    const messages: string[] = []
    request.onsuccess = () => {
      const photoRequest = transaction.objectStore('photos').get(`${action.destinationId}:${action.missionId}`)
      photoRequest.onsuccess = () => {
        try {
          const previous = readState(request.result)
          result = updateProgress(previous, action, Boolean(photoRequest.result?.blob))
          if (result !== previous) {
            if (action.type === 'assign') messages.push(`Đã giao ${action.count} nhiệm vụ. Danh sách đã được lưu.`)
            if (action.type === 'cancel') messages.push('Đã hủy hành trình tại điểm đến.')
            if (action.type === 'redeem') messages.push('Đã đổi voucher demo thành công.')
            if (action.type === 'complete') {
              messages.push('Đã hoàn thành nhiệm vụ! +10 Green Coins demo.')
              const before = previous.destinations[action.destinationId!]
              const after = result.destinations[action.destinationId!]
              if (!isDestinationComplete(before) && isDestinationComplete(after)) messages.push('Chúc mừng! Bạn đã hoàn thành điểm đến.')
            }
          }
          store.put(result, 'main')
        }
        catch (error) { failure = error; transaction.abort() }
      }
    }
    transaction.oncomplete = () => { if (typeof window !== 'undefined') messages.forEach(notify); resolve(result) }
    transaction.onabort = () => reject(failure ?? new Error('Không lưu được tiến độ. Có thể bộ nhớ đã đầy; thay đổi chưa được ghi nhận.'))
    transaction.onerror = () => { /* onabort reports the failed transaction */ }
  })
}

