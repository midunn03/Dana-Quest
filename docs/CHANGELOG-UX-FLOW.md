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
  - **15 bản ghi còn lại** tương ứng 1-đối-1 chính xác với toàn bộ 15 địa điểm active trong `src/data/destinations.json` (Cầu Rồng, Cầu Sông Hàn, Bảo tàng Đà Nẵng, Bảo tàng Điêu khắc Chăm, Công viên APEC, Cầu Tình Yêu, Bãi biển Mỹ Khê, Công viên Biển Đông, Bãi biển Mân Thái (SUP), Chùa Linh Ứng Bãi Bụt, Đỉnh Bàn Cờ, Hải Vân Quan, Danh thắng Ngũ Hành Sơn, Cầu Vàng trong Bà Nà Hills, Bãi biển Nam Ô; Chợ Hàn chỉ giữ trong `historicalDestinations.json` để bảo toàn tiến độ cũ).
- **Kết luận:** Cả 15 địa điểm kiểu B **đều đã xuất hiện đầy đủ trên bản đồ** thông qua các marker tương ứng. Khi người dùng bấm vào marker hoặc thẻ địa điểm, hệ thống điều hướng đến trang chi tiết của địa điểm đó.

### 2. Các thay đổi đã thực hiện trong Giai đoạn 2

| Tệp | Hành động | Mô tả thay đổi | Cờ liên quan |
| :--- | :---: | :--- | :--- |
| `src/Explore.tsx` | Chỉnh sửa | Mặc định khởi tạo bản đồ ở mức zoom 15 căn giữa vị trí GPS người chơi (hoặc Cầu Rồng `[16.0601, 108.2236]` nếu không có GPS); tự động tính bounding box bán kính 1000m để fitBounds; vẽ vòng tròn đi bộ bán kính 1 km màu xanh `#216447`; thêm nút "🌐 Toàn thành phố" để phóng tầm nhìn toàn Đà Nẵng; thêm chip chỉ báo điểm quest/địa điểm gần nhất ngoài khung nhìn (khoảng cách <= 2.5 km) | `MAP_ONE_KM` |
| `src/Explore.css` | Chỉnh sửa | Style cho nút "🌐 Toàn thành phố" (`.atlas-city-fit-btn`), vòng tròn 1 km (`.atlas-one-km-circle`), và chip chỉ báo điểm ngoài khung nhìn (`.atlas-offscreen-chip`) | `MAP_ONE_KM` |
| `tests/stage2-map-one-km.test.tsx` | Tạo mới | 4 test case kiểm tra: (1) Mở bản đồ 1km quanh GPS, (2) Mở 1km quanh Cầu Rồng khi từ chối GPS, (3) Nút Toàn thành phố hoạt động, (4) Khi cờ MAP_ONE_KM tắt quay về toàn cảnh cũ | `MAP_ONE_KM` |

---

## GIAI ĐOẠN 3: Tối ưu thiết kế giao diện điện thoại & Ngân sách bản đồ >= 70%

### 1. Số đo ngân sách chiều cao bản đồ thực tế

Áp dụng ngân sách layout cho mobile: Header nổi (`0px` layout height), Bottom nav (`54px` + safe-area), Bottom sheet trạng thái nghỉ (`72px` peek height).

| Kích thước màn hình | Chiều cao khung nhìn | Chiều cao bản đồ nhìn thấy | Tỷ lệ diện tích bản đồ | Yêu cầu kỹ thuật | Đạt chuẩn |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **360 × 640** (máy nhỏ) | 640 px | 514 px | **80.3%** | $\ge 60\%$ | **ĐẠT** |
| **375 × 667** (iPhone SE) | 667 px | 541 px | **81.1%** | $\ge 70\%$ | **ĐẠT** |
| **390 × 844** (iPhone 12/13/14) | 844 px | 718 px | **85.0%** | $\ge 70\%$ | **ĐẠT** |
| **412 × 915** (Pixel / Galaxy) | 915 px | 789 px | **86.2%** | $\ge 70\%$ | **ĐẠT** |
| **768 × 1024** (iPad portrait) | 1024 px | 898 px | **87.7%** | $\ge 70\%$ | **ĐẠT** |
| **844 × 390** (Landscape ngang) | 390 px | 292 px (nav 44px, peek 54px) | **74.8%** | $\ge 70\%$ | **ĐẠT** |

### 2. Các thay đổi đã thực hiện trong Giai đoạn 3

| Tệp | Hành động | Mô tả thay đổi | Cờ liên quan |
| :--- | :---: | :--- | :--- |
| `src/mobile/MobileMap.css` | Tạo mới | Quy tắc CSS chuyên biệt cho mobile map: header nổi `position: absolute`, bản đồ full-bleed 100%, bottom sheet 3 mức (peek ~72px, half ~45vh, full ~85vh), nút vị trí tròn 48px, thanh điều hướng <= 56px, hỗ trợ xoay ngang landscape (nav icon) | `MOBILE_MAP_FIRST` |
| `src/App.tsx` | Chỉnh sửa | Import `MobileMap.css`; gắn class `device-mobile-header--floating-map` trên route bản đồ khi mobile để header không đẩy bản đồ xuống; giữ nguyên StreakChip nổi theo yêu cầu người dùng | `MOBILE_MAP_FIRST` |
| `src/Explore.tsx` | Chỉnh sửa | Tích hợp thanh kéo grabber và gesture pointer 3 nấc (peek/half/full); nút "Vị trí của tôi" nổi tròn 48px; tính khoảng cách GPS trên thẻ chọn điểm gọn <= 140px | `MOBILE_MAP_FIRST` |
| `tests/stage3-mobile-map.test.tsx` | Tạo mới | 7 test case tự động kiểm tra: tỷ lệ bản đồ trên 6 kích thước màn hình, gesture kéo 3 nấc bottom sheet, nút vị trí tròn 48px, thẻ chọn điểm, hiển thị StreakChip nổi, và bố cục desktop không bị ảnh hưởng | `MOBILE_MAP_FIRST` |

