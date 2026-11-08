const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const results=[];
 try{
  for(const [width,height] of [[360,800],[390,844],[430,860],[844,390],[1280,720],[1440,900],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},permissions:['geolocation'],geolocation:{latitude:16.0544,longitude:108.2022}});
   let logged=false;let avatar=null;let activated=false;const user=()=>({id:'journey-fixture',name:'Người chơi thử',avatarId:avatar,storageMode:'account'});
   await context.route('**/api/auth/**',async route=>{
    const p=new URL(route.request().url()).pathname;let status=200;let body={};
    if(p.endsWith('/session')){status=logged?200:401;body=logged?{user:user()}:{message:'Chưa đăng nhập.'}}
    else if(p.endsWith('/register')||p.endsWith('/login')){logged=true;body={user:user()}}
    else if(p.endsWith('/profile/avatar')){avatar=route.request().postDataJSON().avatarId;body={user:user()}}
    else if(p.endsWith('/quest-codes/redeem')){const code=route.request().postDataJSON().code;if(code==='INVALID'){status=400;body={message:'Không tìm thấy mã Dana Quest này.'}}else{activated=true;body={questId:'due-dau-an-50-nam',redeemedAt:1}}}
    else if(p.endsWith('/quest-codes'))body={items:activated?[{questId:'due-dau-an-50-nam',redeemedAt:1}]:[]};
    else if(p.endsWith('/quest-runs'))body={version:2,legacy:{version:1,destinations:{},redemptions:[]},quests:{}};
    else if(p.endsWith('/game'))body={revision:0,state:{version:1,destinations:{},redemptions:[]},photos:[]};
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
   });
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:5174/#/');
   await page.getByRole('link',{name:'Bắt đầu khám phá'}).click();
   await page.getByRole('link',{name:/Bạn đã có mã quest/}).click();
   await page.getByRole('link',{name:'Không có mã? Khám phá các quest'}).click();
   await page.getByRole('heading',{name:'Bạn muốn khám phá Đà Nẵng, đúng không?'}).waitFor();
   await page.getByRole('searchbox').fill('London');assert(await page.getByRole('button',{name:'Đúng, khám phá Đà Nẵng'}).isDisabled());
   await page.getByRole('searchbox').fill('Da Nang');
   await page.getByRole('button',{name:'Dùng vị trí chính xác của tôi'}).click();
   await page.getByRole('status').filter({hasText:'Bạn đang ở gần Đà Nẵng'}).waitFor();
   await page.getByRole('button',{name:'Đúng, khám phá Đà Nẵng'}).click();
   assert(await page.getByRole('button',{name:'Tiếp tục',exact:true}).isDisabled());
   await page.getByRole('radio',{name:/Đang lên kế hoạch/}).check();
   await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
   await page.getByRole('button',{name:'Xem các quest của tôi'}).click();
   await page.getByRole('heading',{name:'Khám phá Đà Nẵng'}).waitFor();
   assert.equal(await page.locator('.discovery-card').count(),16);
   await page.goto('http://127.0.0.1:5174/#/kich-hoat');
   await page.getByRole('link',{name:/Tôi có mã Dana Quest/}).click();
   await page.getByRole('link',{name:'Đăng nhập để nhập mã'}).click();
   await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
   await page.getByLabel('Tên người dùng',{exact:true}).fill('journey-fixture');
   await page.getByLabel('Mật khẩu',{exact:true}).fill('fixture-password');
   await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
   await page.getByRole('heading',{name:'Tùy chỉnh nhân vật'}).waitFor();
   assert.equal(await page.getByRole('group',{name:'Các nhân vật',exact:true}).count(),0);
   await page.getByRole('button',{name:'Nữ',exact:true}).click();
   await page.getByRole('button',{name:'Mullet',exact:true}).click();
   await page.getByRole('button',{name:'Xác nhận nhân vật',exact:true}).click();
   await page.getByLabel('Mã Dana Quest',{exact:true}).fill('INVALID');
   await page.getByRole('button',{name:'Kích hoạt quest',exact:true}).click();
   await page.getByRole('alert').filter({hasText:'Không tìm thấy mã'}).waitFor();
   await page.getByLabel('Mã Dana Quest',{exact:true}).fill('DQ'+'A'.repeat(24));
   await page.getByRole('button',{name:'Kích hoạt quest',exact:true}).click();
   await page.getByRole('heading',{name:'Đã kích hoạt quest'}).waitFor();
   await page.getByRole('link',{name:'Xem quest đã kích hoạt'}).click();
   await page.getByRole('link',{name:/DUE/}).waitFor();
   assert(avatar.startsWith('c1.f.'));
   for(const [route,name] of [['bat-dau/thanh-pho','Bạn muốn khám phá Đà Nẵng, đúng không?'],['bat-dau/ke-hoach','Hiện tại, bạn đang…'],['bat-dau/gioi-thieu','Câu chuyện ở lại sau mỗi câu đố.'],['kich-hoat','Bạn đã kích hoạt quest chưa?'],['nhap-ma','Kích hoạt quest của bạn'],['nhan-vat','Tùy chỉnh nhân vật']]){
    await page.goto(`http://127.0.0.1:5174/#/${route}`);
    await page.getByRole('heading',{name,exact:true}).waitFor();
    const layout=await page.locator('main').evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+1,width:el.clientWidth,height:el.clientHeight,scroll:el.scrollHeight}));
    assert(!layout.overflow,`${route} horizontal overflow ${width}`);
    results.push({width,height,route,...layout});
    if([390,1440].includes(width))await page.screenshot({path:path.join(__dirname,'visual',`journey-${route.replaceAll('/','-')}-${width}.png`)});
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(JSON.stringify({checked:results.length,results},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
