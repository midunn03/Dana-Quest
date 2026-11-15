// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import QuestPlayPage from '../src/QuestPlayPage'
import { newQuestState, updateQuestProgress } from '../src/lib/questProgress'
import { setSyncAccount } from '../src/lib/accountSync'
import { setLocale } from '../src/i18n/locale'

afterEach(() => { cleanup(); localStorage.clear(); setSyncAccount(null); setLocale('vi') })
function start() {
  setSyncAccount(null)
  const started = updateQuestProgress(newQuestState(), { type:'start', questId:'due-dau-an-50-nam' })
  const arrived = updateQuestProgress(started, { type:'confirm-arrival', questId:'due-dau-an-50-nam' })
  localStorage.setItem('dana-quest-progress-v2', JSON.stringify(arrived))
}
it('starts quest reading at 24px and offers real larger pixel steps', async () => {
  start(); const user = userEvent.setup(); render(<QuestPlayPage id="due-dau-an-50-nam" />)
  expect(screen.getByRole('main').style.getPropertyValue('--q-reading-size')).toBe('24px')
  await user.click(screen.getByRole('button', { name:'Mở menu quest' }))
  const control = screen.getByRole('slider')
  expect(control.getAttribute('min')).toBe('24')
  expect(control.getAttribute('max')).toBe('40')
  expect(control.getAttribute('step')).toBe('8')
})
it('keeps exit in the pixel player shell and returns to the same paused quest', async () => {
  start(); const user = userEvent.setup(); render(<QuestPlayPage id="due-dau-an-50-nam" />)
  await user.click(screen.getByRole('button', { name:'Mở menu quest' }))
  await user.click(screen.getByRole('button', { name:/Rời màn chơi/ }))
  await user.click(screen.getByRole('button', { name:'Lưu và rời màn chơi' }))
  await screen.findByRole('heading', { name:'Hẹn bạn ở hành trình tiếp theo' })
  const main = screen.getByRole('main')
  expect(main.classList.contains('quest-player')).toBe(true)
  expect(main.querySelector('.due-exit-card')).toBeTruthy()
  expect(main.querySelector('.due-exit-actions')).toBeTruthy()
  expect(screen.getByRole('link', { name:'Trở lại Khám phá' }).getAttribute('href')).toBe('#/kham-pha')
  expect(JSON.parse(localStorage.getItem('dana-quest-progress-v2')!).quests['due-dau-an-50-nam'].paused).toBe(true)
  await user.click(screen.getByRole('button', { name:'Quay lại quest đang tạm dừng' }))
  await waitFor(() => expect(screen.getByRole('heading', { name:'Hành trình đang tạm dừng' })).toBeTruthy())
})
