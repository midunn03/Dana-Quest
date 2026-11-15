const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
(async()=>{
 const {createAccountData}=await import('../server/account-data.mjs');const directory=await fs.mkdtemp(path.join(os.tmpdir(),'dana-system-audit-'));
 const game=createAccountData(directory);await game.update('audit-user',{kind:'action',revision:0,action:{type:'assign',destinationId:'cau-rong',count:10}});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});let checked=0;
 try{for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height}});
  await context.route('**/api/**',async route=>{
   const req=route.request();const url=new URL(req.url());let status=200,body={};
   try{
    if(url.pathname.endsWith('/session'))body={user:{id:'audit-user',name:'Người kiểm tra',avatarId:'bien',storageMode:'account'}};
    else if(url.pathname.endsWith('/game'))body=req.method()==='GET'?await game.read('audit-user',url.searchParams.get('photos')||'meta'):await game.update('audit-user',req.postDataJSON());
    else if(url.pathname.endsWith('/quest-runs'))body={version:2,legacy:{version:1,destinations:{},redemptions:[]},quests:{}};
    else if(url.pathname.endsWith('/quest-codes')||url.pathname.includes('/recommendations/'))body={items:[]};
    else if(url.pathname.includes('/pixel/'))body={items:{},content:{}};
    else {status=503;body={error:'Dữ liệu trực tiếp không bật trong kiểm tra.'}}
   }catch(error){status=400;body={message:error.message}}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [route,heading] of [['kham-pha','Khám phá Đà Nẵng'],['tim-kiem','Tìm kiếm'],['quest-cua-toi','Quest của bạn'],['su-kien','Sự kiện sắp tới'],['tai-khoan','Tài khoản'],['album','Thư viện kỷ niệm'],['cua-hang',null],['dia-diem/cau-rong',null],['nhiem-vu/cau-rong','Nhiệm vụ của bạn'],['quest/due-dau-an-50-nam','DUE (Dấu ấn 50 năm)']]){
   await page.goto(`http://127.0.0.1:5174/#/${route}`);
   await page.locator('main').waitFor();if(heading)await page.getByRole('heading',{name:heading,exact:true}).waitFor();
   await page.getByRole('navigation',{name:'Điều hướng chính'}).waitFor();
   const fits=await page.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+1);
   if(!fits){await page.screenshot({path:path.join(directory,'overflow.png')});console.log(JSON.stringify({directory,route,width,overflow:await page.locator('main').evaluate(el=>[...el.querySelectorAll('*')].filter(node=>node.getBoundingClientRect().right>el.getBoundingClientRect().right+1).slice(0,12).map(node=>({tag:node.tagName,class:node.className,width:node.getBoundingClientRect().width,text:node.textContent.slice(0,80)})))}));}
   assert(fits,`${route} overflows at ${width}`);
   assert.deepEqual(errors,[],`${route} runtime errors`);checked++;
   if(width===390&&['tai-khoan','nhiem-vu/cau-rong'].includes(route))await page.screenshot({path:path.join(directory,route.replaceAll('/','-')+'.png')});
  }
  await context.close();console.log(`${width}x${height}: ten main screens PASS`);
 }console.log(JSON.stringify({checked,screenshots:directory}));}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
