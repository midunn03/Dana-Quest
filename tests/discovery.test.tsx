import {setLocale} from '../src/i18n/locale'
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MainNavigation from '../src/MainNavigation'
import DiscoveryPage from '../src/DiscoveryPage'

vi.mock('../src/lib/useProgress', () => ({ useProgress: () => ({ state: { destinations: { 'cau-rong': { started: true, selected: ['arrival', 'a', 'b', 'c', 'd'], completed: ['arrival'] } } }, loading: false, error: '' }) }))
const questStatus=vi.hoisted(()=>({error:'',loading:false}))
vi.mock('../src/lib/useQuestProgress', () => ({ useQuestProgress: () => ({ state: { quests: {} },...questStatus }) }))
afterEach(()=>{setLocale('vi');cleanup();questStatus.error='';questStatus.loading=false})

it('provides five destinations in the requested order and tracks selected pages', () => {
  render(<MainNavigation route="#/tim-kiem" />)
  const links = screen.getAllByRole('link')
  expect(links.map(link => link.getAttribute('href'))).toEqual(['#/kham-pha', '#/su-kien', '#/tim-kiem', '#/quest-cua-toi', '#/tai-khoan'])
  expect(screen.getByRole('link', { name: 'Tìm kiếm' }).getAttribute('aria-current')).toBe('page')
})

it('searches real destinations without requiring accents and preserves the map link', async () => {
  render(<DiscoveryPage mode="search" />)
  await userEvent.type(screen.getByRole('searchbox'), 'cau rong')
  expect(screen.getByRole('link', { name: /Cầu Rồng/ }).getAttribute('href')).toBe('#/quest/cau-rong')
  expect(screen.queryByRole('link', { name: /Cầu Sông Hàn/ })).toBeNull()
  expect(screen.getByRole('link', { name: /Bản đồ/ }).getAttribute('href')).toBe('#/map')
  await userEvent.clear(screen.getByRole('searchbox'))
  await userEvent.type(screen.getByRole('searchbox'), 'zzzznothing')
  expect(screen.getByText('Không tìm thấy quest phù hợp.')).toBeTruthy()
})

it('shows only joined quests and retains shortcuts to existing utilities', () => {
  render(<DiscoveryPage mode="joined" />)
  expect(screen.getByRole('link', { name: /Cầu Rồng/ }).getAttribute('href')).toBe('#/quest/cau-rong')
  expect(screen.queryByRole('link', { name: /Cầu Sông Hàn/ })).toBeNull()
  expect(screen.getByRole('link', { name: 'Thư viện ảnh' }).getAttribute('href')).toBe('#/album')
  expect(screen.getByRole('link', { name: 'Cửa hàng đổi xu' }).getAttribute('href')).toBe('#/cua-hang')
})
it('shows a quest sync failure instead of silently hiding the DUE run',()=>{
 questStatus.error='Chưa tải được tiến độ quest trên máy chủ.'
 render(<DiscoveryPage mode="joined"/>)
 expect(screen.getByRole('alert').textContent).toContain(questStatus.error)
})

it('translates every quest card action when using English',()=>{
 setLocale('en');const view=render(<DiscoveryPage/> )
 expect(screen.getAllByText('View quest').length).toBeGreaterThan(0)
 expect(screen.queryByText('Xem quest')).toBeNull()
 setLocale('vi');view.rerender(<DiscoveryPage/> )
 expect(screen.getAllByText('Xem quest').length).toBeGreaterThan(0)
 expect(screen.queryByText('View quest')).toBeNull()
})
