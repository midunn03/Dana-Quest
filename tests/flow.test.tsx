// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { openDatabase, loadProgress, saveAction } from '../src/lib/storage'
import { coinBalance } from '../src/lib/progress'
import { destinations } from '../src/data/destinations'
import {mapEntries} from '../src/lib/mapEntries'
import {quests} from '../src/data/quests'

// These integration flows wait for lazy page modules, not a one-second performance budget.
configure({asyncUtilTimeout:10000})



beforeEach(async () => {
  localStorage.removeItem('dana-quest-progress-v2')
  vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.test')
  const testProfile = { id: 'test-user', name: 'Người thử', phone: '0900000000', email: 'test@example.invalid', avatarId: 'bien' }
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/session')) return { ok: true, status: 200, json: async () => ({ user: testProfile }) } as Response
    if (url.endsWith('/profile/avatar')) return { ok: true, status: 200, json: async () => ({ user: { ...testProfile, avatarId: JSON.parse(String(init?.body)).avatarId } }) } as Response
    if (url.startsWith('/api/recommendations/nearby')) return { ok: true, status: 200, json: async () => ({ items: destinations.slice(0, 3).map(place => ({ id: place.id, distanceKm: 0.2, highlightReason: place.highlightReason })) }) } as Response
    return { ok: true, status: 200, json: async () => ({ user: testProfile }) } as Response
  }))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  // jsdom has no layout engine; Leaflet needs nonzero dimensions for event coordinates.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 580, width: 800, height: 580, toJSON: () => ({}) })
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(580)
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(800)
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(580)
  const db = await openDatabase()
  await new Promise<void>(resolve => {
    const tx = db.transaction(['state', 'photos'], 'readwrite')
    tx.objectStore('state').clear(); tx.objectStore('photos').clear(); tx.oncomplete = () => resolve()
  })
  window.location.hash = '#/'
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('does not award coins when opening or reloading the demonstration celebration', async () => {
  window.location.hash = '#/hoan-thanh/demo'
  const view = render(<App />)
  await screen.findByText('Minh họa phần thưởng · không cộng xu')
  expect(coinBalance(await loadProgress())).toBe(0)
  view.unmount()
  render(<App />)
  await screen.findByText('Minh họa phần thưởng · không cộng xu')
  expect(coinBalance(await loadProgress())).toBe(0)
})

it('restores the session, navigates through map, plays the two-challenge Dragon Bridge quest, reloads and keeps device progress separate from the signed-in server wallet', async () => {
  window.location.hash='#/kham-pha'
  const user = userEvent.setup()
  const view = render(<App />)
  await screen.findByRole('heading', { name: 'Khám phá Đà Nẵng' })
  await user.click(screen.getByRole('link', { name: 'Bản đồ', exact: true }))
  await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })
  expect(screen.queryByText('Lọc khoảng cách')).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Khám phá Đà Nẵng' })).toBeNull()
  await waitFor(()=>expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))
  await user.type(screen.getByRole('searchbox'), 'cau rong')
  await waitFor(() => expect(document.querySelectorAll('.atlas-pin')).toHaveLength(mapEntries('quests','cau rong',Date.now()).length))
  await user.click(document.querySelector<HTMLButtonElement>('.atlas-list>button')!)
  await user.click(screen.getByRole('link',{name:'Xem chi tiết →'}))
  await user.click(await screen.findByRole('checkbox',{name:'Tôi đã đọc hướng dẫn và lưu ý an toàn.'},{timeout:10000}))
  await user.click(screen.getByRole('button',{name:'Đến điểm bắt đầu',exact:true}))
  await user.click(await screen.findByRole('button',{name:'Xác nhận đã đến',exact:true}))
  await user.click(screen.getByRole('button',{name:'Tôi đã đến đúng điểm này',exact:true}))
  await user.click(await screen.findByRole('link',{name:'Bắt đầu quest',exact:true}))
  await user.click(await screen.findByRole('button',{name:'Tiếp tục đến thử thách'}))
  await user.type(screen.getByRole('textbox'),'Cầu Rồng');await user.click(screen.getByRole('button',{name:'Kiểm tra đáp án'}))
  await user.click(await screen.findByRole('button',{name:'Tiếp tục câu chuyện'}));await user.click(screen.getByRole('button',{name:'Tiếp tục đến thử thách'}))
  await user.click(screen.getByRole('radio',{name:destinations.find(place=>place.id==='cau-rong')!.highlightReason,exact:true}));await user.click(screen.getByRole('button',{name:'Kiểm tra đáp án'}))
  await user.click(await screen.findByRole('button',{name:'Xem tổng kết'}));await screen.findByRole('heading',{name:'Hành trình đã hoàn thành'})
  view.unmount();render(<App/>);await screen.findByRole('heading',{name:'Hành trình đã hoàn thành'})
  await user.click(screen.getByRole('link',{name:'Trở lại Khám phá'}))
  // Historical currency remains redeemable after the gameplay upgrade.
  await saveAction({type:'assign',destinationId:'cau-rong',count:10})
  for(const missionId of ['read','observe','learn','walk','respect'])await saveAction({type:'complete',destinationId:'cau-rong',missionId})
  await user.click(within(screen.getByRole('navigation', { name: 'Điều hướng chính' })).getByRole('link', { name: 'Tài khoản' }))
  await user.click(within(screen.getByRole('navigation',{name:'Không gian tài khoản'})).getByRole('link', { name: 'Cửa hàng đổi xu' }))
  await screen.findByRole('heading', { name: 'Cửa hàng đổi xu' })
  // Device-only completions must never manufacture an account wallet balance.
  // Server-owned redemption and combined earnings are covered by wallet-api.test.
  await screen.findByRole('link',{name:'Đăng nhập',exact:true})
  expect(screen.getByRole('button',{name:'Đổi Đồ uống địa phương với 50 Xu Dana'}).hasAttribute('disabled')).toBe(true)
  expect(coinBalance(await loadProgress())).toBe(50)

}, 60000)

