// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../src/AuthContext'
import { setSyncAccount } from '../src/lib/accountSync'
afterEach(()=>{cleanup();setSyncAccount(null);vi.unstubAllGlobals();vi.unstubAllEnvs()})
it('ignores an initial session check that returns after a successful login',async()=>{
 vi.stubEnv('VITE_AUTH_API_URL','/api/auth')
 let finishSession:(value:Response)=>void
 const profile={id:'race-fixture',name:'Người thử',avatarId:'bien',storageMode:'account'}
 vi.stubGlobal('fetch',vi.fn((url: string)=>url.endsWith('/session')?new Promise<Response>(resolve=>{finishSession=resolve}):Promise.resolve({ok:true,json:async()=>({user:profile})} as Response)))
 const {result}=renderHook(()=>useAuth(),{wrapper:AuthProvider})
 await act(async()=>{await result.current.login({username:'Người thử',password:'fixture-only'})})
 expect(result.current.status).toBe('authenticated')
 await act(async()=>finishSession({ok:false,status:401,json:async()=>({message:'Chưa đăng nhập.'})} as Response))
 await waitFor(()=>expect(result.current.status).toBe('authenticated'))
 expect(result.current.user?.id).toBe(profile.id)
})
