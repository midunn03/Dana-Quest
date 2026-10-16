import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { openDatabase, loadProgress, saveAction } from '../src/lib/storage'
import { coinBalance } from '../src/lib/progress'
import { loadPhotos, savePhoto, photoKey } from '../src/lib/photos'

beforeEach(async () => {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['state', 'photos'], 'readwrite')
    tx.objectStore('state').clear(); tx.objectStore('photos').clear()
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error)
  })
})
async function start(destinationId = 'cau-rong') {
  await saveAction({ type: 'assign', destinationId, count: 10 })
}

describe('Persistent and atomic local state', () => {
  it('keeps selections and progress when re-read; destinations remain independent', async () => {
    await start('cho-han')
    await saveAction({ type: 'complete', destinationId: 'cho-han', missionId: 'read' })
    await savePhoto({ id: photoKey('cho-han', 'overview-photo'), destinationId: 'cho-han', missionId: 'overview-photo', blob: new Blob(['historic-photo'], { type: 'image/jpeg' }), createdAt: Date.now() })
    const loaded = await loadProgress()
    expect(loaded.destinations['cho-han'].selected).toHaveLength(10)
    expect(loaded.destinations['cho-han'].completed).toEqual(['read'])
    expect(loaded.destinations['cau-rong']).toBeUndefined()
    expect(coinBalance(loaded)).toBe(10)
    expect((await loadPhotos()).map(photo => photo.destinationId)).toEqual(['cho-han'])
  })
  it('serializes double completion and concurrent voucher exchange without duplicate awards or overspending', async () => {
    await start()
    await Promise.all(Array.from({ length: 4 }, () => saveAction({ type: 'complete', destinationId: 'cau-rong', missionId: 'read' })))
    expect(coinBalance(await loadProgress())).toBe(10)
    await expect(saveAction({ type: 'redeem', rewardId: 'postcard' })).rejects.toThrow('Chưa đủ')
    for (const missionId of ['observe', 'learn', 'walk', 'respect']) await saveAction({ type: 'complete', destinationId: 'cau-rong', missionId })
    const exchanges = await Promise.allSettled([saveAction({ type: 'redeem', rewardId: 'postcard' }), saveAction({ type: 'redeem', rewardId: 'drink' })])
    expect(exchanges.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    let loaded = await loadProgress()
    expect(loaded.redemptions).toHaveLength(1)
    expect(coinBalance(loaded)).toBe(20)
    await expect(saveAction({ type: 'redeem', rewardId: 'postcard' })).rejects.toThrow('đã đổi')
    loaded = await loadProgress()
    expect(coinBalance(loaded)).toBe(20)
  })
  it('requires saved photo, keeps the blob after reading again, awards only on manual completion', async () => {
    await start()
    const action = { type: 'complete' as const, destinationId: 'cau-rong', missionId: 'overview-photo' }
    await expect(saveAction(action)).rejects.toThrow('Hãy lưu ảnh')
    const photo = { id: photoKey('cau-rong', 'overview-photo'), destinationId: 'cau-rong', missionId: 'overview-photo', blob: new Blob(['sample'], { type: 'image/jpeg' }), createdAt: Date.now() }
    await savePhoto(photo)
    expect(coinBalance(await loadProgress())).toBe(0)
    const [loaded] = await loadPhotos()
    expect(await loaded.blob.text()).toBe('sample')
    await saveAction(action)
    await saveAction(action)
    expect(coinBalance(await loadProgress())).toBe(10)
    await expect(savePhoto(photo)).rejects.toThrow('đang thực hiện')
  })
  it('does not allow inaccurate arrival evidence to be saved as completion', async () => {
    await start()
    const action = { type: 'complete' as const, destinationId: 'cau-rong', missionId: 'arrival' }
    await expect(saveAction({ ...action, location: { latitude: 16.0611, longitude: 108.2275, accuracy: 500, timestamp: Date.now() } })).rejects.toThrow('Vị trí')
    expect(coinBalance(await loadProgress())).toBe(0)
    await saveAction({ ...action, location: { latitude: 16.0611, longitude: 108.2275, accuracy: 10, timestamp: Date.now() } })
    expect(coinBalance(await loadProgress())).toBe(10)
  })
})

