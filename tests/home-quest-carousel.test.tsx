// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import HomeQuestCarousel from '../src/HomeQuestCarousel'
import { quests } from '../src/data/quests'
afterEach(cleanup)
it('shows every existing quest, preserves destinations and cycles both directions', () => {
 const view=render(<HomeQuestCarousel />)
 const current=()=>view.container.querySelector('.home-quest-slide[data-active="true"]')
 expect(view.container.querySelectorAll('.home-quest-slide')).toHaveLength(quests.length)
 expect(current()?.getAttribute('href')).toBe(`#/quest/${quests[0].id}`)
 fireEvent.click(view.getByRole('button',{name:'Quest trước'}))
 expect(current()?.getAttribute('href')).toBe(`#/quest/${quests[quests.length-1].id}`)
 fireEvent.click(view.getByRole('button',{name:'Quest tiếp theo'}))
 expect(current()?.getAttribute('href')).toBe(`#/quest/${quests[0].id}`)
 fireEvent.keyDown(view.getByRole('region'),{key:'ArrowRight'})
 expect(current()?.getAttribute('href')).toBe(`#/quest/${quests[1].id}`)
})
