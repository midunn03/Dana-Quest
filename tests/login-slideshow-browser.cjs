const {chromium} = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try {
  for(const [width,height] of [[390,844],[1440,900]]) {
   const context=await browser.newContext({viewport:{width,height}});
   const page=await context.newPage(); const errors=[]; page.on('pageerror', e=>errors.push(e.message));
   await page.clock.install();
   await page.goto('http://127.0.0.1:5174/#/');
   await page.getByRole('link',{name:'Bắt đầu khám phá'}).waitFor();
   await page.locator('.login-landing-photo').evaluateAll(images=>Promise.all(images.map(img=>img.complete ? Promise.resolve() : new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})}))));
   assert.equal(await page.locator('.login-landing-photo').count(),5);
   assert.equal(await page.locator('.login-brand').innerText(),'');
   const names=['cau-rong','cau-song-han','chua-linh-ung-bai-but','hai-van-quan','cong-vien-apec'];
   for(const name of names) {
    await page.clock.runFor(20000);
    assert((await page.locator('.login-landing-photo.is-active').getAttribute('src')).includes(name));
   }
   await page.clock.runFor(2000);
   assert.equal(await page.locator('.is-active').evaluate(el=>getComputedStyle(el).opacity),'1');
   await page.getByRole('button',{name:'Tạm dừng ảnh nền'}).click();
   await page.clock.runFor(40000);
   assert((await page.locator('.is-active').getAttribute('src')).includes('cong-vien-apec'));
   const dimensions=await page.locator('main').evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+1}));
   assert(!dimensions.overflow);
   await page.screenshot({path:path.join(__dirname,'visual',`login-slideshow-${width}.png`)});
   assert.deepEqual(errors,[]);
   console.log(JSON.stringify({width,height,loop:'5 photos / 20 seconds',pause:true,overflow:false,errors}));
   await context.close();
  }
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
