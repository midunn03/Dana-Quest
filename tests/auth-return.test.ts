import {expect,it} from 'vitest'
import {rememberPageReturn,takePageReturn} from '../src/lib/onboarding'
// @vitest-environment jsdom
it('returns to supported quest/event pages only once after character setup',()=>{
 for(const route of ['#/quest-cua-toi','#/quest/due-dau-an-50-nam','#/su-kien','#/su-kien/cau-rong-phun-lua']){rememberPageReturn(route);expect(takePageReturn()).toBe(route);expect(takePageReturn()).toBe(null)}
})
it('rejects external and private gameplay return targets',()=>{
 for(const route of ['https://example.com','javascript:alert(1)','#/quest/due/choi']){rememberPageReturn(route);expect(takePageReturn()).toBe(null)}
})
