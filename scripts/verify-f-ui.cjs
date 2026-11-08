// Isolated visual fixtures: intercept every API call before navigation.
// Uses the host's existing Playwright; no project dependency is added.
const { chromium } = require(process.env.DANA_PLAYWRIGHT || 'playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const stage = process.argv[2] || 'after'
if (!['before', 'after'].includes(stage)) throw new Error('Expected before or after')
const output = process.env.DANA_ARTIFACT_DIR ? path.resolve(process.env.DANA_ARTIFACT_DIR,stage) : path.resolve(__dirname, '../tests/visual/group-f-2026-10-31', stage)
const base = process.env.DANA_UI_URL || 'http://127.0.0.1:5174/'
const screens = [['home','#/'],['discovery','#/kham-pha'],['map','#/map'],['play','#/quest/due-dau-an-50-nam/choi'],['account','#/tai-khoan'],['login','#/']]
;(async () => {
 await fs.mkdir(output,{recursive:true})
 const browser = await chromium.launch({headless:true,...(process.env.DANA_BROWSER ? {executablePath:process.env.DANA_BROWSER} : {})})
 const results=[]
 try {
  for(const width of (process.env.DANA_WIDTHS?process.env.DANA_WIDTHS.split(',').map(Number):[390,1440,320,768])) for(const language of (width===390||width===1440?['vi','en']:['vi'])) for(const [name,hash] of screens.filter(([name])=>!process.env.DANA_SCREENS||process.env.DANA_SCREENS.split(',').includes(name))){
   const guest=name==='login',height=width>=768?900:844
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',locale:language})
   await context.addInitScript(({language})=>{localStorage.setItem('dana-language:guest',language);localStorage.setItem('dana-language:account:f-ui',language)}, {language})
   const now=Date.now(),empty={version:1,destinations:{},redemptions:[]}
   const run={startedAt:now,arrivalConfirmedAt:now,arrivalMethod:'visual',completedCheckpointIds:[],completedAtByCheckpoint:{},catalogVersion:2,phase:'challenge',paused:false}
   await context.route('**/api/**',async route=>{
    const url=new URL(route.request().url()),p=url.pathname
    let status=200,body={items:[]}
    if(p.endsWith('/session')){status=guest?401:200;body=guest?{message:'Chưa đăng nhập.'}:{user:{id:'f-ui',name:'Người khám phá',avatarId:'bien',storageMode:'account'}}}
    else if(p.endsWith('/account'))body={version:1,profile:{displayName:'Người khám phá',bio:'',home:'Đà Nẵng',photoData:''},preferences:{language,leaderboard:false,marketing:false,inApp:false},messages:[]}
    else if(p.endsWith('/game'))body={revision:0,state:empty,photos:[]}
    else if(p.endsWith('/quest-runs'))body={version:2,legacy:empty,quests:{'due-dau-an-50-nam':run}}
    else if(p.endsWith('/wallet'))body={version:1,status:'ready',balance:100,entries:[],receipts:[]}
    else if(p.endsWith('/places'))body={managed:false,places:[],items:{}}
    else if(p.endsWith('/feed'))body={now:new Date(now).toISOString(),items:[]}
    else if(p.endsWith('/event-state'))body={events:{decisions:{},lastShown:0},enabled:false,serverNow:now,catalog:[]}
    else if(p.includes('/community'))body={items:[],reviews:[],rating:0,total:0,savedQuestIds:[],following:[]}
    await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)})
   })
   await context.route('**/tile.openstreetmap.org/**',route=>route.abort())
   const page=await context.newPage(),errors=[]
   page.on('pageerror',error=>errors.push(error.message))
   await page.goto(new URL(hash,base).href,{waitUntil:'networkidle'})
   await page.locator('main h1').first().waitFor({timeout:15000})
   if(name==='play')await page.locator('.q-actions').waitFor()
   if(name==='map')await page.locator('.atlas-sidebar').waitFor()
   await page.evaluate(()=>document.fonts.ready)
   const geometry=await page.evaluate(()=>{
    const main=document.querySelector('.app-shell>main'),nav=document.querySelector('.quest-main-nav'),actions=document.querySelector('.q-actions'),shell=document.querySelector('.app-shell')
    const visible=e=>e&&getComputedStyle(e).display!=='none'
    const scroll=document.querySelector('.q-scroll')||main
    const controls=[...document.querySelectorAll('.home-button,.px-button--ghost,.workspace-heading p,.active-mission-indicator small,.q-primary,.login-submit')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({selector:e.className||e.tagName,color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor}))
    return {overflow:main.scrollWidth>main.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,navVisible:!!visible(nav),navHeight:visible(nav)?nav.getBoundingClientRect().height:0,actionHeight:actions?.getBoundingClientRect().height||0,scrollHeight:scroll.clientHeight,navToken:getComputedStyle(shell).getPropertyValue('--px-nav-height').trim(),ink:getComputedStyle(shell).color,errors:[],lang:document.documentElement.lang,controls}
   })
   geometry.errors=errors
   if(process.env.DANA_LOGO_CHECK==='1'){
    geometry.logos=await page.locator('.brand-logo').evaluateAll(images=>images.map(img=>({src:img.currentSrc,loaded:img.complete&&img.naturalWidth===640,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height})))
    geometry.logoValid=geometry.logos.length>=2&&geometry.logos.every(logo=>logo.loaded&&logo.src.includes('/brand/dana-quest-logo.png')&&Math.abs(logo.width/logo.height-640/521)<.02)
   }
   if(stage==='after'&&['home','login'].includes(name)){
    const control=page.locator('.home-header .home-button').first()
    const normal=await control.evaluate(e=>getComputedStyle(e).backgroundColor)
    await control.hover()
    const hover=await control.evaluate(e=>getComputedStyle(e).backgroundColor)
    geometry.actionHover={normal,hover,changed:normal!==hover}
    await page.mouse.move(0,0)
   }
   results.push({name,width,language,...geometry})
   if(width===390||width===1440)await page.screenshot({path:path.join(output,`${name}-${language}-${width}.png`),animations:'disabled'})
   if(process.env.DANA_LOGO_CHECK==='1'&&name==='home'&&(width===390||width===1440)){
    await page.evaluate(()=>{
     const main=document.querySelector('.app-shell>main'),footer=document.querySelector('.home-footer'),header=document.querySelector('.home-header')
     main.scrollTop+=footer.getBoundingClientRect().top-main.getBoundingClientRect().top-header.getBoundingClientRect().height
    })
    await page.screenshot({path:path.join(output,`footer-${language}-${width}.png`),animations:'disabled'})
   }
   await context.close()
  }
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2))
  const failures=results.filter(r=>r.overflow||r.errors.length||r.name==='play'&&(r.navVisible||r.actionHeight!==(r.width>=768?80:112)||r.scrollHeight<100)||r.name!=='play'&&(!r.navVisible||r.navHeight!==(r.width>=768?80:112))||r.lang!==r.language||r.actionHover&&!r.actionHover.changed||r.logoValid===false)
  process.stdout.write(JSON.stringify({stage,cases:results.length,failures},null,2))
  if(failures.length)process.exitCode=1
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1})
