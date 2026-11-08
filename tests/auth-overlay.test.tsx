// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import App from '../src/App'
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.unstubAllEnvs();localStorage.clear()})
function guest(){vi.stubEnv('VITE_AUTH_API_URL','https://auth.test/api/auth');vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,status:401,json:async()=>({message:'Chưa đăng nhập'})})))}
it('keeps guest Quest behind a dismissible login dialog without redirecting',async()=>{
 guest();location.hash='#/quest-cua-toi';render(<App/>);
 await screen.findByRole('dialog');expect(location.hash).toBe('#/quest-cua-toi');expect(screen.getByRole('heading',{name:'Quest của bạn',hidden:true})).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Đóng đăng nhập'}));expect(screen.queryByRole('dialog')).toBeNull();expect(location.hash).toBe('#/quest-cua-toi')
 fireEvent.click(screen.getByRole('button',{name:'Đăng nhập hoặc tạo tài khoản'}));await screen.findByRole('dialog')
 fireEvent.click(screen.getByRole('button',{name:'Tạo tài khoản',exact:true}));expect(location.hash).toBe('#/quest-cua-toi');expect(screen.getByRole('dialog').querySelector('form')).toBeTruthy()
})
it('opens event save authentication over the same event page and closes with Escape',async()=>{
 guest();location.hash='#/su-kien';render(<App/>);await screen.findByRole('heading',{name:'Sự kiện Đà Nẵng',exact:true});fireEvent.click(screen.getAllByRole('link',{name:'Đăng nhập để lưu sự kiện'})[0]);await screen.findByRole('dialog');expect(location.hash).toBe('#/su-kien');fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(location.hash).toBe('#/su-kien')
})
it('keeps quest detail behind the login prompt when choosing to play',async()=>{
 guest();location.hash='#/quest/due-dau-an-50-nam';render(<App/>);fireEvent.click(await screen.findByRole('link',{name:'Đăng nhập để chơi quest'}));await screen.findByRole('dialog');expect(location.hash).toBe('#/quest/due-dau-an-50-nam')
})
it('retains text entered on a public page while a delayed session is restored',async()=>{
 vi.stubEnv('VITE_AUTH_API_URL','https://auth.test/api/auth');let resolveSession!:(value:unknown)=>void
 const fetchMock=vi.fn((input:unknown)=>String(input).endsWith('/session')?new Promise(resolve=>{resolveSession=resolve}):Promise.resolve({ok:false,status:404,json:async()=>({message:'Unavailable'})}));vi.stubGlobal('fetch',fetchMock)
 location.hash='#/tim-kiem';render(<App/>);const input=await screen.findByRole('searchbox');fireEvent.change(input,{target:{value:'cau rong'}})
 resolveSession({ok:true,status:200,json:async()=>({user:{id:'delayed-fixture',name:'Minh',avatarId:'bien',storageMode:'account'}})})
 await waitFor(()=>expect(fetchMock.mock.calls.some(([url])=>String(url).endsWith('/event-state'))).toBe(true));expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('cau rong')
})

it('keeps the public home mounted through inline login and registration changes',async()=>{
 guest();location.hash='#/';const view=render(<App/>);await screen.findByLabelText('Tên đăng nhập hoặc Email')
 const home=view.container.querySelector('.pixel-home'),form=view.container.querySelector('.auth-inline')
 fireEvent.change(screen.getByLabelText('Tên đăng nhập hoặc Email'),{target:{value:'home-player'}})
 fireEvent.click(screen.getAllByRole('button',{name:'Đăng ký',exact:true})[0]);await screen.findByLabelText('Tên người dùng')
 expect(location.hash).toBe('#/');expect(view.container.querySelector('.pixel-home')).toBe(home);expect(view.container.querySelector('.auth-inline')).toBe(form)
 expect(screen.getByLabelText('Tên người dùng')).toHaveProperty('value','home-player');expect(screen.queryByRole('dialog')).toBeNull();expect(document.body.style.overflow).not.toBe('hidden')
})
it.each(['#/dang-nhap','#/dang-ky'])('replaces auth alias %s with the public home and inline form',async hash=>{
 guest();location.hash=hash;const view=render(<App/>);await screen.findByLabelText(hash==='#/dang-ky'?'Tên người dùng':'Tên đăng nhập hoặc Email');await waitFor(()=>expect(location.hash).toBe('#/'))
 expect(view.container.querySelector('.pixel-home')).toBeTruthy();expect(view.container.querySelectorAll('.auth-inline')).toHaveLength(1);expect(screen.queryByRole('dialog')).toBeNull();expect(view.container.querySelector('.auth-full-page')).toBeNull()
})
