// @vitest-environment jsdom
import {act,cleanup,renderHook} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {useQuestNavigationGuard} from '../src/lib/useQuestNavigationGuard'
afterEach(cleanup)
it('keeps a rejected save on screen and retries the requested destination',async()=>{
 const pause=vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
 const {result}=renderHook(()=>useQuestNavigationGuard(true,pause))
 const request=new CustomEvent('dana-before-navigation',{cancelable:true,detail:{hash:'#/kham-pha'}})
 act(()=>{window.dispatchEvent(request)})
 expect(request.defaultPrevented).toBe(true)
 await act(()=>result.current.confirm())
 expect(result.current.destination).toBe('#/kham-pha')
 await act(()=>result.current.confirm())
 expect(window.location.hash).toBe('#/kham-pha')
 const accepted=new CustomEvent('dana-before-navigation',{cancelable:true,detail:{hash:'#/kham-pha'}})
 window.dispatchEvent(accepted);expect(accepted.defaultPrevented).toBe(false)
})
it('cancels without saving or leaving and permits inactive journeys',()=>{
 const pause=vi.fn(),{result,rerender}=renderHook(({active})=>useQuestNavigationGuard(active,pause),{initialProps:{active:true}})
 act(()=>{window.dispatchEvent(new CustomEvent('dana-before-navigation',{cancelable:true,detail:{hash:'#/map'}}))})
 act(()=>result.current.cancel());expect(result.current.destination).toBeNull();expect(pause).not.toHaveBeenCalled()
 rerender({active:false});const event=new CustomEvent('dana-before-navigation',{cancelable:true,detail:{hash:'#/map'}});window.dispatchEvent(event);expect(event.defaultPrevented).toBe(false)
})
it('allows the deliberate start-to-play transition without pausing',()=>{
 const pause=vi.fn();renderHook(()=>useQuestNavigationGuard(true,pause,false,'#/quest/cau-rong/choi'))
 const event=new CustomEvent('dana-before-navigation',{cancelable:true,detail:{hash:'#/quest/cau-rong/choi'}})
 window.dispatchEvent(event);expect(event.defaultPrevented).toBe(false);expect(pause).not.toHaveBeenCalled()
})
