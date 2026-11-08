import { expect, it } from 'vitest'
import { dueNotice, decideEvent, claimNotice, occurrenceFor } from '../shared/event-policy.mjs'
const start=Date.parse('2026-10-30T09:30:00+07:00')
const at=(time:string)=>Date.parse(`2026-10-30T${time}:00+07:00`)
it('introduces inside three hours, snoozes from choice time, and stops at thirty minutes',()=>{
 expect(dueNotice({},start,at('06:29'))).toBe(null)
 expect(dueNotice({},start,at('07:00'))).toBe('invite')
 const later=decideEvent({},'later',at('07:00'))
 expect(dueNotice(later,start,at('07:59'))).toBe(null)
 expect(dueNotice(later,start,at('08:00'))).toBe('invite')
 expect(dueNotice(decideEvent(later,'later',at('08:00')),start,at('09:00'))).toBe(null)
})
it('reminds attendance exactly once and catches up after quest only before start',()=>{
 const saved=decideEvent({},'attend',at('07:00'))
 expect(dueNotice(saved,start,at('08:59'))).toBe(null)
 expect(dueNotice(saved,start,at('09:10'))).toBe('reminder')
 const claimed=claimNotice(saved,'reminder',at('09:10'))
 expect(dueNotice(claimed,start,at('09:11'))).toBe(null)
 expect(dueNotice(saved,start,start)).toBe(null)
})
it('claims prevent reload duplication and do not re-arm a reminder by saving again',()=>{
 const saved=decideEvent({},'attend',at('07:00'))
 const claimed=claimNotice(saved,'reminder',at('09:00'))
 expect(dueNotice(decideEvent(claimed,'attend',at('09:01')),start,at('09:02'))).toBe(null)
 expect(dueNotice(claimNotice({},'invite',at('07:00')),start,at('07:01'))).toBe(null)
})
it('uses Da Nang calendar independent of browser timezone, retains running occurrences',()=>{
 const event={id:'bridge',recurring:'dragon-weekend',status:'confirmed'}
 expect(occurrenceFor(event,Date.parse('2026-10-30T13:00:00Z')).start).toBe(Date.parse('2026-10-30T14:00:00Z'))
 expect(occurrenceFor(event,Date.parse('2026-10-30T14:05:00Z')).start).toBe(Date.parse('2026-10-30T14:00:00Z'))
 expect(occurrenceFor({...event,status:'cancelled'},at('07:00'))).toBe(null)
})
