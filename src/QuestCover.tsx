import './QuestCover.css'
import { t } from './i18n/locale'
import {getDestination} from './data/destinations'
import {usePlaceData} from './lib/placeContent'
import {QuestArtwork} from './QuestPlayerUi'
import LandmarkArt from './LandmarkArt'
export default function QuestCover({id,credit=false}:{id:string;credit?:boolean}){
 const place=getDestination(id),custom=usePlaceData().content[id]
 if(!place)return <QuestArtwork/>
 const url=custom?custom.photos[0]?.url:place.photo?`${import.meta.env.BASE_URL}${place.photo.replace(/^\//,'')}`:undefined
 return <figure className="quest-cover">{url?<img src={url} alt={custom?.photos[0]?.caption||place.name}/>:<LandmarkArt id={id}/>} {credit&&<figcaption>{custom?.photos[0]?.credit||(!custom&&place.photoCredit)||t("Minh họa điểm đến")}</figcaption>}</figure>
}
