import type { Destination } from './destinations'

export type MissionKind = 'arrival' | 'photo' | 'self'
export interface Mission { id: string; title: string; description: string; kind: MissionKind }

export function getMissions(place: Destination): Mission[] {
  const [firstActivity, secondActivity] = place.suggestedActivities
  const respectDescription = place.category === 'pagoda'
    ? 'Giữ yên tĩnh, ăn mặc phù hợp và làm theo nội quy không gian thờ tự.'
    : 'Quan sát và thực hiện nội quy tại điểm đến, giữ lối đi thông thoáng.'
  return [
    { id: 'arrival', title: `Có mặt tại ${place.name}`, description: `Dùng vị trí trình duyệt để kiểm tra bạn đang ở gần ${place.name}. Tọa độ là điểm tham chiếu, không thay thế lối vào chính xác.`, kind: 'arrival' },
    { id: 'overview-photo', title: `Góc nhìn về ${place.name}`, description: `Chụp hoặc tải ảnh cảnh quan ${place.name} từ vị trí an toàn, nơi được phép chụp ảnh.`, kind: 'photo' },
    { id: 'detail-photo', title: 'Một chi tiết đáng nhớ', description: `Lưu ảnh một chi tiết về ${place.name} mà bạn yêu thích. Tôn trọng nội quy chụp ảnh và quyền riêng tư.`, kind: 'photo' },
    { id: 'read', title: `Tìm hiểu ${place.name}`, description: `Đọc phần giới thiệu về ${place.name} và ${place.highlightReason.toLowerCase()}.`, kind: 'self' },
    { id: 'observe', title: 'Quan sát tại điểm đến', description: firstActivity ?? `Dừng ở nơi an toàn và dành một phút quan sát ${place.name}.`, kind: 'self' },
    { id: 'learn', title: 'Tìm một điều mới', description: `Tìm hiểu ${place.highlightReason.toLowerCase()} qua bảng thông tin hoặc quan sát tại chỗ.`, kind: 'self' },
    { id: 'walk', title: 'Trải nghiệm an toàn', description: secondActivity ?? `Khám phá ${place.name} trên lối được phép và phù hợp với điều kiện sức khỏe.`, kind: 'self' },
    { id: 'respect', title: 'Tôn trọng nội quy', description: respectDescription, kind: 'self' },
    { id: 'green', title: 'Không để lại rác', description: 'Giữ lại rác cá nhân để bỏ đúng nơi quy định; không chạm vào rác nguy hiểm.', kind: 'self' },
    { id: 'remember', title: 'Mang về một kỷ niệm', description: 'Dành một chút thời gian nghĩ về điều khiến bạn ấn tượng nhất tại điểm đến.', kind: 'self' },
  ]
}
