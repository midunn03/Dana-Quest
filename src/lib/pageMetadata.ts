import type {Locale} from '../i18n/locale'
/** Derive deployment URLs from the actual host; never publish an invented domain. */
export function updatePageMetadata(locale:Locale){
 const title=locale==='en'?'Dana Quest — Explore Da Nang, play a story':'Dana Quest — Khám phá Đà Nẵng qua những câu chuyện'
 const description=locale==='en'?'Choose a quest, explore real places in Da Nang and collect memories through stories and puzzles.':'Chọn quest, khám phá địa điểm thật ở Đà Nẵng và lưu kỷ niệm qua những câu chuyện, câu đố.'
 document.title=title;document.documentElement.lang=locale
 for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])document.querySelector(selector)?.setAttribute('content',description)
 for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])document.querySelector(selector)?.setAttribute('content',title)
 const home=new URL(import.meta.env.BASE_URL,window.location.origin)
 for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])document.querySelector(selector)?.setAttribute('content',new URL('dana-social.png',home).href)
 if(!['localhost','127.0.0.1','[::1]'].includes(home.hostname)){
  let link=document.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!link){link=document.createElement('link');link.rel='canonical';document.head.append(link)}link.href=home.href
  document.querySelector('meta[property="og:url"]')?.setAttribute('content',home.href)
 }
}
