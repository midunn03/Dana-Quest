// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import SitePopup from '../src/SitePopup'
const remembered=vi.hoisted(()=>vi.fn())
vi.mock('../src/BookingPage',()=>({default:({entry}:{entry:boolean})=><div>{entry?'Existing code form':'Existing code choices'}<a href="#/nhap-ma" onClick={remembered}>Enter code</a></div>}))
vi.mock('../src/InformationPage',()=>({default:({privacy}:{privacy:boolean})=><p>{privacy?'Existing privacy content':'Existing terms content'}</p>}))
vi.mock('../src/HelpPage',()=>({default:()=> <p>Existing help content</p>}))
vi.mock('../src/AccountPage',()=>({default:()=> <p>Existing support content</p>}))
beforeAll(()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
})
afterEach(()=>{cleanup();remembered.mockClear()})
function setup(){return render(<><div className="app-shell"><a href="#/dieu-khoan">Terms</a><a href="#/quyen-rieng-tu">Privacy</a><a href="#/kich-hoat">Quest code</a><a href="#/tai-khoan/support">Support</a></div><SitePopup user={null} onLogout={async()=>{}}/></>)}
it('opens existing terms, privacy and support without changing the route, and closes',()=>{
 setup();const hash=location.hash
 for(const [name,content] of [['Terms','Existing terms content'],['Privacy','Existing privacy content'],['Support','Existing support content']]){
  fireEvent.click(screen.getByText(name));expect(screen.getByText(content)).toBeTruthy();expect(document.querySelector('dialog')?.open).toBe(true);expect(location.hash).toBe(hash)
  fireEvent.click(screen.getByRole('button',{name:'Đóng cửa sổ'}));expect(document.querySelector('dialog')?.open).toBe(false)
 }
})
it('switches the existing code views and preserves the original link callback',()=>{
 setup();fireEvent.click(screen.getByText('Quest code'));expect(screen.getByText('Existing code choices')).toBeTruthy()
 fireEvent.click(screen.getByText('Enter code'));expect(screen.getByText('Existing code form')).toBeTruthy();expect(remembered).toHaveBeenCalledOnce()
 fireEvent(document.querySelector('dialog')!,new Event('cancel',{bubbles:true}));expect(document.querySelector('dialog')?.open).toBe(false)
})
