import { t, interpolate } from '../i18n/locale'
import type { Destination } from './destinations'

export type MissionKind = 'arrival' | 'photo' | 'self'
export interface Mission { id: string; title: string; description: string; kind: MissionKind }

export function getMissions(place: Destination): Mission[] {
  const [firstActivity, secondActivity] = place.suggestedActivities
  const respectDescription = place.category === 'pagoda'
    ? t("Giữ yên tĩnh, ăn mặc phù hợp và làm theo nội quy không gian thờ tự.")
    : t("Quan sát và thực hiện nội quy tại điểm đến, giữ lối đi thông thoáng.")
  return [
    { id: 'arrival', title: interpolate("Có mặt tại ${0}",[place.name]), description: interpolate("Dùng vị trí trình duyệt để kiểm tra bạn đang ở gần ${0}. Tọa độ là điểm tham chiếu, không thay thế lối vào chính xác.",[place.name]), kind: 'arrival' },
    { id: 'overview-photo', title: interpolate("Góc nhìn về ${0}",[place.name]), description: interpolate("Chụp hoặc tải ảnh cảnh quan ${0} từ vị trí an toàn, nơi được phép chụp ảnh.",[place.name]), kind: 'photo' },
    { id: 'detail-photo', title: t("Một chi tiết đáng nhớ"), description: interpolate("Lưu ảnh một chi tiết về ${0} mà bạn yêu thích. Tôn trọng nội quy chụp ảnh và quyền riêng tư.",[place.name]), kind: 'photo' },
    { id: 'read', title: interpolate("Tìm hiểu ${0}",[place.name]), description: interpolate("Đọc phần giới thiệu về ${0} và ${1}.",[place.name,place.highlightReason.toLowerCase()]), kind: 'self' },
    { id: 'observe', title: t("Quan sát tại điểm đến"), description: firstActivity ?? interpolate("Dừng ở nơi an toàn và dành một phút quan sát ${0}.",[place.name]), kind: 'self' },
    { id: 'learn', title: t("Tìm một điều mới"), description: interpolate("Tìm hiểu ${0} qua bảng thông tin hoặc quan sát tại chỗ.",[place.highlightReason.toLowerCase()]), kind: 'self' },
    { id: 'walk', title: t("Trải nghiệm an toàn"), description: secondActivity ?? interpolate("Khám phá ${0} trên lối được phép và phù hợp với điều kiện sức khỏe.",[place.name]), kind: 'self' },
    { id: 'respect', title: t("Tôn trọng nội quy"), description: respectDescription, kind: 'self' },
    { id: 'green', title: t("Không để lại rác"), description: t("Giữ lại rác cá nhân để bỏ đúng nơi quy định; không chạm vào rác nguy hiểm."), kind: 'self' },
    { id: 'remember', title: t("Mang về một kỷ niệm"), description: t("Dành một chút thời gian nghĩ về điều khiến bạn ấn tượng nhất tại điểm đến."), kind: 'self' },
  ]
}
