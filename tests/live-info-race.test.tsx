// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { getDestination } from '../src/data/destinations'
import { useLiveVisitInfo } from '../src/lib/useLiveVisitInfo'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it('does not replace the new destination information with an older request',async()=>{
 const requests:Array<(value:Response)=>void>=[]
 vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(resolve=>requests.push(resolve))))
 const {result,rerender}=renderHook(({id})=>useLiveVisitInfo(getDestination(id)!),{initialProps:{id:'cau-rong'}})
 rerender({id:'cau-song-han'})
 await act(async()=>requests[1]({ok:true,json:async()=>({hours:'Thông tin Cầu Sông Hàn'})} as Response))
 await act(async()=>requests[0]({ok:true,json:async()=>({hours:'Thông tin Cầu Rồng'})} as Response))
 expect(result.current.info?.hours).toBe('Thông tin Cầu Sông Hàn')
})