it('opens correct quest details from every map sidebar entry',async()=>{
 const user=userEvent.setup();window.location.hash='#/map';render(<App/>);
 await screen.findByRole('region',{name:'Bản đồ Đà Nẵng'})
 await waitFor(()=>expect(document.querySelectorAll('.atlas-list>button')).toHaveLength(quests.length))
 for(const [index,quest] of quests.entries()){
  await user.click(document.querySelectorAll<HTMLButtonElement>('.atlas-list>button')[index])
  const selection=document.querySelector('.atlas-selection') as HTMLElement
  expect(within(selection).getByRole('heading',{name:quest.title})).toBeTruthy()
  expect(within(selection).getByRole('link',{name:'Xem chi tiết →'}).getAttribute('href')).toBe(`#/quest/${quest.id}`)
  await user.click(within(selection).getByRole('button',{name:'Đóng'}))
  expect(document.querySelector('.atlas-selection')).toBeNull()
 }
},60000)
it('remounts a single map in StrictMode and keeps sidebar usable when tiles fail',async()=>{
 const user=userEvent.setup();window.location.hash='#/map';render(<StrictMode><App/></StrictMode>)
 await screen.findByRole('region',{name:'Bản đồ Đà Nẵng'})
 await waitFor(()=>expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))
 expect(document.querySelectorAll('.leaflet-control-attribution')).toHaveLength(1)
 const tile=document.querySelector('.leaflet-tile');expect(tile).toBeTruthy();fireEvent.error(tile!)
 expect((await screen.findByRole('alert')).textContent).toContain('Nền bản đồ chưa tải đầy đủ')
 expect(document.querySelectorAll('.atlas-list>button')).toHaveLength(quests.length)
 await user.click(screen.getByRole('button',{name:'Thử lại'}))
 await waitFor(()=>expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))
 expect(document.querySelectorAll('.leaflet-control-attribution')).toHaveLength(1)
 await user.click(document.querySelector<HTMLButtonElement>('.atlas-list>button')!)
 expect(document.querySelector('.atlas-selection')).toBeTruthy()
 await user.click(screen.getByRole('button',{name:'Đóng'}))
 await user.click(within(screen.getByRole('navigation',{name:'Điều hướng chính'})).getByRole('link',{name:'Khám phá'}))
 await user.click(await screen.findByRole('link',{name:'Bản đồ',exact:true}))
 await screen.findByRole('region',{name:'Bản đồ Đà Nẵng'})
 await waitFor(()=>expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))
})
