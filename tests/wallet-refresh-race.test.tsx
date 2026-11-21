// @vitest-environment jsdom
import {act, cleanup, fireEvent, renderHook, waitFor} from '@testing-library/react'
import {afterEach, expect, it, vi} from 'vitest'
import {useWallet} from '../src/lib/useWallet'
import {setSyncAccount} from '../src/lib/accountSync'

afterEach(() => {cleanup(); setSyncAccount(null); vi.unstubAllGlobals()})
it('keeps a redemption successful when the window is focused while saving', async () => {
  setSyncAccount('wallet-owner')
  const requests: Array<{method?:string; resolve:(value:Response)=>void}> = []
  vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise<Response>(resolve => requests.push({method:init.method,resolve}))))
  const response = (balance:number) => ({ok:true,json:async()=>({version:1,status:'ready',balance,entries:[],receipts:[]})}) as Response
  const {result} = renderHook(() => useWallet())
  await waitFor(() => expect(requests).toHaveLength(1))
  await act(async () => requests[0].resolve(response(50)))
  let saved!: Promise<boolean>
  act(() => {saved=result.current.redeem('postcard')})
  fireEvent.focus(window)
  await act(async () => {requests.find(request=>request.method==='POST')!.resolve(response(20)); expect(await saved).toBe(true)})
})

it('loads the new account wallet while an old account redemption is still pending',async()=>{
  setSyncAccount('a')
  const requests:Array<{owner:string;method?:string;resolve:(value:Response)=>void}>=[]
  vi.stubGlobal('fetch',vi.fn((_url:string,init:RequestInit)=>new Promise<Response>(resolve=>requests.push({owner:(init.headers as Record<string,string>)['X-Dana-User'],method:init.method,resolve}))))
  const response=(balance:number)=>({ok:true,json:async()=>({version:1,status:'ready',balance,entries:[],receipts:[]})}) as Response
  const {result,rerender}=renderHook(()=>useWallet())
  await act(async()=>requests[0].resolve(response(50)))
  let saved!:Promise<boolean>
  act(()=>{saved=result.current.redeem('postcard')})
  setSyncAccount('b');rerender()
  await waitFor(()=>expect(requests.some(request=>request.owner==='b')).toBe(true))
  await act(async()=>requests.find(request=>request.owner==='b')!.resolve(response(80)))
  await act(async()=>{requests.find(request=>request.method==='POST')!.resolve(response(20));await saved})
  expect(result.current.wallet.balance).toBe(80)
  expect(result.current.loading).toBe(false)
})
