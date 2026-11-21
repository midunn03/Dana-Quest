// @vitest-environment jsdom
import {cleanup,fireEvent,render} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import QuestCover from '../src/QuestCover'
import type {PlaceData} from '../src/lib/placeContent'

const store=vi.hoisted(()=>({value:{sprites:{},content:{}} as PlaceData}))
vi.mock('../src/lib/placeContent',()=>({usePlaceData:()=>store.value}))
afterEach(()=>{cleanup();store.value={sprites:{},content:{}}})

it('uses the real catalog photo when admin content has no photos and hides photo credits',()=>{
 store.value.content['cau-rong']={photos:[]} as never
 const {container}=render(<QuestCover id="cau-rong" credit/>)
 expect(container.querySelector('img')?.getAttribute('src')).toBe('/photos/cau-rong.jpg')
 expect(container.querySelector('figcaption')).toBeNull()
 expect(container.querySelector('a')).toBeNull()
})
it('recovers from a broken admin photo using the real catalog image, then illustration',()=>{
 store.value.content['cau-rong']={photos:[{url:'/media/missing.jpg',caption:'Admin',credit:'Admin credit'}]} as never
 const {container}=render(<QuestCover id="cau-rong" credit/>)
 expect(container.querySelector('img')?.getAttribute('src')).toBe('/media/missing.jpg')
 fireEvent.error(container.querySelector('img')!)
 expect(container.querySelector('img')?.getAttribute('src')).toBe('/photos/cau-rong.jpg')
 expect(container.querySelector('figcaption')).toBeNull()
 fireEvent.error(container.querySelector('img')!)
 expect(container.querySelector('img')).toBeNull()
 expect(container.querySelector('.landmark-art')).not.toBeNull()
})
it('does not render photo source links on a standalone detail cover',()=>{
 const {container}=render(<QuestCover id="cau-rong" credit sourceLink/>)
 expect(container.querySelector('figcaption')).toBeNull()
 expect(container.querySelector('a')).toBeNull()
})
