/**
 * DANA QUEST — CỜ BẬT/TẮT TÍNH NĂNG UX FLOW (BIG-UPDATE 9)
 * Tắt cờ sẽ trở về hành vi ban đầu của hệ thống.
 */

export const UX_FLAGS = {
  // Bật luồng vào nhanh: bỏ qua onboarding bắt buộc, đưa thẳng vào bản đồ/StartHub
  FAST_START: true,

  // Thẻ "Bắt đầu từ đây" (StartHub) hướng dẫn người mới và tiếp tục quest dở
  START_HUB: true,

  // Chip "Bước tiếp theo" (NextStepChip) ghim chỉ dẫn hành động kế tiếp
  NEXT_STEP_CHIP: true,

  // Phân biệt 2 kiểu chơi (Quest cốt truyện vs Địa điểm nhiệm vụ) trên thẻ
  GAME_MODE_BADGES: true,

  // Hộp thoại an toàn 1 chạm thay vì checkbox khóa nút ở đáy trang
  SAFETY_MODAL_FAST_START: true,

  // Nút "Tôi đã đến nơi" vào thẳng màn chơi mà không qua 2 lần xác nhận thừa
  ARRIVED_DIRECT_PLAY: true,

  // Hướng dẫn chỉ trỏ lần đầu (Coach marks, tối đa 5 bước, bỏ qua được)
  COACH_MARKS: true,

  // Bản đồ mở khung nhìn bán kính 1 km quanh GPS hiện tại
  MAP_ONE_KM: true,

  // Tối ưu ngân sách chiều cao cho điện thoại (bản đồ >= 70-80%)
  MOBILE_MAP_FIRST: true,

  // Cho phép khách vãng lai xem bản đồ trước khi đăng nhập
  GUEST_MAP_FIRST: true,
} as const

export type UxFlagKey = keyof typeof UX_FLAGS

export function isUxFlagEnabled(key: UxFlagKey): boolean {
  // Có thể ghi đè tạm thời qua localStorage nếu cần gỡ lỗi
  try {
    const override = localStorage.getItem(`dana-flag-${key.toLowerCase()}`)
    if (override !== null) {
      return override === 'true' || override === '1'
    }
  } catch {}
  return UX_FLAGS[key]
}
