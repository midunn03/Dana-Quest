const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
(async()=>{
 const {createQuestRuns}=await import('../server/quest-runs.mjs');
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'dana-player-browser-'));
 const runs=createQuestRuns(directory);const questId='due-dau-an-50-nam';
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 for(const [width,height] of [[360,800],[390,844],[430,860],[844,390],[1280,720],[1440,900],[1920,1080]]){
  const owner=`fixture-${width}`;await runs.update(owner,{type:'start',questId});
  const context=await browser.newContext({viewport:{width,height}});
  await context.route('**/api/auth/**',async route=>{
   const request=route.request();const endpoint=new URL(request.url()).pathname;let body={};let status=200;
   try{
    if(endpoint.endsWith('/session'))body={user:{id:owner,name:'Người chơi thử',avatarId:'fixture',storageMode:'account'}};
    else if(endpoint.endsWith('/quest-runs'))body=request.method()==='GET'?await runs.read(owner):await runs.update(owner,request.postDataJSON());
    else if(endpoint.endsWith('/game'))body={revision:0,state:{version:1,destinations:{},redemptions:[]},photos:[]};
    else if(endpoint.endsWith('/quest-codes'))body={items:[]};
   }catch(error){status=400;body={message:error.message}}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:5174/#/quest/${questId}/chi-duong`);
  await page.getByRole('button',{name:'Xác nhận đã đến',exact:true}).waitFor();
  assert.equal(await page.getByRole('navigation',{name:'Điều hướng chính'}).isVisible(),false);
  await page.getByRole('tab',{name:'Bản đồ',exact:true}).click();
  await page.getByRole('region',{name:'Bản đồ điểm bắt đầu',exact:true}).waitFor();
  await page.getByRole('tab',{name:'Nhận diện',exact:true}).click();
  if(width===390||width===1440)await page.screenshot({path:path.join(directory,`arrival-${width}.png`)});
  await page.getByRole('button',{name:'Xác nhận đã đến',exact:true}).click();
  await page.getByRole('button',{name:'Tôi đã đến đúng điểm này',exact:true}).click();
  await page.getByRole('link',{name:'Bắt đầu quest',exact:true}).waitFor();
  await page.reload();await page.getByRole('link',{name:'Bắt đầu quest',exact:true}).click();
  await page.getByRole('button',{name:'Tiếp tục đến thử thách'}).waitFor();
  assert.equal(await page.getByRole('textbox').count(),0);
  assert.equal(await page.getByRole('navigation',{name:'Điều hướng chính'}).isVisible(),false);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const footer=await page.locator('.q-actions').boundingBox();assert(footer.y+footer.height<=height+1);
  await page.getByRole('button',{name:'Phóng to minh họa'}).click();
  await page.getByRole('button',{name:'Phóng to',exact:true}).click();
  await page.getByText('150%',{exact:true}).waitFor();await page.getByRole('button',{name:'Đóng bảng'}).click();
  await page.getByRole('button',{name:'Mở menu quest'}).click();
  await page.locator('.q-dialog').evaluate(async element=>{await Promise.all(element.getAnimations().map(animation=>animation.finished))});
  if(width===390||width===1440)await page.screenshot({path:path.join(directory,`menu-${width}.png`)});
  await page.getByRole('button',{name:'Tạm dừng quest'}).click();
  await page.getByRole('heading',{name:'Hành trình đang tạm dừng'}).waitFor();
  await page.getByRole('button',{name:'Tiếp tục quest'}).click();
  await page.getByRole('button',{name:'Tiếp tục đến thử thách'}).click();
  await page.getByRole('textbox').fill('72');await page.getByRole('button',{name:'Kiểm tra đáp án'}).click();
  await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('textbox').inputValue(),'72');
  await page.getByRole('button',{name:'Đọc lại câu chuyện hiện tại'}).click();
  await page.getByRole('button',{name:'Quay lại bước đang chơi'}).click();assert.equal(await page.getByRole('textbox').inputValue(),'72');
  await page.getByRole('button',{name:'Trợ giúp',exact:true}).click();
  await page.getByRole('button',{name:'Xem gợi ý quan sát',exact:true}).click();
  await page.getByRole('button',{name:'Đọc gợi ý',exact:true}).click();await page.getByText(/Chỉ tìm phần số nhà/).waitFor();
  await page.getByRole('button',{name:'Đóng bảng'}).click();
  await page.getByRole('button',{name:'Báo sự cố tại bước này'}).click();
  await page.getByRole('radio',{name:'Thử thách',exact:true}).check();
  await page.getByRole('dialog').getByRole('textbox').fill('Báo cáo thử nghiệm, không gửi trực tuyến.');
  const reportDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:'Tải báo cáo sự cố',exact:true}).click();
  assert.equal((await reportDownload).suggestedFilename(),'dana-quest-bao-cao.json');
  await page.getByRole('button',{name:'Đóng bảng'}).click();
  await page.getByRole('button',{name:'Mở trợ giúp'}).click();
  await page.getByRole('button',{name:/Câu hỏi thường gặp/}).click();
  await page.getByRole('searchbox').fill('GPS');await page.getByText('GPS không hoạt động thì làm sao?',{exact:true}).click();
  if(width===390||width===1440)await page.screenshot({path:path.join(directory,`faq-${width}.png`)});
  await page.getByRole('button',{name:'Đóng bảng'}).click();
  await page.getByRole('textbox').fill('71');await page.getByRole('button',{name:'Kiểm tra đáp án'}).click();
  await page.getByRole('heading',{name:'Bạn đã giải đúng!'}).waitFor();await page.reload();
  await page.getByRole('heading',{name:'Bạn đã giải đúng!'}).waitFor();
  assert.equal((await runs.read(owner)).quests[questId].completedCheckpointIds.length,1);
  await page.getByRole('button',{name:'Tiếp tục câu chuyện'}).click();
  await page.getByRole('button',{name:'Tiếp tục đến thử thách'}).click();
  await page.getByRole('radio',{name:'Năm 1975'}).check();
  if(width===390||width===1440)await page.screenshot({path:path.join(directory,`challenge-${width}.png`)});
  await page.getByRole('button',{name:'Kiểm tra đáp án'}).click();await page.getByRole('button',{name:'Xem tổng kết'}).click();
  await page.getByRole('heading',{name:'Hành trình đã hoàn thành'}).waitFor();await page.reload();
  await page.getByRole('heading',{name:'Hành trình đã hoàn thành'}).waitFor();
  assert.equal((await runs.read(owner)).quests[questId].completedCheckpointIds.length,2);assert.deepEqual(errors,[]);
  if(width===390||width===1440)await page.screenshot({path:path.join(directory,`results-${width}.png`)});
  if(width===390||width===1440){
   await page.getByRole('button',{name:'Mở menu quest'}).click();
   await page.getByRole('button',{name:/Ảnh kỷ niệm/}).click();
   await page.locator('input[type="file"]').setInputFiles({name:'memory.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=','base64')});
   await page.getByRole('img',{name:'Ảnh kỷ niệm đang xem trước'}).waitFor();
   const memoryDownload=page.waitForEvent('download');
   await page.getByRole('link',{name:'Tải ảnh về thiết bị',exact:true}).click();
   assert.equal((await memoryDownload).suggestedFilename(),'dana-quest-ky-niem.png');
   await page.getByRole('button',{name:'Bỏ ảnh đang xem',exact:true}).click();
   assert.equal(await page.getByRole('img',{name:'Ảnh kỷ niệm đang xem trước'}).count(),0);
   await page.getByRole('button',{name:'Đóng bảng'}).click();
   await page.getByRole('button',{name:'Mở menu quest'}).click();
   await page.getByRole('button',{name:/Rời màn chơi/}).click();
   await page.getByRole('button',{name:'Lưu và rời màn chơi',exact:true}).click();
   await page.getByRole('heading',{name:'Hẹn bạn ở hành trình tiếp theo'}).waitFor();
  }
  console.log(`${width}x${height}: full quest, reload, pause, wrong answer, layout PASS`);await context.close();
 }
 console.log(`Screenshots: ${directory}`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
