// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import OnboardingPage from '../src/OnboardingPage'
afterEach(()=>{cleanup();localStorage.clear()})
it('has working small links and progresses city, plans, intro to Explore', async()=>{
  const user=userEvent.setup()
  const city=render(<OnboardingPage step="city" />)
  expect(screen.getByRole('link',{name:'Bạn đã có mã đặt chỗ hoặc lời mời?'}).getAttribute('href')).toBe('#/kich-hoat')
  await user.click(screen.getByRole('button',{name:'Đúng, khám phá Đà Nẵng'}))
  expect(window.location.hash).toBe('#/bat-dau/ke-hoach')
  city.unmount()
  const plans=render(<OnboardingPage step="plans" />)
  expect(screen.getByRole('button',{name:'Tiếp tục'})).toHaveProperty('disabled',true)
  await user.click(screen.getByRole('radio',{name:/Đang lên kế hoạch/}))
  await user.click(screen.getByRole('button',{name:'Tiếp tục'}))
  expect(window.location.hash).toBe('#/bat-dau/gioi-thieu')
  plans.unmount()
  render(<OnboardingPage step="intro" />)
  await user.click(screen.getByRole('button',{name:'Xem các quest của tôi'}))
  expect(window.location.hash).toBe('#/kham-pha')
})
