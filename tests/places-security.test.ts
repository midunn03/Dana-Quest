import { afterEach, expect, it, vi } from 'vitest'
import { placesApi } from '../server/places.mjs'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('coalesces simultaneous cache misses into one paid upstream request', async () => {
 vi.stubEnv('GOOGLE_MAPS_API_KEY', 'synthetic-test-key')
 let release!: () => void
 const pending = new Promise<void>(resolve => { release = resolve })
 const upstream = vi.fn(async () => {
  await pending
  return { ok: true, json: async () => ({ places: [{ formattedAddress: 'Test address' }] }) }
 })
 vi.stubGlobal('fetch', upstream)
 const bodies: string[] = []
 const call = () => placesApi({url:'/api/places/visit-info?id=cau-rong',method:'GET'}, {
  statusCode:0, setHeader() {}, end(body:string) { bodies.push(body) },
 }, () => { throw Error('Unexpected fallthrough') })
 const calls = [call(), call(), call()]
 release()
 await Promise.all(calls)
 expect(bodies).toHaveLength(3)
 expect(upstream).toHaveBeenCalledTimes(1)
})
