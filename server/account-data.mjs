import { mkdir, readFile, writeFile, rename, unlink, readdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { applyGameAction, readGameState } from './game-logic.mjs'

const error = (status, message) => Object.assign(new Error(message), { status })
const empty = () => ({ revision: 0, state: { version: 1, destinations: {}, redemptions: [] }, photos: [] })
const photoMeta = photo => ({ id: photo.id, destinationId: photo.destinationId, missionId: photo.missionId, createdAt: photo.createdAt })
export function createAccountData(directory) {
  let queue = Promise.resolve()
  const filename = id => join(directory, `${id}.json`)
  async function read(id, photosMode = 'meta') {
    let raw
    try { raw = await readFile(filename(id), 'utf8') }
    catch (cause) { if (cause.code === 'ENOENT') return empty(); throw cause }
    let data
    try { data = JSON.parse(raw) }
    catch { throw error(422, 'Dữ liệu đã lưu trên máy chủ bị hỏng. Bạn có thể đặt lại tiến độ từ ứng dụng; bản sao dữ liệu hỏng được giữ lại.') }
    if (!data || !Number.isInteger(data.revision) || data.revision < 0 || !Array.isArray(data.photos)) throw error(422, 'Dữ liệu đã lưu không hợp lệ. Chưa ghi đè dữ liệu cũ.')
    data.state = readGameState(data.state)
    if (photosMode !== 'full' && Array.isArray(data.photos)) data.photos = data.photos.map(photoMeta)
    return data
  }
  // Puts aside a corrupted save and starts over. Refuses when the stored data
  // is healthy so a reset can never silently discard valid progress.
  async function reset(id) {
    let raw = null
    try { raw = await readFile(filename(id), 'utf8') }
    catch (cause) { if (cause.code !== 'ENOENT') throw cause }
    let parsed = null
    if (raw !== null) { try { parsed = JSON.parse(raw) } catch { parsed = null } }
    let healthy = false
    try { readGameState(parsed?.state); healthy = Number.isInteger(parsed?.revision) && parsed.revision >= 0 && Array.isArray(parsed.photos) } catch { /* Keep the original record in the recovery backup below. */ }
    if (healthy) throw error(400, 'Dữ liệu không bị hỏng, không cần đặt lại.')
    if (raw !== null) await writeFile(`${filename(id)}.corrupt-${Date.now()}`, raw, { mode: 0o600 })
    const fresh = empty()
    fresh.photos = Array.isArray(parsed?.photos) ? parsed.photos : []
    await mkdir(directory, { recursive: true })
    await writeFile(`${filename(id)}.tmp`, JSON.stringify(fresh), { mode: 0o600 })
    await rename(`${filename(id)}.tmp`, filename(id))
    return { revision: fresh.revision, state: fresh.state }
  }
  return { read, remove(id) {
    const task=queue.then(async()=>{
      const base=basename(filename(id))
      const files=await readdir(directory).catch(cause=>{if(cause.code==='ENOENT')return [];throw cause})
      await Promise.all(files.filter(name=>name===base||name===`${base}.tmp`||name.startsWith(`${base}.corrupt-`)).map(name=>unlink(join(directory,name))))
    })
    queue=task.catch(()=>{});return task
  }, update(id, input) {
    const result = queue.then(async () => {
      if (input.kind === 'reset') return reset(id)
      // Writes must use the complete record, never the lightweight UI projection.
      const current = await read(id, 'full')
      if (input.revision !== current.revision) throw error(409, 'Dữ liệu đã thay đổi trên thiết bị khác. Đang tải lại.')
      if (input.kind === 'action') {
        current.state = applyGameAction(current.state, input.action, current.photos)
      } else if (input.kind === 'photo') {
        const photo = input.photo
        const progress = current.state.destinations[photo?.destinationId]
        if (!photo || !['overview-photo', 'detail-photo'].includes(photo.missionId) || photo.id !== `${photo.destinationId}:${photo.missionId}` || !progress?.selected.includes(photo.missionId) || progress.completed.includes(photo.missionId)) throw error(400, 'Nhiệm vụ ảnh không hợp lệ hoặc đã hoàn thành.')
        if (typeof photo.data !== 'string' || photo.data.length > 4194304 || !/^[A-Za-z0-9+/]+={0,2}$/.test(photo.data)) throw error(400, 'Ảnh không hợp lệ hoặc quá lớn.')
        const bytes = Buffer.from(photo.data, 'base64')
        if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) throw error(400, 'Ảnh phải có định dạng JPEG.')
        current.photos = current.photos.filter(item => item.id !== photo.id)
        if (current.photos.length >= 40) throw error(400, 'Album đã đạt giới hạn 40 ảnh.')
        current.photos.push({ id: photo.id, destinationId: photo.destinationId, missionId: photo.missionId, createdAt: Date.now(), data: photo.data })
      } else if (input.kind === 'delete-photo') current.photos = current.photos.filter(item => item.id !== input.photoId)
      else if(input.kind==='clear-photos'){
        if(input.confirmation!=='XÓA ẢNH CŨ')throw error(400,'Cần xác nhận xóa ảnh cũ.')
        current.photos=[]
      }
      else throw error(400, 'Thao tác không hợp lệ.')
      current.revision++
      await mkdir(directory, { recursive: true })
      await writeFile(`${filename(id)}.tmp`, JSON.stringify(current), { mode: 0o600 })
      await rename(`${filename(id)}.tmp`, filename(id))
      return { revision: current.revision, state: current.state }
    })
    queue = result.catch(() => {})
    return result
  } }
}
