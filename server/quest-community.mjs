import {readFileSync} from 'node:fs'
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises'
import {dirname} from 'node:path'
import {createHash} from 'node:crypto'
const fail=message=>Object.assign(new Error(message),{status:400})
const fresh=()=>({version:1,favorites:{},followers:{},reviews:{}})
const ids=new Set(['questCatalog','destinations','historicalDestinations'].flatMap(name=>JSON.parse(readFileSync(new URL('../src/data/'+name+'.json',import.meta.url),'utf8')).map(item=>item.id)))
export const isCommunityQuest=id=>ids.has(id)
const creatorId='dana-quest-studio'
export function createQuestCommunity(file){
 let queue=Promise.resolve()
 async function read(){try{const value=JSON.parse(await readFile(file,'utf8'));if(value.version!==1||!value.favorites||!value.followers||!value.reviews)throw Error();return value}catch(error){if(error.code==='ENOENT')return fresh();throw Object.assign(new Error('Chưa đọc được dữ liệu cộng đồng. Dữ liệu cũ được giữ nguyên.'),{status:422})}}
 function mutate(fn){const task=queue.then(async()=>{const data=await read();const result=fn(data);await mkdir(dirname(file),{recursive:true});await writeFile(`${file}.tmp`,JSON.stringify(data),{mode:0o600});await rename(`${file}.tmp`,file);return result});queue=task.catch(()=>{});return task}
 const own=(data,owner)=>({favorites:data.favorites[owner]||[],following:data.followers[owner]||[],reviews:Object.fromEntries(Object.entries(data.reviews).flatMap(([id,items])=>items[owner]?[[id,items[owner]]]:[]))})
 return {
  private:async owner=>own(await read(),owner),
  public:async id=>{const data=await read(),reviews=Object.entries(data.reviews[id]||{}).map(([owner,value])=>({...value,id:createHash('sha256').update(owner).digest('hex').slice(0,20)})).sort((a,b)=>b.updatedAt-a.updatedAt);const allReviews=Object.values(data.reviews).flatMap(items=>Object.values(items));return {creatorRating:allReviews.length?allReviews.reduce((sum,item)=>sum+item.rating,0)/allReviews.length:null,creatorReviewCount:allReviews.length,reviews:reviews.slice(0,50),reviewCount:reviews.length,rating:reviews.length?reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length:null,followers:Object.values(data.followers).filter(ids=>ids.includes(creatorId)).length}},
  update:(owner,input,name='Người khám phá')=>mutate(data=>{
   if(typeof owner!=='string'||!/^[-\w]{1,80}$/.test(owner))throw fail('Tài khoản không hợp lệ.')
   if(input.action==='favorite'||input.action==='follow'){
    const follow=input.action==='follow',id=follow?input.creatorId:input.questId
    if((follow?id!==creatorId:!isCommunityQuest(id))||typeof input.enabled!=='boolean')throw fail('Lựa chọn không hợp lệ.')
    const field=follow?'followers':'favorites',ids=new Set(data[field][owner]||[])
    if(input.enabled)ids.add(id);else ids.delete(id)
    data[field][owner]=[...ids]
   }else if(input.action==='review'){
    if(!isCommunityQuest(input.questId)||!Number.isInteger(input.rating)||input.rating<1||input.rating>5||typeof input.comment!=='string'||input.comment.trim().length<5||input.comment.length>1500)throw fail('Chọn 1 đến 5 sao và viết từ 5 đến 1500 ký tự.')
    const items=data.reviews[input.questId]??={},previous=items[owner],now=Date.now()
    if(previous&&now-previous.updatedAt<10000)throw Object.assign(new Error('Chờ 10 giây trước khi cập nhật đánh giá.'),{status:429})
    items[owner]={displayName:String(name).slice(0,80),rating:input.rating,comment:input.comment.trim(),createdAt:previous?.createdAt||now,updatedAt:now}
   }else throw fail('Thao tác không được hỗ trợ.')
   return own(data,owner)
  }),
  removeOwner:owner=>mutate(data=>{delete data.favorites[owner];delete data.followers[owner];for(const items of Object.values(data.reviews))delete items[owner]})
 }
}
