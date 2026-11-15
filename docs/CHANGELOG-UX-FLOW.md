# NHẬT KÝ THAY ĐỔI UX & LUỒNG TRẢI NGHIỆM (BIG-UPDATE 9)

Tài liệu ghi lại toàn bộ thay đổi luồng người dùng, tối ưu thao tác vào chơi, bản đồ và giao diện theo quy tắc bắt buộc.

---

## Bảng Cờ Tính Năng (`src/lib/uxFlags.ts`)

| Cờ (`key`) | Mặc định | Mô tả chức năng | Tắt cờ sẽ trở về |
| :--- | :---: | :--- | :--- |
| `FAST_START` | `true` | Bỏ qua các bước onboarding dài, cho phép vào thẳng bản đồ/StartHub | Luồng 3 màn Onboarding bắt buộc |
| `START_HUB` | `true` | Khối "Hành trình đầu tiên của bạn" & "Tiếp tục quest dở" trên Khám phá/Bản đồ | Ẩn StartHub, hiện Discovery mặc định |
| `NEXT_STEP_CHIP` | `true` | Chip nổi góc màn hình chỉ dẫn hành động kế tiếp người chơi nên làm | Ẩn chip chỉ dẫn |
| `GAME_MODE_BADGES` | `true` | Badge xanh/cam và bộ lọc 3 nút phân biệt Quest cốt truyện vs Địa điểm | Lưới thẻ không nhãn phân loại |
| `SAFETY_MODAL_FAST_START` | `true` | Hộp thoại an toàn 1 chạm khi bấm "Bắt đầu" thay vì checkbox khóa nút cuối trang | Bắt buộc tick checkbox `#quest-ack` |
| `ARRIVED_DIRECT_PLAY` | `true` | Nút "Tôi đã đến nơi" vào thẳng màn chơi mà không qua 2 lần xác nhận thừa | Hộp thoại tự xác nhận nhiều bước |
| `COACH_MARKS` | `true` | Hướng dẫn 5 bong bóng tương tác lần đầu trên bản đồ | Không hiện bong bóng |
| `MAP_ONE_KM` | `true` | Mở bản đồ trong bán kính 1 km quanh vị trí GPS (Giai đoạn 2) | Zoom toàn cảnh Đà Nẵng |
| `MOBILE_MAP_FIRST` | `true` | Ngân sách giao diện mobile: bản đồ >= 70-80% chiều cao (Giai đoạn 3) | Layout mobile cũ |
| `GUEST_MAP_FIRST` | `true` | Cho phép khách xem bản đồ trước khi đăng nhập | Chặn tại form đăng nhập |

---

## GIAI ĐOẠN 1: Tối ưu luồng vào chơi & Người chơi biết bắt đầu ở đâu

### 1. Thống kê số lần bấm (Đo lường trước và sau)

| Luồng người chơi | Trước Big-Update 9 | Sau Giai đoạn 1 | Cải thiện |
| :--- | :---: | :---: | :---: |
| **(a) Người mới: Quest cốt truyện** (Đăng nhập → Màn chơi đầu tiên) | **11–13 lần bấm** (qua 8 màn) | **3–4 lần bấm** | **Giảm ~70% số thao tác** |
| **(b) Người mới: Địa điểm nhiệm vụ** (Đăng nhập → Danh sách làm) | **9–11 lần bấm** | **3 lần bấm** | **Giảm ~67% số thao tác** |
| **(c) Người cũ quay lại: Tiếp tục quest dở** | **3–4 lần bấm** | **1–2 lần bấm** (qua StartHub / NextStepChip) | **Giảm 50% số thao tác** |
| **(d) Khách vãng lai xem bản đồ** | Bị chặn ở form đăng nhập | **1 lần bấm** ("Xem bản đồ ngay") | Không còn rào cản |

### 2. Danh sách tệp đã tạo mới và chỉnh sửa

