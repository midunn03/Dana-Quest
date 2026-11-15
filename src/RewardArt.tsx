const rewardIds=new Set(['postcard','drink','souvenir','local-food','transport','admission','outdoor-activity'])
export default function RewardArt({id}:{id:string}){
 return <img className="reward-art-image" src={`${import.meta.env.BASE_URL}rewards/${rewardIds.has(id)?id:'souvenir'}.png`} alt="" aria-hidden="true" loading="lazy" width="256" height="256"/>
}
