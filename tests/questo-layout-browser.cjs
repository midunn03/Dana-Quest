// Standalone browser check. All session/game fixtures stay in this isolated browser.
const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const results = [];
  try {
    for (const [width, height] of [[360,800],[390,844],[430,860],[844,390],[1280,720],[1440,900],[1920,1080]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:5174/#/dang-nhap');
      await page.getByRole('dialog', { name: 'Đăng nhập hoặc tạo tài khoản' }).waitFor();
      await page.getByRole('button', { name: 'Tiếp tục với tài khoản' }).click();
      const login = await page.evaluate(() => {
        const main = document.querySelector('main');
        return { overflow: main.scrollWidth > main.clientWidth + 1, scrollable: main.scrollHeight > main.clientHeight, nav: getComputedStyle(document.querySelector('.bottom-nav')).display };
      });
      assert.equal(login.overflow, false, `login overflow at ${width}`);
      assert.equal(login.nav, 'none');
      await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
      await page.getByRole('heading', { name: 'Tạo tài khoản', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Đăng nhập ngay', exact: true }).click();
      if ([390,1440].includes(width)) await page.screenshot({ path: path.join(__dirname, 'visual', `questo-login-${width}.png`) });
      await context.route('**/api/auth/**', async route => {
        const pathname = new URL(route.request().url()).pathname;
        const body = pathname.endsWith('/session') ? { user: { id: 'browser-fixture', name: 'Người chơi thử', avatarId: 'bien', storageMode: 'account' } }
          : pathname.endsWith('/game') ? { revision: 0, state: { version: 1, destinations: {}, redemptions: [] }, photos: [] } : pathname.endsWith('/quest-codes') ? { items: [] } : {};
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      });
      await page.goto('http://127.0.0.1:5174/#/kham-pha');
      await page.reload();
      await page.getByRole('heading', { name: 'Khám phá Đà Nẵng' }).waitFor();
      for (const route of ['#/kham-pha', '#/tim-kiem', '#/quest-cua-toi', '#/tai-khoan', '#/su-kien']) {
        await page.goto(`http://127.0.0.1:5174/${route}`);
        await page.locator('main').waitFor();
        const geometry = await page.evaluate(() => {
          const main = document.querySelector('main');
          const nav = document.querySelector('.bottom-nav');
          const mr = main.getBoundingClientRect(); const nr = nav.getBoundingClientRect();
          return { overflow: main.scrollWidth > main.clientWidth + 1, navY: nr.y, mainY: mr.y, mainBottom: mr.bottom, navBottom: nr.bottom, links: [...nav.querySelectorAll('a')].map(a => ({ width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height })), cards: getComputedStyle(document.querySelector('.discovery-grid') || main).gridTemplateColumns };
        });
        assert.equal(geometry.overflow, false, `${route} overflow at ${width}`);
        assert(geometry.links.every(link => link.width >= 44 && link.height >= 44), `touch targets at ${width}`);
        if (width < 768) assert(geometry.mainBottom <= geometry.navY + 1, `mobile nav overlap at ${width}`);
        else assert(geometry.mainY >= geometry.navBottom - 1, `desktop header overlap at ${width}`);
        results.push({ width, height, route, ...geometry });
      }
      await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name:'Tìm kiếm', exact:true }).click();
      await page.getByRole('searchbox').fill('cau rong');
      await page.getByRole('link', { name: /Cầu Rồng/ }).waitFor();
      assert.equal(await page.locator('.discovery-card').count(), 1);
      await page.getByRole('searchbox').fill('zzzznothing');
      await page.getByRole('heading', { name:'Không tìm thấy quest phù hợp.' }).waitFor();
      await page.getByRole('button', { name:'Xóa tìm kiếm' }).click();
      assert.equal(await page.locator('.discovery-card').count(), 16);
      await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name:'Quest', exact:true }).click();
      await page.getByRole('heading', { name:'Hành trình đầu tiên đang chờ bạn' }).waitFor();
      await page.getByRole('link', { name:'Thư viện ảnh', exact:true }).click();
      await page.getByRole('heading', { name:'Thư viện kỷ niệm' }).waitFor();
      await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name:'Khám phá', exact:true }).click();
      if ([390,1440].includes(width)) await page.screenshot({ path: path.join(__dirname, 'visual', `questo-discovery-${width}.png`) });
      await page.getByRole('link', { name:'Bản đồ', exact:true }).click();
      await page.getByRole('region', { name:'Khám phá bản đồ', exact:true }).waitFor();
      await page.getByRole('link', { name:'Danh sách quest', exact:true }).click();
      await page.getByRole('heading', { name:'Khám phá Đà Nẵng' }).waitFor();
      assert.deepEqual(errors, [], `browser errors at ${width}`);
      await context.close();
    }
    console.log(JSON.stringify({ checked: results.length, results }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
