// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import DueStartPage from '../src/DueStartPage'
import { newQuestState, updateQuestProgress } from '../src/lib/questProgress'
import { setSyncAccount } from '../src/lib/accountSync'
vi.mock('../src/DueMap',()=>({default:()=> <div aria-label="Bản đồ điểm bắt đầu"/>}))
afterEach(()=>{cleanup();localStorage.clear();setSyncAccount(null);window.history.replaceState(null,'','#/')})
it('requires explicit visual arrival confirmation, persists it, then offers start without claiming GPS verification',async()=>{
 setSyncAccount(null);localStorage.setItem('dana-quest-progress-v2',JSON.stringify(updateQuestProgress(newQuestState(),{type:'start',questId:'due-dau-an-50-nam'})))
 const user=userEvent.setup();const view=render(<DueStartPage id="due-dau-an-50-nam"/> )
 expect(screen.queryByRole('link',{name:'Bắt đầu quest'})).toBeNull()
 await user.click(await screen.findByRole('button',{name:'Xác nhận đã đến'}))
 expect(screen.getByRole('dialog',{name:'Bạn đã nhìn thấy điểm bắt đầu?'})).toBeTruthy()
 await user.click(screen.getByRole('button',{name:'Tôi đã đến đúng điểm này'}))
 expect(await screen.findByRole('link',{name:'Bắt đầu quest'})).toBeTruthy()
 expect(JSON.parse(localStorage.getItem('dana-quest-progress-v2')!).quests['due-dau-an-50-nam'].arrivalMethod).toBe('visual')
 view.unmount();render(<DueStartPage id="due-dau-an-50-nam"/> )
 expect(await screen.findByText('Bạn đã tự xác nhận đến điểm bắt đầu')).toBeTruthy()
})
it('lets players inspect directions and cancel confirmation without unlocking start',async()=>{
 setSyncAccount(null);localStorage.setItem('dana-quest-progress-v2',JSON.stringify(updateQuestProgress(newQuestState(),{type:'start',questId:'due-dau-an-50-nam'})))
 const user=userEvent.setup();render(<DueStartPage id="due-dau-an-50-nam"/> )
 await user.click(await screen.findByRole('tab',{name:'Bản đồ'}))
 expect(screen.getByLabelText('Bản đồ điểm bắt đầu')).toBeTruthy()
 expect(screen.getByRole('link',{name:'Mở chỉ đường từng chặng →'}).getAttribute('href')).toBe('#/quest/due-dau-an-50-nam/dan-duong')
 await user.click(screen.getByRole('button',{name:'Không tìm thấy điểm bắt đầu?'}))
 await user.click(screen.getByRole('button',{name:'Xem dấu hiệu nhận diện'}))
 await user.click(screen.getByRole('button',{name:'Đóng bảng'}))
 expect(screen.queryByRole('link',{name:'Bắt đầu quest'})).toBeNull()
})
