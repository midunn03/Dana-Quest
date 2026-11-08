// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,render,screen} from '@testing-library/react'
import ActiveMissionIndicator from '../src/ActiveMissionIndicator'
const fixture=vi.hoisted(()=>({quests:{} as Record<string,any>}))
vi.mock('../src/lib/useQuestProgress',()=>({useQuestProgress:()=>({state:{quests:fixture.quests},loading:false})}))
vi.mock('../src/lib/useProgress',()=>({useProgress:()=>({state:{destinations:{'cau-rong':{started:true,selected:Array(10).fill('old'),completed:[]}}},loading:false})}))
afterEach(()=>{cleanup();fixture.quests={}})
it('does not display the old ten-mission indicator for a converted destination',()=>{render(<ActiveMissionIndicator/>);expect(screen.queryByRole('link')).toBeNull()})
it('shows two-checkpoint quest progress and links to the current game',()=>{fixture.quests={'cau-rong':{startedAt:1,arrivalConfirmedAt:2,completedCheckpointIds:['nhan-dien-dia-diem']}};render(<ActiveMissionIndicator/>);expect(screen.getByRole('link').getAttribute('href')).toBe('#/quest/cau-rong/choi');expect(screen.getByText('1/2')).toBeTruthy()})
