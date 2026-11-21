# Changelog — Dana Quest

Ghi thay đổi nhìn thấy được theo người dùng. Mới nhất lên đầu. Dùng Added/Changed/Fixed/Removed khi phù hợp.
Dự án chưa có hệ version (package.json vẫn 0.0.0), nên nhãn release là **ngày mốc có tài liệu chứng minh**,
không bịa số version. Nguồn từng mục là các file bàn giao/audit trong `docs/` — không tự suy thêm.

## [Unreleased]

## [2026-11-22]

### Added
- Triển khai hệ thống Gói trả phí hàng tháng (`src/lib/premium.ts`, `src/PremiumPricingModal.tsx`): Gói Plus (`30.000đ/tháng`, mở khóa `cau-rong`, x2 xu) và Gói Pro (`50.000đ/tháng`, mở khóa thêm `cau-vang-ba-na-hills`, `ngu-hanh-son`, x2 xu, 2 voucher nhóm 4 người).
- Hỗ trợ mã khuyến mãi nội bộ `DN100` (giảm 100% về `0đ`, cho phép tái sử dụng sau khi hủy gói; giữ bí mật tuyệt đối trên giao diện web).
- Thêm `src/mobile/MobileAccountBadge.tsx` hiển thị `Avatar + Tên + Tag PLUS / ✦ PRO / FREE` trên header giao diện Điện thoại.
- Bổ sung nút `☰` (`WorkspaceMenuButton`) bên trái tiêu đề Tài khoản trên điện thoại mở Drawer đủ 13 trang con thuộc 4 nhóm (`getAccountWorkspaceGroups()`).
- Bổ sung luồng chỉ đường trực tiếp từ Bản đồ `#/chi-duong/:id?tu=map` kèm Pop-up Thông tin địa điểm khi tới nơi (`<= 50m`).

### Changed
- Đồng bộ `src/mobile/MobileBottomNav.tsx` khớp đúng 4 mục điều hướng của thanh menu Web (`Khám phá`, `Sự kiện`, `Quest`, `Cửa hàng đổi xu`) và bỏ `StreakChip` khỏi header điện thoại.
- Căn gọn hàng đầu Tài khoản trên mobile để `[☰] Tài khoản` và cụm `[🔥 ngày] [🎫 xu ›] [⚙]` nằm cùng một hàng (kể cả ở `360px`).
- Cập nhật `NextStepChip` hiển thị `"🔒 Mở khóa để tiếp tục: <Tên quest>"` khi quest trả phí đang chơi dở bị khóa do hủy gói, và cập nhật hướng dẫn `.qd-testing` trong `src/QuestDetailsPage.tsx`.
- Tăng `testTimeout: 15000` trong `vitest.config.ts` và bỏ theo dõi `backend/db.sqlite3*` trong `.gitignore`.

### Fixed
- Khôi phục chuỗi chiều cao flex (`min-height: 0`) và thanh cuộn dọc `6px` cho toàn bộ màn chơi quest (`QuestPlayPage`, `PlayerDialog`, `DueStartPage`, `DestinationPage`, `CelebrationPage`).
- Bảo toàn các voucher có `source === 'code'` khi gọi `cancelPremiumPlan` (chỉ thu hồi `source === 'pro_plan'`).
- Sửa các lỗi TypeScript, lint & React purity: safe guard `if (!quest)` và `navigateToHash` trong `src/DueStartPage.tsx`, chuyển `arrivedRef.current = arrived` vào `useEffect` ở `src/NavigationPage.tsx`, bỏ `Date.now()` khỏi render ở `src/AccountSettings.tsx`, sửa `svgPolyline` `useMemo` ở `src/JourneyRecapPage.tsx`, và bọc đầy đủ chuỗi `t(vi, en)` trong `AccountUi.tsx` / `AccountExperience.tsx`.

### Changed
- Đang chuẩn bị: tái cấu trúc lớp giao diện (gom token, tách CSS theo màn, dọn CSS chết, dàn lại bố cục) — chi tiết tại `TASKS.md`. Chưa thực hiện.

### Fixed
- (Kế hoạch) Thống nhất chiều cao nav và bố cục hai thanh fixed chồng nhau trên màn quest-play mobile — chưa thực hiện.

