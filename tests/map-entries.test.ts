import {expect,it} from 'vitest'
import {mapEntries} from '../src/lib/mapEntries'
it('keeps list and marker coordinates identical and excludes expired/cancelled events',()=>{
 const entries=mapEntries('events','',Date.parse('2026-10-27T00:00:00Z'),[
 {id:'future',title:'Future',destinationId:'cau-rong',status:'confirmed',startAt:'2026-10-28T00:00:00Z',endAt:'2026-10-28T01:00:00Z'},
 {id:'past',title:'Past',destinationId:'cau-rong',status:'confirmed',startAt:'2026-10-20T00:00:00Z',endAt:'2026-10-20T01:00:00Z'},
 {id:'cancel',title:'Cancel',destinationId:'cau-rong',status:'cancelled',startAt:'2026-10-28T00:00:00Z'},
 {id:'unknown',title:'Unknown',destinationId:'missing',status:'confirmed',startAt:'2026-10-28T00:00:00Z'}
 ] as never)
 expect(entries.map(e=>e.id)).toEqual(['event:future'])
 expect(entries[0].position).toHaveLength(2)
})
it('quest filter has stable unique IDs and accent insensitive search',()=>{
 const entries=mapEntries('quests','cau rong',Date.now(),[])
 expect(entries.some(e=>e.id==='quest:cau-rong')).toBe(true)
 expect(new Set(entries.map(e=>e.id)).size).toBe(entries.length)
 expect(mapEntries('quests','zzzzzz',Date.now(),[])).toEqual([])
})

it('namespaces Django map-only identities and rejects expired or unmappable feed rows',()=>{
 const entries=mapEntries('events','',Date.parse('2026-10-27T00:00:00Z'),[],[{id:42,title:'Django event',placeId:'cau-rong',placeName:'Cầu Rồng',start:'2026-10-28T00:00:00Z',end:'2026-10-28T01:00:00Z',status:'later'}] as never)
 expect(entries.map(e=>e.id)).toEqual(['django:42:2026-10-28T00:00:00Z'])
 expect(entries[0].href).toBe('#/dia-diem/cau-rong')
})
