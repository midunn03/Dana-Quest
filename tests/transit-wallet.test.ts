import { test, expect } from 'vitest'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAuthApi } from '../server/auth.mjs'

test('transit claim credits coins to wallet and prevents fraud', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dana-transit-test-'))
  const api = createAuthApi({ file: join(dir, 'accounts.json') })
  const server = createServer((req, res) => api(req, res, () => { res.statusCode = 404; res.end() }))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

  try {
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/auth`
    let cookie = '', owner = ''

    const request = (path: string, body?: unknown) =>
      fetch(base + path, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-Dana-User': owner },
        body: body ? JSON.stringify(body) : undefined,
      })

    // 1. Phải đăng nhập mới được nhận thưởng
    const unauth = await request('/transit/claim', { stationId: 'tngo-bao-tang-cham' })
    expect(unauth.status).toBe(401)

    // Đăng ký tài khoản
    const reg = await request('/register', { username: 'transit-tester', password: 'secure-password-123' })
    cookie = reg.headers.get('set-cookie')!.split(';')[0]
    owner = (await reg.json()).user.id

    // Ban đầu ví có 0 xu
    const w0 = await (await request('/wallet')).json()
    expect(w0.balance).toBe(0)

    // 2. Chống gian lận: Mô phỏng không bao giờ được nhận
    const simRes = await request('/transit/claim', {
      stationId: 'tngo-bao-tang-cham',
      coordinates: [16.0598, 108.2230],
      accuracy: 10,
      dwellSeconds: 65,
      simulating: true,
    })
    expect(simRes.status).toBe(403)
    expect((await simRes.json()).code).toBe('SIMULATION_BLOCKED')

    // 3. Chống gian lận: Ở quá xa (> 80m)
    const farRes = await request('/transit/claim', {
      stationId: 'tngo-bao-tang-cham',
      coordinates: [16.0650, 108.2230], // cách ~580m
      accuracy: 10,
      dwellSeconds: 65,
      simulating: false,
    })
    expect(farRes.status).toBe(400)
    expect((await farRes.json()).code).toBe('TOO_FAR')

    // 4. Chống gian lận: Sai số GPS quá lớn (> 50m)
    const accRes = await request('/transit/claim', {
      stationId: 'tngo-bao-tang-cham',
      coordinates: [16.0598, 108.2230],
      accuracy: 80,
      dwellSeconds: 65,
      simulating: false,
    })
    expect(accRes.status).toBe(400)
    expect((await accRes.json()).code).toBe('ACCURACY_TOO_LOW')

    // 5. Chống gian lận: Chưa đủ thời gian lưu lại (< 60s)
    const dwellRes = await request('/transit/claim', {
      stationId: 'tngo-bao-tang-cham',
      coordinates: [16.0598, 108.2230],
      accuracy: 15,
      dwellSeconds: 30,
      simulating: false,
    })
    expect(dwellRes.status).toBe(400)
    expect((await dwellRes.json()).code).toBe('DWELL_TOO_SHORT')

    // 6. Nhận thưởng hợp lệ: Tọa độ đúng (trong 80m), độ chính xác <= 50m, dwell >= 60s
    const validClaim = await request('/transit/claim', {
      stationId: 'tngo-bao-tang-cham',
      coordinates: [16.0598, 108.2230],
      accuracy: 15,
      dwellSeconds: 65,
      simulating: false,
    })
    expect(validClaim.status).toBe(200)
    const claimData = await validClaim.json()
    expect(claimData.success).toBe(true)
    expect(claimData.bonusCoins).toBe(5)
    expect(claimData.balance).toBe(5)

    // Ví chính thực sự tăng 5 xu
    const w1 = await (await request('/wallet')).json()
    expect(w1.balance).toBe(5)
    expect(w1.entries.some((e: { source: string; amount: number }) => e.source.startsWith('transit:tngo-bao-tang-cham:') && e.amount === 5)).toBe(true)

    // 7. Chống gian lận: Không được nhận lặp trạm đã nhận trong ngày
    const dupRes = await request('/transit/claim', {
      stationId: 'tngo-bao-tang-cham',
      coordinates: [16.0598, 108.2230],
      accuracy: 15,
      dwellSeconds: 70,
      simulating: false,
    })
    expect(dupRes.status).toBe(409)
    expect((await dupRes.json()).code).toBe('ALREADY_CLAIMED_TODAY')

    // Số xu vẫn giữ nguyên là 5 (không tăng lần 2)
    const w2 = await (await request('/wallet')).json()
    expect(w2.balance).toBe(5)

    // 8. Nhận thêm trạm khác trong ngày -> số xu tiếp tục tăng
    const validClaim2 = await request('/transit/claim', {
      stationId: 'tngo-cong-vien-apec',
      coordinates: [16.0585, 108.2227],
      accuracy: 12,
      dwellSeconds: 62,
      simulating: false,
    })
    expect(validClaim2.status).toBe(200)
    expect((await validClaim2.json()).balance).toBe(10)

    const w3 = await (await request('/wallet')).json()
    expect(w3.balance).toBe(10)
  } finally {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
    await rm(dir, { recursive: true, force: true })
  }
})
