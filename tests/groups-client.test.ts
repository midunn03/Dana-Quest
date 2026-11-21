// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {setSyncAccount} from '../src/lib/accountSync'
import {fetchMyGroups,createGroup,leaveGroup} from '../src/lib/groups'
afterEach(()=>{setSyncAccount(null);vi.unstubAllGlobals()})
it('uses the account API and captured account identity for group operations',async()=>{
 setSyncAccount('group-owner')
 const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({groups:[],success:true})})
 vi.stubGlobal('fetch',fetch)
 expect(await fetchMyGroups()).toEqual([])
 await createGroup('Bạn bè')
 await leaveGroup(1)
 expect(fetch.mock.calls.map(call=>call[0])).toEqual(['/api/auth/groups/my','/api/auth/groups/create','/api/auth/groups/leave'])
 expect(fetch.mock.calls[1][1].headers['X-Dana-User']).toBe('group-owner')
})
it('reports a service failure instead of presenting it as no groups',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({message:'Máy chủ nhóm chưa kết nối.'})}))
 await expect(fetchMyGroups()).rejects.toThrow('Máy chủ nhóm chưa kết nối.')
 expect(await leaveGroup(1)).toMatchObject({success:false,message:'Máy chủ nhóm chưa kết nối.'})
})
