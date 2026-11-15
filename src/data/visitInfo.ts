import { t, localized } from '../i18n/locale'
import { destinations } from './destinations'

export type VisitInfo = {
  hours: string
  hoursNote: string
  address: string
  source?: { title: string; url: string }
  checkedOn?: string
  live?: boolean
  openNow?: boolean
}

const specificInfo: Record<string, VisitInfo> = localized({
  'cau-rong': { hours: "Điểm tham quan ngoài trời", hoursNote: "Chưa có lịch đóng/mở cố định được xác nhận. Việc tiếp cận cầu có thể thay đổi khi phân luồng giao thông hoặc tổ chức sự kiện.", address: "Cầu Rồng, Đà Nẵng." },
  'cau-song-han': { hours: "Điểm tham quan ngoài trời", hoursNote: "Chưa có lịch đóng/mở cố định được xác nhận. Tuân theo biển báo giao thông tại cầu; lịch vận hành cầu quay cần kiểm tra riêng.", address: "Cầu Sông Hàn, Đà Nẵng." },
  'bao-tang-da-nang': { hours: "08:00 – 17:00, các ngày trong tuần", hoursNote: "Giờ tham khảo; lịch ngày lễ hoặc sự kiện có thể thay đổi.", address: "42–44 Bạch Đằng và 31 Trần Phú, Đà Nẵng." },
  'cong-vien-apec': { hours: "Không gian công cộng ngoài trời", hoursNote: "Chưa có lịch đóng/mở cố định được xác nhận. Các khu vực trong nhà và sự kiện có thể có lịch riêng.", address: "Công viên APEC, Đà Nẵng." },
})

// Cả 15 địa điểm dùng chung cấu trúc này. Địa chỉ và nguồn vẫn phục vụ tìm kiếm,
// định tuyến và API dù không còn hiển thị trong bottom sheet.
export const visitInfo: Record<string, VisitInfo> = Object.fromEntries(destinations.map(place => [place.id, specificInfo[place.id] ?? {
  hours: t("Chưa có thông tin giờ mở cửa đã xác minh"),
  hoursNote: t("Giờ hoạt động có thể thay đổi. Hệ thống sẽ tự cập nhật khi Google Places được kết nối."),
  address: place.location,
  source: { title: t("Thông tin địa điểm"), url: place.sourceUrl },
}]))
