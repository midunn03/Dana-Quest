// @vitest-environment jsdom
import {cleanup,render,screen} from '@testing-library/react'
import {afterEach,expect,it} from 'vitest'
import PixelLogo from '../src/PixelLogo'

afterEach(cleanup)
it('renders the official supplied logo as an image rather than rebuilding its lettering',()=>{
 render(<PixelLogo/>)
 const image=document.querySelector('img')
 expect(image?.getAttribute('src')).toContain('/brand/dana-quest-logo.png')
 expect(image?.getAttribute('alt')).toBe('')
 expect(image?.getAttribute('aria-hidden')).toBe('true')
 expect(screen.queryByRole('img')).toBeNull()
 expect(document.querySelector('svg')).toBeNull()
})
