// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {AuthProvider} from '../src/AuthContext'
import QuestDetailsPage from '../src/QuestDetailsPage'
import CreatorPage from '../src/CreatorPage'
import {publishedExperienceCount} from '../src/lib/questPresentation'
vi.mock('../src/QuestPreviewMap',()=>({default:()=> <div>Bản đồ thử</div>}))
vi.mock('../src/lib/useQuestCommunity',()=>({creatorId:'dana-quest-studio',useQuestCommunity:()=>({data:{reviews:[],reviewCount:0,rating:null,followers:0},loading:false,busy:false,error:'',favorite:false,following:false,act:vi.fn()})}))
vi.mock('../src/lib/useProgress',()=>({useProgress:()=>({state:{version:1,destinations:{},redemptions:[]},loading:false,error:''})}))
vi.mock('../src/lib/useQuestProgress',()=>({useQuestProgress:()=>({state:{version:2,quests:{}},dispatch:vi.fn(),loading:false,busy:false,error:'',ready:true})}))
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
function setup(){vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,status:401,json:async()=>({message:'Chưa đăng nhập'})})))}
it('contains every reference section, expands overview, opens map/invite, and links the creator',async()=>{
 setup();render(<AuthProvider><QuestDetailsPage id="due-dau-an-50-nam"/></AuthProvider>)
 for(const name of ['Tổng quan','Mời bạn chơi thử quest này','Vì sao quest đang thử nghiệm?','Ảnh từ người chơi','Bạn sẽ trải nghiệm','Đánh giá','Thông tin hành trình','Gặp nhà sáng tạo','Trước khi lên đường'])expect(screen.getByRole('heading',{name,exact:true})).toBeTruthy()
 const more=screen.getByRole('button',{name:/Đọc thêm/});fireEvent.click(more);expect(more.getAttribute('aria-expanded')).toBe('true')
 expect(screen.getByRole('link',{name:/Dana Quest Hồ sơ nhóm/}).getAttribute('href')).toBe('#/nha-sang-tao/dana-quest-studio?tu=due-dau-an-50-nam')
 fireEvent.click(screen.getByRole('button',{name:/Bản đồ/}));await screen.findByRole('dialog',{name:'Bản đồ hành trình'});expect(await screen.findByText('Bản đồ thử')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Đóng bảng'}))
 fireEvent.click(screen.getByRole('button',{name:'Mời bạn khám phá quest'}));expect(screen.getByRole('dialog',{name:'Mời bạn khám phá'})).toBeTruthy()
})
it('includes the entire creator profile without invented personal statistics',()=>{
 setup();render(<AuthProvider><CreatorPage id="dana-quest-studio"/></AuthProvider>)
 for(const name of ['Hộ chiếu (trọn hành trình)','Kệ thành tích',`Quest đã tạo (${publishedExperienceCount()})`,'Khoảnh khắc đáng nhớ','Nơi đã đến','Huy hiệu'])expect(screen.getByRole('heading',{name,exact:true})).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Đọc thêm'}));expect(screen.getByText(/hồ sơ dự án tạm thời/)).toBeTruthy();expect(screen.getByRole('button',{name:'Theo dõi'})).toBeTruthy()
})
