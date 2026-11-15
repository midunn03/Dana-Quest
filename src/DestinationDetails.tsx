import './DestinationDetails.css'
import { t } from './i18n/locale'
import QuestDetailsPage from './QuestDetailsPage'
import {getDestination} from './data/destinations'
export default function DestinationDetails({id}:{id:string}){return getDestination(id)?<QuestDetailsPage id={id}/>:<main className="screen-page"><h1>{t("Không tìm thấy điểm đến")}</h1><a href="#/map">{t("← Bản đồ")}</a></main>}
