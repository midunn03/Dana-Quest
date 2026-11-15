// Export deterministic web sizes of the approved transparent logo with browser rendering.
// This packages the same artwork; no new drawing, color adjustment or AI variants.
const {chromium}=require(process.env.DANA_PLAYWRIGHT||'playwright')
const fs=require('node:fs/promises')
const path=require('node:path')
;(async()=>{
 const root=path.resolve(__dirname,'..'),output=path.join(root,'public/brand')
 const data=(await fs.readFile(path.join(root,'docs/art-direction/official-logo/transparent-master.png'))).toString('base64')
 const browser=await chromium.launch({headless:true,...(process.env.DANA_BROWSER?{executablePath:process.env.DANA_BROWSER}:{})})
 const image=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="239 71 1072 872"><image href="data:image/png;base64,${data}" width="1536" height="1024"/></svg>`
 const uri=`data:image/svg+xml;base64,${Buffer.from(image).toString('base64')}`
 try{
  await fs.mkdir(output,{recursive:true})
  for(const [name,width,height,padding,background] of [
   ['dana-quest-logo.png',640,521,0,'transparent'],
   ['icon-32.png',32,32,1,'transparent'],
   ['icon-180.png',180,180,18,'#F7F5EC'],
   ['icon-192.png',192,192,12,'transparent'],
   ['icon-512.png',512,512,32,'transparent'],
   ['icon-maskable-512.png',512,512,103,'#F7F5EC'],
   ['../dana-social.png',1200,630,48,'#F7F5EC'],
  ]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1})
   await page.setContent(`<html><head><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:${background}}body{padding:${padding}px;display:grid;place-items:center}img{width:100%;height:100%;min-height:0;object-fit:contain}</style></head><body><img alt="Dana Quest" src="${uri}"/></body></html>`)
   await page.locator('img').evaluate(img=>img.decode())
   await page.screenshot({path:path.resolve(output,name),omitBackground:background==='transparent'})
   await page.close()
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1})