| Tệp | Hành động | Mô tả thay đổi | Cờ liên quan |
| :--- | :---: | :--- | :--- |
| `src/lib/uxFlags.ts` | Tạo mới | Định nghĩa 10 cờ UX flags và hàm `isUxFlagEnabled` | Tất cả |
| `src/StartHub.tsx` & `.css` | Tạo mới | Trung tâm xuất phát: gợi ý quest đầu tiên với 3 bước đơn giản (① Đến điểm hẹn → ② Giải đố → ③ Nhận xu) hoặc tiếp tục quest dở | `START_HUB` |
| `src/NextStepChip.tsx` & `.css` | Tạo mới | Chip nổi ở đáy màn hình luôn chỉ dẫn hành động tiếp theo theo trạng thái thực tế | `NEXT_STEP_CHIP` |
| `src/HelpPage.tsx` & `.css` | Tạo mới | Trang `#/huong-dan` giải thích 2 kiểu chơi, cách kiếm xu, đổi quà và an toàn | - |
| `src/CoachMarks.tsx` & `.css` | Tạo mới | Bong bóng hướng dẫn làm quen 5 bước lần đầu, lưu khóa `dana-coach-marks-v1` | `COACH_MARKS` |
| `src/DiscoveryPage.tsx` & `.css` | Chỉnh sửa | Nhúng StartHub, badge phân loại 2 kiểu chơi, thanh lọc 3 nút ("Tất cả", "Quest cốt truyện", "Địa điểm"), sắp xếp theo khoảng cách GPS | `START_HUB`, `GAME_MODE_BADGES` |
| `src/QuestDetailsPage.tsx` | Chỉnh sửa | Bỏ khóa nút bởi checkbox đáy trang, mở modal an toàn 1 chạm khi bấm Bắt đầu, vào thẳng chơi nếu GPS < 50m | `SAFETY_MODAL_FAST_START`, `ARRIVED_DIRECT_PLAY` |
| `src/DueStartPage.tsx` | Chỉnh sửa | Thêm nút 1 chạm "Tôi đã đến nơi (Vào chơi ngay)" vào thẳng màn chơi | `ARRIVED_DIRECT_PLAY` |
| `src/AvatarPage.tsx` | Chỉnh sửa | Thêm nút "Dùng nhân vật gợi ý, chỉnh sau → Vào chơi ngay" 1 chạm | `FAST_START` |
| `src/OnboardingPage.tsx` | Chỉnh sửa | Thêm nút "Bỏ qua tất cả → Vào chơi ngay" trên các bước onboarding | `FAST_START` |
| `src/WelcomePage.tsx` | Chỉnh sửa | Thêm liên kết xem bản đồ ngay cho khách vãng lai | `GUEST_MAP_FIRST` |
| `src/App.tsx` | Chỉnh sửa | Khai báo route `#/huong-dan`, gắn `NextStepChip`, cập nhật `publicRoute` | `NEXT_STEP_CHIP` |
| `src/Explore.tsx` | Chỉnh sửa | Tích hợp StartHub overlay, CoachMarks, liên kết hướng dẫn | `START_HUB`, `COACH_MARKS` |
| `src/AccountExperience.tsx` | Chỉnh sửa | Thêm lối vào nhanh trang `#/huong-dan` | - |
| `tests/stage1-ux-flow.test.tsx` | Tạo mới | 8 test case tự động kiểm tra toàn bộ luồng Giai đoạn 1 | - |

---

## GIAI ĐOẠN 2: Bản đồ 1 km quanh GPS & Báo cáo 15 địa điểm

### 1. Báo cáo kiểm tra 15 địa điểm kiểu B trên bản đồ
- **Kiểm tra code:** `src/lib/mapEntries.ts` lấy danh sách điểm từ `quests` (`questCatalog.json`).
- **Đối chiếu:** `questCatalog.json` gồm **16 bản ghi**, trong đó:
  - 1 quest trường DUE (`due-dau-an-50-nam`).
  - **15 bản ghi còn lại** tương ứng 1-đối-1 chính xác với toàn bộ 15 địa điểm kiểu B trong `destinations.json` (Cầu Rồng, Chợ Hàn, Bán đảo Sơn Trà, Ngũ Hành Sơn, Bảo tàng Điêu khắc Chăm, Cầu Sông Hàn, Bãi biển Mỹ Khê, Chùa Linh Ứng Sơn Trà, Rạn Nam Ô, Cung Văn hóa Thiếu nhi, Công viên APEC, Bảo tàng Mỹ thuật, Làng đá Non Nước, Bãi Rạng, Đỉnh Bàn Cờ).
- **Kết luận:** Cả 15 địa điểm kiểu B **đều đã xuất hiện đầy đủ trên bản đồ** thông qua các marker tương ứng. Khi người dùng bấm vào marker hoặc thẻ địa điểm, hệ thống điều hướng đến trang chi tiết của địa điểm đó.

### 2. Các thay đổi đã thực hiện trong Giai đoạn 2

| Tệp | Hành động | Mô tả thay đổi | Cờ liên quan |
| :--- | :---: | :--- | :--- |
| `src/Explore.tsx` | Chỉnh sửa | Mặc định khởi tạo bản đồ ở mức zoom 15 căn giữa vị trí GPS người chơi (hoặc Cầu Rồng `[16.0601, 108.2236]` nếu không có GPS); tự động tính bounding box bán kính 1000m để fitBounds; vẽ vòng tròn đi bộ bán kính 1 km màu xanh `#216447`; thêm nút "🌐 Toàn thành phố" để phóng tầm nhìn toàn Đà Nẵng; thêm chip chỉ báo điểm quest/địa điểm gần nhất ngoài khung nhìn (khoảng cách <= 2.5 km) | `MAP_ONE_KM` |
| `src/Explore.css` | Chỉnh sửa | Style cho nút "🌐 Toàn thành phố" (`.atlas-city-fit-btn`), vòng tròn 1 km (`.atlas-one-km-circle`), và chip chỉ báo điểm ngoài khung nhìn (`.atlas-offscreen-chip`) | `MAP_ONE_KM` |
| `tests/stage2-map-one-km.test.tsx` | Tạo mới | 4 test case kiểm tra: (1) Mở bản đồ 1km quanh GPS, (2) Mở 1km quanh Cầu Rồng khi từ chối GPS, (3) Nút Toàn thành phố hoạt động, (4) Khi cờ MAP_ONE_KM tắt quay về toàn cảnh cũ | `MAP_ONE_KM` |

