// @vitest-environment jsdom
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {LocaleProvider,useLocale} from '../src/i18n/LocaleProvider'
import {languageStorageKey,setLocale} from '../src/i18n/locale'
const state=vi.hoisted(()=>({user:null as null|{id:string},load:vi.fn()}))
vi.mock('../src/AuthContext',()=>({useAuth:()=>({user:state.user})}))
vi.mock('../src/lib/accountFeatures',()=>({loadAccountFeatures:(owner:string)=>state.load(owner)}))
function Page(){const {t,language,setLanguage}=useLocale();return <><p>{t('Đăng nhập','Sign in')}</p><span>{language}</span><input aria-label="answer"/><button onClick={()=>setLanguage('en')}>English</button><button onClick={()=>setLanguage('vi')}>Vietnamese</button></>}
afterEach(()=>{cleanup();localStorage.clear();state.user=null;state.load.mockReset();setLocale('vi')})
it('changes all consumers immediately while preserving input and guest preference',()=>{
 render(<LocaleProvider><Page/></LocaleProvider>);fireEvent.change(screen.getByRole('textbox'),{target:{value:'my unfinished answer'}});fireEvent.click(screen.getByText('English'))
 expect(screen.getByText('Sign in')).toBeTruthy();expect(document.documentElement.lang).toBe('en');expect((screen.getByRole('textbox')as HTMLInputElement).value).toBe('my unfinished answer');expect(localStorage.getItem(languageStorageKey())).toBe('en')
})
it('does not leak preferences during account switch, after logout, or from stale requests',async()=>{
 let resolveA:(data:unknown)=>void=()=>{};state.load.mockImplementation((owner:string)=>owner==='a'?new Promise(resolve=>{resolveA=resolve}):Promise.resolve({preferences:{language:'vi'}}))
 localStorage.setItem(languageStorageKey(),'en');localStorage.setItem(languageStorageKey('a'),'en');state.user={id:'a'}
 const view=render(<LocaleProvider><Page/></LocaleProvider>);expect(screen.getByText('Sign in')).toBeTruthy()
 state.user={id:'b'};view.rerender(<LocaleProvider><Page/></LocaleProvider>);await waitFor(()=>expect(screen.getByText('Đăng nhập')).toBeTruthy())
 await act(async()=>resolveA({preferences:{language:'en'}}));expect(screen.getByText('Đăng nhập')).toBeTruthy()
 state.user=null;view.rerender(<LocaleProvider><Page/></LocaleProvider>);expect(screen.getByText('Sign in')).toBeTruthy()
})
