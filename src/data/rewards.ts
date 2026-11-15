import { t, localized } from '../i18n/locale'
export const COINS_PER_MISSION=10
export type RewardCategory='postcard'|'drink'|'food'|'transport'|'admission'|'activity'|'souvenir'
export interface Reward {id:string;name:string;nameEn:string;category:RewardCategory;cost:number;benefit:string;benefitEn:string;validity:string|null;conditions:string[];description:string;demo:true}
const conditions=localized(["Vật phẩm kỷ niệm trong ứng dụng; chưa có đối tác thương mại.","Không có giá trị thanh toán, giao hàng, vé hoặc đặt chỗ thực."])
const catalog:[string,string,string,RewardCategory,number][]=localized([['postcard',"Bưu thiếp Đà Nẵng","Đà Nẵng postcard",'postcard',30],['drink',"Đồ uống địa phương",'Local drink','drink',50],['souvenir',"Quà lưu niệm",'City souvenir','souvenir',80],['local-food',"Mì Quảng","Mì Quảng",'food',70],['transport',"Hành trình thành phố",'City ride','transport',100],['admission',"Dấu ấn tham quan",'Sightseeing keepsake','admission',150],['outdoor-activity',"Chèo kayak",'Kayaking','activity',140]])
export const rewards:Reward[]=catalog.map(([id,name,nameEn,category,cost])=>({id,name,nameEn,category,cost,benefit:t("Lưu một kỷ niệm vào bộ sưu tập hành trình."),benefitEn:'Add a keepsake to your journey collection.',validity:null,conditions,description:conditions.join(' '),demo:true}))
