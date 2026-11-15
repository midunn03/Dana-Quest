// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest'
import {cleanup,render,screen} from '@testing-library/react'
import InformationPage from '../src/InformationPage'
import {setLocale} from '../src/i18n/locale'
afterEach(()=>{cleanup();setLocale('vi')})
it('explains practical privacy controls with links to account settings',()=>{
 render(<InformationPage privacy/>);
 expect(screen.getByRole('heading',{name:'Dữ liệu được lưu'})).toBeTruthy()
 expect(screen.getByRole('link',{name:'Quản lý quyền riêng tư'}).getAttribute('href')).toBe('#/tai-khoan/privacy')
 expect(screen.getByRole('heading',{name:'Thời gian lưu và xóa dữ liệu'})).toBeTruthy()
})
it('renders English terms including quest safety and reward conditions',()=>{
 setLocale('en');render(<InformationPage privacy={false}/>);
 expect(screen.getByRole('heading',{name:'Play safely in public places'})).toBeTruthy()
 expect(screen.getByRole('heading',{name:'Coins and reward receipts'})).toBeTruthy()
 expect(screen.getByRole('link',{name:'Your wallet'}).getAttribute('href')).toBe('#/tai-khoan/wallet')
})
