// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import EventProvider from '../src/EventProvider'
import EventsPage from '../src/EventsPage'
import EventDemo from '../src/EventDemo'
import { claimNotice, decideEvent, dueNotice, type EventDecision } from '../shared/event-policy.mjs'
const mocks=vi.hoisted(()=>({request:vi.fn()}))
vi.mock('../src/AuthContext',()=>({useAuth:()=>({user:{id:'fixture'},status:'authenticated'})}))
vi.mock('../src/lib/accountFeatures',()=>({accountRequest:(...args:unknown[])=>mocks.request(...args)}))
afterEach(()=>{cleanup();vi.restoreAllMocks()})
it('demo follows snooze, attendance and quest deferral without writing account data',()=>{
 render(<EventDemo/>);expect(screen.getByRole('region',{name:'Thông báo sự kiện'})).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Để sau đi'}))
 fireEvent.click(screen.getByRole('button',{name:'08:00'}));expect(screen.getByRole('button',{name:'Chắc chắn sẽ tham gia'})).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Chắc chắn sẽ tham gia'}));fireEvent.click(screen.getByRole('button',{name:'09:00'}))
 fireEvent.click(screen.getByRole('checkbox'));expect(screen.queryByRole('region',{name:'Thông báo sự kiện'})).toBeNull()
 fireEvent.click(screen.getByRole('checkbox'));expect(screen.getByText('Sự kiện bạn đã lưu')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Đã hiểu'}));fireEvent.click(screen.getByRole('button',{name:'09:10'}));expect(screen.queryByRole('region',{name:'Thông báo sự kiện'})).toBeNull()
 expect(mocks.request).not.toHaveBeenCalled()
})
it('defers global notices throughout quest, persists snooze and lists saved events',async()=>{
 let now=Date.parse('2026-10-30T19:00:00+07:00'),decisions:Record<string,EventDecision>={},lastShown=0
 vi.spyOn(Date,'now').mockImplementation(()=>now)
 mocks.request.mockImplementation(async(_owner:string,_path:string,body?:{action:string;eventId:string;key:string})=>{
  let notice=null
  if(body){const start=Number(body.key.split(':').at(-1)),state=decisions[body.key]||{}
   if(body.action==='claim'){notice=dueNotice(state,start,now);if(notice){decisions={...decisions,[body.key]:claimNotice(state,notice,now)};lastShown=now}}
   else decisions={...decisions,[body.key]:decideEvent(state,body.action as 'attend'|'later'|'remove',now)}
  }return {events:{decisions,lastShown},serverNow:now,enabled:true,notice}
 })
 const {rerender}=render(<EventProvider route="#/quest/due/choi"><EventsPage/></EventProvider>)
 await waitFor(()=>expect(mocks.request).toHaveBeenCalled());expect(screen.queryByRole('region',{name:'Thông báo sự kiện'})).toBeNull()
 rerender(<EventProvider route="#/su-kien"><EventsPage/></EventProvider>)
 await screen.findByRole('region',{name:'Thông báo sự kiện'})
 fireEvent.click(screen.getByRole('region',{name:'Thông báo sự kiện'}).querySelector('.ev-secondary')!)
 await waitFor(()=>expect(screen.queryByRole('region',{name:'Thông báo sự kiện'})).toBeNull())
 fireEvent.click(screen.getAllByRole('button',{name:'Chắc chắn sẽ tham gia'})[0]);await screen.findByRole('button',{name:'Đã lưu (bấm để bỏ lưu)'})
 fireEvent.click(screen.getByRole('navigation',{name:'Lọc thời gian sự kiện'}).querySelector('button:last-child')!);expect(screen.getAllByRole('article')).toHaveLength(1)
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'không có'}});expect(screen.getByText('Chưa có cuộc hẹn nào ở đây')).toBeTruthy()
 now+=3600000
})