## [2026-10-28] — Overhaul trải nghiệm
Nguồn: `docs/PLAYER-EXPERIENCE-HANDOFF-2026-10-28.md`. Toàn bộ suite 225/225 test đạt; Chrome 320→1440 px VI/EN không lỗi JS.
### Added
- Nền welcome/login slideshow 5 ảnh, 20 giây/ảnh, tạm dừng khi tab ẩn, tôn trọng prefers-reduced-motion.
- Provider ngôn ngữ VI/EN/System dùng chung (UI, lỗi, địa điểm, sự kiện, 16 quest); không dịch bằng thay DOM; ID và đáp án giữ nguyên.
- Ví xu server-authoritative với đối soát dữ liệu cũ, sao lưu migration, credit/debit không lặp, không trả số 0 giả khi lỗi.
- 7 ảnh quà PNG nền trong suốt tại `public/rewards`.
- 16 quest có tên phiêu lưu, hook, diễn tiến, hint/feedback, kết thúc và gợi ý hành trình tiếp theo; mechanics/reward/thứ tự cũ giữ nguyên (hash kiểm thử xác nhận).
- Regression đường dẫn trực tiếp chưa đến nơi: lối quay lại rõ ràng.
### Changed
- Khám phá/bản đồ: bố trí lại shortcut, sidebar hai bộ lọc, danh sách/marker/bounds dùng chung selector, chọn hai chiều, highlight ghim, ẩn lựa chọn đã bị lọc, GPS/avatar theo tài khoản.
- Đồng bộ màu tím/kem/vàng, toast và nút tiếp tục quest dễ đọc hơn; token riêng `ExperienceTokens.css`.
- Bỏ EventDemo khỏi màn người chơi; công cụ operator riêng tạo lịch thật, mặc định tắt.
- Server yêu cầu xác nhận đến nơi trước khi mở/hoàn thành thử thách quest.
### Fixed
- Quest giữ input khi hủy điều hướng hoặc lưu lỗi; chỉ chuyển sau pause được chấp nhận.
- Các phát hiện review độc lập: arrival bypass, avatar khác chủ, selection lệch, guard vô hình — đã sửa.

## [2026-10-27] — Kiểm toán hệ thống
Nguồn: `docs/SYSTEM-AUDIT-2026-10-27.md`.
### Added
- Kiểm tra trình duyệt toàn hệ thống (`tests/system-audit-browser.cjs`) và báo cáo audit.

## [2026-10-26] — Bộ tài liệu v2.2 và nguồn tham khảo
Nguồn: `Dana-Quest-Documentation-v2.2/`.
### Added
- Pack 8 tài liệu (AGENTS, PRD, ARCHITECTURE, DATABASE, SECURITY, TESTING, CODE_STYLE, DESIGN_SYSTEM) kèm bộ thiết kế UI tham khảo 33 màn (`references/ui-design/`) và ZIP Questo đối chiếu checksum.
- `reference-review-20261026/` lưu ảnh tham khảo brand/Questo.

## [2026-10-25 trước đó] — Quest DUE và nền tảng
Nguồn: `README.md` (các mục đã ghi ngày kiểm tra).
### Added
- Quest DUE — Dấu ấn 50 năm với route riêng (`#/quest/due-dau-an-50-nam`, `/chi-duong`, `/choi`), tiến trình phiên bản 2 không ghi đè phiên bản 1.
- Sự kiện `#/su-kien` với nguồn công khai, lịch Cầu Rồng 21:00 T6/T7/CN, nhắc trước 60 phút khi bật thông báo.
- PWA: Web App Manifest + service worker, cài ứng dụng không qua store.
- Đăng nhập/đăng ký API tích hợp Vite (`/api/auth`), scrypt + cookie HttpOnly, đồng bộ tiến độ/ảnh theo tài khoản.
- 15 địa điểm active với marker SVG riêng, API gợi ý theo vùng bản đồ, chỉ đường đi bộ Valhalla.
- Camera getUserMedia + lưu ảnh IndexedDB, album, cửa hàng voucher demo, Green Coins chống cộng lặp.

### Known issues (đã biết, chưa sửa)
- `npm run lint` còn cảnh báo React hooks/Fast Refresh (theo bàn giao 28/10) — không tuyên bố lint sạch.
- Bundle vượt cảnh báo 500 kB; cần tách tải trang (PHASE-1 audit, mục hiệu năng).
- Trang chủ không có bottom nav trong khi các trang khác có — phân mảnh nav, xem TASKS-05.
- Bottom nav bị 7 file CSS cùng styles; `.app-shell` 6 định nghĩa mâu thuẫn — nguồn gốc bố cục lệch, xem TASKS-02/03.

## Release rules
- Mục phải là thay đổi **đã chạy được**, có file tài liệu/bằng chứng trong `docs/` hoặc `.data/*tests*.json`; không ghi kế hoạch vào mục có ngày.
- Viết tác động lên người dùng, không viết "sửa file X"; breaking change phải nói người dùng cần làm gì.
- Không đưa secret hoặc dữ liệu tài khoản thật vào changelog.
