// @vitest-environment jsdom
import { act, cleanup, fireEvent, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setSyncAccount } from '../src/lib/accountSync'
import { useQuestProgress } from '../src/lib/useQuestProgress'
import { newQuestState, updateQuestProgress } from '../src/lib/questProgress'
import { useProgress } from '../src/lib/useProgress'
import * as storage from '../src/lib/storage'
import { newState, updateProgress } from '../src/lib/progress'
afterEach(()=>{cleanup();setSyncAccount(null);vi.unstubAllGlobals();vi.restoreAllMocks()})
it('does not let an older focus refresh roll back a successfully saved quest step',async()=>{
 setSyncAccount('owner-test')
 const requests:Array<(value:Response)=>void>=[]
 vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(resolve=>requests.push(resolve))))
 const started=updateQuestProgress(newQuestState(),{type:'start',questId:'due-dau-an-50-nam'})
 started.quests['due-dau-an-50-nam'].phase='story'
 const response=(value:unknown)=>({ok:true,json:async()=>value}) as Response
 const {result}=renderHook(()=>useQuestProgress())
 await waitFor(()=>expect(requests).toHaveLength(1))
 await act(async()=>requests[0](response(started)))
 fireEvent.focus(window)
 await waitFor(()=>expect(requests).toHaveLength(2))
 let saved:Promise<boolean>
 act(()=>{saved=result.current.dispatch({type:'continue-story',questId:'due-dau-an-50-nam',checkpointId:'cong-71'})})
 await waitFor(()=>expect(requests).toHaveLength(3))
 const advanced=updateQuestProgress(started,{type:'continue-story',questId:'due-dau-an-50-nam'})
 await act(async()=>{requests[2](response(advanced));await saved})
 expect(result.current.state.quests['due-dau-an-50-nam'].phase).toBe('challenge')
 await act(async()=>requests[1](response(started)))
 expect(result.current.state.quests['due-dau-an-50-nam'].phase).toBe('challenge')
})
it('does not roll legacy mission progress back when a focus refresh arrives after a save',async()=>{
 const requests:Array<(value:ReturnType<typeof newState>)=>void>=[]
 vi.spyOn(storage,'loadProgress').mockImplementation(()=>new Promise(resolve=>requests.push(resolve)))
 const assigned=updateProgress(newState(),{type:'assign',destinationId:'cau-rong',count:10})
 const completed=updateProgress(assigned,{type:'complete',destinationId:'cau-rong',missionId:'read'})
 vi.spyOn(storage,'saveAction').mockResolvedValue(completed)
 const {result}=renderHook(()=>useProgress())
 await act(async()=>requests[0](assigned))
 fireEvent.focus(window)
 await act(async()=>{await result.current.dispatch({type:'complete',destinationId:'cau-rong',missionId:'read'})})
 await act(async()=>requests[1](assigned))
 expect(result.current.state.destinations['cau-rong'].completed).toContain('read')
})
