import './QuestCover.css'
import {useState} from 'react'
import {getDestination} from './data/destinations'
import {usePlaceData} from './lib/placeContent'
import {QuestArtwork} from './QuestPlayerUi'
import LandmarkArt from './LandmarkArt'

export default function QuestCover({id}:{id:string;credit?:boolean;sourceLink?:boolean}){
 const place=getDestination(id),custom=usePlaceData().content[id]
 const [failed,setFailed]=useState<string[]>([])
 if(!place)return <QuestArtwork/>
 const local=place.photo?`${import.meta.env.BASE_URL}${place.photo.replace(/^\//,'')}`:undefined
 const admin=custom?.photos.find(photo=>!failed.includes(photo.url))
 const url=admin?.url??(local&&!failed.includes(local)?local:undefined)
 return <figure className="quest-cover">{url?<img src={url} alt={admin?.caption||place.name} loading="lazy" decoding="async" onError={()=>setFailed(previous=>previous.includes(url)?previous:[...previous,url])}/>:<LandmarkArt id={id}/>}</figure>
}
