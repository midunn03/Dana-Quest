import './InformationPage.css'
import {useLocale} from './i18n/LocaleProvider'
import PlayerInformation from './PlayerInformation'
export default function InformationPage({privacy}:{privacy:boolean}){
 const {t}=useLocale()
 return <main className="journey-page information-page"><article className="journey-frame"><a href="#/dang-nhap" className="journey-underlink">‹ {t('Quay lại đăng nhập','Back to sign in')}</a><h1>{privacy?t('Quyền riêng tư','Privacy'):t('Điều khoản sử dụng','Terms of use')}</h1><PlayerInformation privacy={privacy}/><a href="#/kham-pha" className="journey-text-link">{t('Tiếp tục khám phá','Continue exploring')}</a></article></main>
}
