// @vitest-environment jsdom
import {cleanup,render,screen,within} from '@testing-library/react'
import {afterEach,expect,it} from 'vitest'
import WorkspaceNavigation from '../src/WorkspaceNavigation'

afterEach(cleanup)
it('offers direct routes between profile, library and shop and marks only the current page',()=>{
  const {rerender}=render(<WorkspaceNavigation route="#/tai-khoan/edit"/>)
  const menu=within(screen.getByRole('navigation',{name:'Không gian tài khoản'}))
  expect(menu.getByRole('link',{name:'Chỉnh sửa hồ sơ'}).getAttribute('aria-current')).toBe('page')
  for(const [name,href] of [['Thư viện kỷ niệm','#/album'],['Cửa hàng đổi xu','#/cua-hang'],['Ví xu','#/tai-khoan/wallet']]){
    expect(menu.getByRole('link',{name}).getAttribute('href')).toBe(href)
  }
  rerender(<WorkspaceNavigation route="#/album"/>)
  expect(menu.getByRole('link',{name:'Chỉnh sửa hồ sơ'}).hasAttribute('aria-current')).toBe(false)
  expect(menu.getByRole('link',{name:'Thư viện kỷ niệm'}).getAttribute('aria-current')).toBe('page')
})
