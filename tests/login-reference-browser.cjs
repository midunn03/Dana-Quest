const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const results = [];
  try {
    for (const [width,height] of [[320,568],[360,800],[390,844],[430,860],[844,390],[1280,720],[1440,900]]) {
      const context = await browser.newContext({ viewport:{width,height}, reducedMotion:'reduce' });
      let submissions = 0;
      await context.route('**/api/auth/**', async route => {
        if (route.request().url().endsWith('/login')) { submissions++; await new Promise(resolve => setTimeout(resolve,200)); }
        await route.fulfill({ status:401,contentType:'application/json',body:JSON.stringify({message:'Thông tin đăng nhập chưa chính xác.'}) });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      async function check(stage) {
        const data = await page.evaluate(() => {
          const main = document.querySelector('main'); const panel = document.querySelector('.login-sheet');
          const r = panel?.getBoundingClientRect();
          return { mainOverflow:main.scrollWidth > main.clientWidth+1, panelOverflow:panel ? panel.scrollWidth > panel.clientWidth+1 : false, panel:r ? {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width} : null, scrollable:panel ? panel.scrollHeight>panel.clientHeight : main.scrollHeight>main.clientHeight };
        });
        assert(!data.mainOverflow && !data.panelOverflow, `${stage} overflow ${width}`);
        if(data.panel) assert(data.panel.x>=0 && data.panel.right<=width+1, `sheet outside viewport ${width}`);
        results.push({width,height,stage,...data});
        if([390,1440].includes(width)) await page.screenshot({path:path.join(__dirname,'visual',`login-reference-${stage}-${width}.png`)});
      }
      await page.goto('http://127.0.0.1:5174/#/');
      await page.getByLabel('Tên đăng nhập hoặc Email').waitFor();
      await check('home');
      assert.equal(await page.getByRole('dialog').count(),0);
      assert.equal(await page.getByRole('button',{name:/Google|Apple/}).count(),0);
      await page.getByLabel('Tên đăng nhập hoặc Email').fill('layout-fixture');
      await page.getByLabel('Mật khẩu',{exact:true}).fill('test-password');
      await page.getByRole('button',{name:'Hiện mật khẩu'}).click();
      assert.equal(await page.getByLabel('Mật khẩu',{exact:true}).getAttribute('type'),'text');
      await page.getByRole('button',{name:'Ẩn mật khẩu'}).click();
      await check('form');
      await page.locator('.login-submit').click();
      await page.getByRole('alert').filter({hasText:'Thông tin đăng nhập chưa chính xác.'}).waitFor();
      assert.equal(submissions,1);
      assert.equal(await page.getByLabel('Tên đăng nhập hoặc Email').inputValue(),'layout-fixture');
      assert.equal(await page.getByLabel('Mật khẩu',{exact:true}).inputValue(),'test-password');
      await check('error');
      await page.locator('.login-inline-tabs').getByRole('button',{name:'Đăng ký',exact:true}).click();
      await page.getByRole('heading',{name:'Tạo tài khoản',exact:true}).waitFor();
      assert.equal(await page.getByLabel('Mật khẩu',{exact:true}).inputValue(),'');
      await check('register');
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(),0);
      await page.getByLabel('Tên người dùng').waitFor();
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log(JSON.stringify({checked:results.length,results},null,2));
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