---

## GIAI ĐOẠN 4: Gói trả phí Plus/Pro, Chỉ đường ?tu=map, Đồng bộ Mobile Shell & Rà soát 4 giai đoạn (22/11/2026)

Hoàn thiện hệ thống gói trả phí hàng tháng, đồng bộ giao diện Điện thoại với Web, mở rộng Drawer Tài khoản 13 mục, khôi phục thanh cuộn màn chơi quest, và thực hiện rà soát & sửa lỗi toàn hệ thống qua 4 giai đoạn (loại bỏ lỗi TypeScript, lint, hooks/impure render, i18n, state hủy gói).

| File / Hạng mục | Thao tác | Mô tả chi tiết | Ghi chú / Quy tắc |
| --- | --- | --- | --- |
| `src/lib/premium.ts`, `src/PremiumPricingModal.tsx`, `src/QuestDetailsPage.tsx`, `src/AccountSettings.tsx` | Chỉnh sửa | Triển khai Gói Plus (`30.000đ/tháng`, mở khóa `cau-rong`) và Gói Pro (`50.000đ/tháng`, mở khóa `cau-vang-ba-na-hills`, `ngu-hanh-son`, 2 voucher nhóm); hỗ trợ mã nội bộ `DN100` giảm 100% và tái sử dụng sau hủy gói; `cancelPremiumPlan` giữ lại voucher `source === 'code'` | Tuyệt đối không công khai mã `DN100` trên UI web; ổn định `[startLat, startLng]` `useMemo` & copy `.qd-testing` |
| `src/NavigationPage.tsx`, `src/DueStartPage.tsx`, `src/NextStepChip.tsx` | Chỉnh sửa | Luồng chỉ đường `#/chi-duong/:id?tu=map` + Pop-up Thông tin địa điểm khi tới điểm; sửa safe guard `if (!quest)` và chuyển `navigateToHash` trong `DueStartPage`; cập nhật `arrivedRef` trong `useEffect`; `NextStepChip` hiển thị `"🔒 Mở khóa để tiếp tục: <Tên quest>"` nếu quest trả phí bị khóa lại | Không gọi navigation hay gán ref trực tiếp trong render |
| `src/mobile/MobileAccountBadge.tsx`, `src/mobile/MobileBottomNav.tsx`, `src/mobile/MobileShell.tsx`, `src/App.tsx` | Tạo mới & Chỉnh sửa | Đồng bộ 4 tab `MobileBottomNav` giống hệt Web (`Khám phá`, `Sự kiện`, `Quest`, `Cửa hàng đổi xu`); bỏ `StreakChip` khỏi header mobile và thay bằng `.device-mobile-account-badge` (`Avatar + Tên + Tag PLUS / ✦ PRO / FREE`) | Bảo toàn tính năng & logic backend |
| `src/WorkspaceNavigation.tsx`, `src/AccountUi.tsx`, `src/AccountExperience.tsx`, `src/JourneyRecapPage.tsx` | Chỉnh sửa | Export `getAccountWorkspaceGroups()` (4 nhóm / 13 route); thêm nút `☰` (`WorkspaceMenuButton`) bên trái tiêu đề Tài khoản để mở Drawer; bọc các chuỗi tiếng Việt còn sót bằng `t(vi, en)`; bỏ `Date.now()` khỏi render và sửa `svgPolyline` `useMemo` | Đảm bảo i18n VI/EN & React purity |
| `src/PageTools.css`, `src/GameLayoutPolish.css` | Chỉnh sửa | Căn 1 hàng cho tiêu đề `[☰] Tài khoản` và `[🔥 ngày] [🎫 xu ›] [⚙]` (thu gọn badge `xu` trên `360px`); khôi phục chuỗi chiều cao flex + thanh cuộn dọc `6px` cho `QuestPlayPage` (`.q-scroll`, `.quest-journey-rail`), `PlayerDialog` (`.q-dialog`), `DueStartPage`, `DestinationPage`, `CelebrationPage` | Kiểm tra ở khung `360px` & `.device-mobile-shell` |
| `tests/flow.test.tsx`, `tests/premium-and-map-flow.test.tsx`, `tests/device-mode.test.tsx`, `tests/eco-transit.test.ts`, `vitest.config.ts`, `.gitignore` | Chỉnh sửa | Cập nhật selector mua Gói Plus; thêm test `cancelPremiumPlan` giữ voucher `source === 'code'`; kiểm tra `MobileBottomNav`, `MobileAccountBadge` & Drawer 13 mục; đặt `testTimeout: 15000`; thêm `backend/db.sqlite3*` vào `.gitignore` | Xác nhận `tsc -b`, `oxlint` (0 error) & 6 suite Vitest cốt lõi (34/34 test PASS) |



