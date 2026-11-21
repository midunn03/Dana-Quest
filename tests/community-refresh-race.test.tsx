// @vitest-environment jsdom
import {act,cleanup,renderHook,waitFor} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {useQuestCommunity} from '../src/lib/useQuestCommunity'
vi.mock('../src/AuthContext',()=>({useAuth:()=>({user:null})}))
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('does not show reviews from the previous quest when an older response arrives last',async()=>{
  const requests:Array<(response:Response)=>void>=[]
  vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(resolve=>requests.push(resolve))))
  const response=(reviewCount:number)=>({ok:true,json:async()=>({reviews:[],followers:0,rating:null,reviewCount})}) as Response
  const {result,rerender}=renderHook(({id})=>useQuestCommunity(id),{initialProps:{id:'cau-rong'}})
  await waitFor(()=>expect(requests).toHaveLength(1))
  rerender({id:'cau-song-han'})
  await waitFor(()=>expect(requests).toHaveLength(2))
  await act(async()=>requests[1](response(2)))
  await act(async()=>requests[0](response(10)))
  expect(result.current.data.reviewCount).toBe(2)
})
