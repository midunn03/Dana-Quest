// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import AccountPage from '../src/AccountPage'
import { AuthProvider } from '../src/AuthContext'
import { emptyAccountFeatures } from '../src/lib/accountFeatures'
import { newState } from '../src/lib/progress'
import { newQuestState, updateQuestProgress } from '../src/lib/questProgress'
import { setSyncAccount } from '../src/lib/accountSync'
const fixture=vi.hoisted(()=>({quest:undefined as unknown}))
vi.mock('../src/lib/useProgress',()=>({useProgress:()=>({state:newState(),loading:false,error:'',corrupt:false})}))
vi.mock('../src/lib/useQuestProgress',()=>({useQuestProgress:()=>({state:fixture.quest,loading:false,error:''})}))
const profile={id:'account-ui-fixture',name:'Tên đăng nhập',avatarId:'bien',storageMode:'account' as const}
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();setSyncAccount(null);localStorage.clear()})
function setup(){
 const questId='due-dau-an-50-nam';let run=updateQuestProgress(newQuestState(),{type:'start',questId})
 run=updateQuestProgress(run,{type:'complete-checkpoint',questId,checkpointId:'cong-71',answer:'71'})
 fixture.quest=updateQuestProgress(run,{type:'complete-checkpoint',questId,checkpointId:'dau-moc-1975',answer:'1975'})
 let data=emptyAccountFeatures();data.profile={displayName:'Tên công khai',bio:'Giới thiệu đã lưu',home:'Đà Nẵng',photoData:''}
 const requests:Array<{url:string;body:Record<string,unknown>|null}>=[]
 vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=String(input),body=init?.body?JSON.parse(String(init.body)):null;requests.push({url,body})
  if(url.endsWith('/account')){if(body?.kind==='profile')data={...data,profile:{...data.profile,...body}};return {ok:true,json:async()=>data}}
  if(url.endsWith('/leaderboard'))return {ok:true,json:async()=>({items:[]})}
  if(url.endsWith('/session'))return {ok:true,json:async()=>({user:profile})}
  return {ok:true,json:async()=>({revision:0,state:newState(),photos:[]})}
 }))
 return {requests}
}
it('shows saved profile, true quest XP and all main reference actions',async()=>{
 setup();render(<AuthProvider><AccountPage user={profile} onLogout={vi.fn()}/></AuthProvider>)
 expect(await screen.findByRole('heading',{name:'Tên công khai'})).toBeTruthy()
 expect(screen.getByText('120 XP')).toBeTruthy()
 for(const name of ['Nhật ký của bạn','Gợi ý địa điểm','Làm video và thù lao','Thách đấu','Dẫn một Quest Tour','Tour riêng của tôi'])expect(screen.getByRole('link',{name:new RegExp(name)})).toBeTruthy()
 expect(screen.getByRole('link',{name:'Cài đặt tài khoản'}).getAttribute('href')).toBe('#/tai-khoan/cai-dat')
})
it('loads the existing bio before editing and saves profile without changing the login name',async()=>{
 const {requests}=setup();const user=userEvent.setup()
 render(<AuthProvider><AccountPage user={profile} onLogout={vi.fn()} view="edit"/></AuthProvider>)
 expect(screen.getByRole('link',{name:'Quay lại'}).getAttribute('href')).toBe('#/tai-khoan')
 const routeBeforeSave=window.location.hash
 const bio=await screen.findByLabelText('Giới thiệu')
 expect(bio).toHaveProperty('value','Giới thiệu đã lưu')
 const name=screen.getByLabelText('Tên hiển thị');await user.clear(name);await user.type(name,'Người khám phá mới')
 await user.click(screen.getByRole('button',{name:'Lưu hồ sơ'}))
 await waitFor(()=>expect(requests.some(item=>item.body?.displayName==='Người khám phá mới'&&item.body.bio==='Giới thiệu đã lưu')).toBe(true))
 expect(requests.some(item=>item.body?.username||item.body?.name)).toBe(false)
 expect(window.location.hash).toBe(routeBeforeSave)
 expect(await screen.findByRole('status')).toHaveProperty('textContent','Đã lưu thay đổi.')
})
it('does not expose member data or enable account deletion for guests',async()=>{
 setup();render(<AuthProvider><AccountPage user={null} onLogout={vi.fn()}/></AuthProvider>)
 expect(screen.getByRole('heading',{name:'Bạn đang khám phá với tư cách khách'})).toBeTruthy()
 expect(screen.queryByText('Tên công khai')).toBeNull()
 expect(screen.queryByRole('button',{name:'Đăng xuất'})).toBeNull()
})
