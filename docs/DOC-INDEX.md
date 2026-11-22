# DOC-INDEX — Thứ tự đọc tài liệu cho agent (Codex)

Bản đồ này nói cho agent cần đọc gì, theo thứ tự nào, cho từng loại nhiệm vụ.
Thư mục gốc dự án: `Dana-Quest-nhanh-dung/`. Quyết định cuối cùng thuộc chủ dự án Dana Quest.

## 0. Luật bắt buộc trước mọi thay đổi
1. Đọc `Dana-Quest-Documentation-v2.2/Dana-Quest-Documentation/AGENTS.md` — sổ tay agent: nhãn YÊU CẦU/THAM KHẢO/ĐỀ XUẤT/CẦN CHỐT/HIỆN TRẠNG có ý nghĩa; không tự coi đề xuất là đã duyệt.
2. Hỏi chủ dự án trước mọi push; chỉ nhánh phụ khi được phép; không merge main.
3. Không sửa test để pass; không thêm `!important` hay khối patch cuối file; sửa luật gốc tại chỗ.
4. Bảo toàn: ID địa điểm, khóa IndexedDB/localStorage, dữ liệu `.data/`, tiến trình phiên bản 1 lẫn 2.

## 1. Đọc theo loại nhiệm vụ

### Mọi nhiệm vụ
| Thứ tự | File | Vai trò |
| --- | --- | --- |
| 1 | `docs/DOC-INDEX.md` (file này) | Bản đồ tài liệu |
| 2 | `docs/USER-FLOWS.md` | Hành vi hiện có của app: route, luồng, lỗi, quyết định còn mở |
| 3 | `docs/TASKS.md` | Công việc đang giao, dependency, tiêu chí hoàn thành |

### Sửa giao diện / UI

Làm hoặc rà chuyển động: đọc [ANIMATION-GUIDE.md](ANIMATION-GUIDE.md) để dùng skill Animate UI, phân biệt cài skill với thêm dependency runtime và giữ chuẩn pixel/reduced-motion.

Đọc [DESIGN.md](../DESIGN.md) trước khi chọn art direction, chỉnh token hoặc dùng công cụ thiết kế; file liên kết hệ thống hiện hành với [thư viện Awesome DESIGN.md](references/awesome-design-md/README.md). Mẫu bên ngoài là tham khảo, không thay nhận diện hoặc luật sản phẩm.

| Thứ tự | File | Vai trò |
| --- | --- | --- |
| 1 | `docs/TASKS.md` | Các TASK-01→06 là đơn hàng hiện tại, làm theo thứ tự dependency |
| 2 | Pack v2.2 `docs/DESIGN_SYSTEM.md` | Token đề xuất, 16 màn S-01→16, component C-01→09, accessibility |
| 3 | Pack v2.2 `references/ui-design/SCREEN-SPECS.md` + `references/ui-design/index.html` | Thiết kế tham chiếu 33 màn — nguồn bàn giao UI, không copy file prototype vào source |
| 4 | Pack v2.2 `docs/CODE_STYLE.md` (mục "Quy tắc sửa giao diện") | Cấm thêm override cuối file; hợp nhất CSS phải kiểm bố cục liên quan |
| 5 | `STYLE_PIXEL.md`, `docs/art-direction/` | Hướng pixel hiện hành của app |

### Sửa route/API/runtime/backend
| Thứ tự | File | Vai trò |
| --- | --- | --- |
| 1 | Pack v2.2 `docs/ARCHITECTURE.md` | Hiện trạng vs hợp đồng mục tiêu, ranh giới tin cậy |
| 2 | Pack v2.2 `docs/DATABASE.md` | Schema hiện trạng + đề xuất, quyền owner |
| 3 | Pack v2.2 `docs/SECURITY.md` | Owner check, session, upload, GPS, log |

### Viết/chạy test, báo hoàn thành
| Thứ tự | File | Vai trò |
| --- | --- | --- |
| 1 | Pack v2.2 `docs/TESTING.md` | Ma trận nghiệm thu, lớp test, release criteria |
| 2 | Pack v2.2 `docs/CODE_STYLE.md` (mục "Verified commands") | Lệnh chuẩn: `npm.cmd run build` / `lint` / `test` |
| 3 | `docs/CHANGELOG.md` | Ghi thay đổi đã chạy được, không ghi kế hoạch |

### Đọc cấu hình/môi trường
| Thứ tự | File | Vai trò |
| --- | --- | --- |
| 1 | `docs/ENV.md` | Biến môi trường đối chiếu với source, storage `.data/`, lệnh chạy |

## 2. Quan hệ giữa các nguồn (khi mâu thuẫn)
1. **Yêu cầu mới nhất của chủ dự án trong hội thoại** — cao nhất.
2. **PRD v2.2** — nguồn luật sản phẩm và các O còn mở.
3. **`docs/USER-FLOWS.md`** — mô tả hành vi code hiện tại; là HIỆN TRẠNG, không tự nâng thành mục tiêu.
4. **README.md** — mô tả vận hành hiện có; một số mục cũ (luật 5–10 nhiệm vụ, 80%) chỉ là hiện trạng legacy, PRD đã đính chính.
5. **Ảnh Questo / prototype UI** — THAM KHẢO, không copy vào production.

## 3. File bổ trợ ngoài tài liệu
- `.env.example` — placeholder biến môi trường, giải thích tại `docs/ENV.md`.
- [VISUAL-SOURCES](references/VISUAL-SOURCES.md) — nguồn chuẩn ảnh tham khảo brand/Questo và bảng tra đường dẫn cũ.
- `docs/PHASE-1-CODEBASE-AUDIT.md`, `docs/SYSTEM-AUDIT-2026-10-27.md`, `docs/PLAYER-EXPERIENCE-HANDOFF-2026-10-28.md` — bằng chứng audit/bàn giao; nguồn của các mục trong CHANGELOG.

## 4. Đề xuất nhóm G —31/10/2026, chưa triển khai

- `docs/SHARED-RULES-PROPOSAL.md` — kiểm kê luật legacy/v2/Node/Django, một đặc tả dùng chung và test đối chiếu.
- `docs/LEGACY-TRANSITION-PROPOSAL.md` — chuyển theo lát, không ghi đè, nguồn thưởng duy nhất, giữ route/dữ liệu cũ.
- `docs/ARRIVAL-VERIFICATION-PROPOSAL.md` — hiện trạng visual DUE và lựa chọn GPS chờ O-04; không tự bật GPS.
- `docs/ROUTE-LOADING-PROPOSAL.md` — lazy imports đang có, baseline bundle và cách đo sau khi UI ổn định.

Đây là **đề xuất**, không phải thay đổi sản phẩm đã được duyệt. Phần màu xanh v2.2 và giữ Django đã có quyết định ở đầu TASKS.md; O-04, chính sách local/legacy và chuyển ví/backend vẫn chưa tự được chốt. Xem `docs/REVIEW-FIX-REPORT-2026-10-31.md` để phân biệt phần đã code với phần chỉ viết tài liệu.

## Cấu trúc và công cụ dự án — 01/11/2026

Xem [PROJECT-LAYOUT.md](PROJECT-LAYOUT.md) khi mở workspace, bàn giao hoặc cài công cụ: DESIGN.md, .agents, .codex, lockfile và assets đã nằm trong thư mục ứng dụng.

## Bản đồ và ảnh địa điểm — 18/11/2026

Xem [báo cáo rà soát](reports/map-2026-11-18/README.md) trước khi sửa màn bản đồ, dữ liệu ảnh admin hoặc dẫn đường. `MapResults.css` quản lý mật độ riêng của màn bản đồ; không tăng token chữ toàn hệ thống để sửa thanh bên. Báo cáo ghi các giới hạn chưa xử lý, ảnh kiểm tra và nguồn ảnh.

## Kiến trúc Gói Trả Phí, Chỉ Đường Bản Đồ, Giao Diện Điện Thoại & Rà Soát Hệ Thống — 22/11/2026

Các AI agent sau cần đọc kỹ phần này trước khi chỉnh sửa luồng trả phí, bản đồ chỉ đường hoặc chế độ điện thoại:

### 1. Gói trả phí hàng tháng (`src/lib/premium.ts`, `src/PremiumPricingModal.tsx`)
- **Phân tầng quyền lợi**:
  - **Gói Free**: mở 5 quest miễn phí (`cau-song-han`, `cho-con`, `cho-han`, `my-khe`, `bao-tang-cham`).
  - **Gói Plus (`30.000đ/tháng`)**: mở khóa `cau-rong`, nhân đôi (`x2`) xu thưởng khi hoàn thành quest, gắn huy hiệu Plus trên hồ sơ và header.
  - **Gói Pro (`50.000đ/tháng`)**: mở khóa thêm `cau-vang-ba-na-hills` và `ngu-hanh-son` (cùng toàn bộ quyền lợi Plus), gắn huy hiệu Pro, và tặng kèm 2 mã voucher nhóm 4 người (`source: 'pro_plan'`).
- **Mã khuyến mãi nội bộ**: `DEMO_PROMO_CODE = 'DN100'` trong `src/lib/premium.ts` giảm 100% (`0đ`) cho cả Gói Plus và Gói Pro, có thể nhập lại nhiều lần sau khi hủy gói (`cancelPremiumPlan`).
  - **Quy tắc bảo mật UI**: Tuyệt đối **không hiển thị công khai** mã `DN100` ở bất kỳ văn bản, placeholder, tooltip hay chú thích nào trên giao diện web (`.tsx`, `.css`, `.html`).
- **Quy tắc hủy gói (`cancelPremiumPlan`)**: Khi người dùng hủy gói, chỉ thu hồi các voucher nhóm có `source === 'pro_plan'`; giữ nguyên các voucher có `source === 'code'` mà người dùng đã kích hoạt riêng.
- **Quest trả phí đang chơi dở sau khi hủy gói (`src/NextStepChip.tsx`, `src/QuestDetailsPage.tsx`)**:
  - `NextStepChip` hiển thị `"🔒 Mở khóa để tiếp tục: <Tên quest>"` và điều hướng về `#/quest/:id` để người dùng nâng cấp lại.
  - Khối `.qd-testing` trên trang chi tiết quest hiển thị thông báo yêu cầu mở khóa gói Plus/Pro tương ứng thay vì hướng dẫn miễn phí.

### 2. Luồng Chỉ đường trực tiếp từ Bản đồ (`src/NavigationPage.tsx`, `src/Explore.tsx`)
- Từ một điểm trên Bản đồ → bấm `🗺️ Chỉ đường` → đi tới `#/chi-duong/:id?tu=map`.
- Khi tới trong bán kính `<= 50m` (hoặc bấm `Bắt đầu nhiệm vụ tại đây` / `Tới điểm này ngay` ở chế độ demo), app mở pop-up Thông tin địa điểm với 2 lựa chọn: `🚀 Bắt đầu Quest ngay` (`#/bat-dau/:id`) hoặc `📍 Tiếp tục xem bản đồ`.
- State `arrivedRef.current = arrived` được đồng bộ an toàn trong `useEffect`, tránh cập nhật ref ngay trong pha render.

### 3. Giao diện Điện thoại (`.device-mobile-shell`) & Drawer Tài khoản
- **Thanh điều hướng dưới (`src/mobile/MobileBottomNav.tsx`)**: Đồng bộ đúng 4 mục chính như thanh menu Web (`Khám phá`, `Sự kiện`, `Quest`, `Cửa hàng đổi xu`).
- **Header điện thoại (`src/mobile/MobileShell.tsx`, `src/mobile/MobileAccountBadge.tsx`)**: Đã bỏ `StreakChip` khỏi thanh header điện thoại để tiết kiệm không gian; thay bằng `.device-mobile-account-badge` (`Avatar + Tên + Tag PLUS / ✦ PRO / FREE`) dẫn trực tiếp tới `#/tai-khoan`.
- **Màn Tài khoản trên điện thoại (`src/WorkspaceNavigation.tsx`, `src/AccountUi.tsx`, `src/AccountExperience.tsx`)**:
  - Bên trái tiêu đề `Tài khoản` có nút `☰` (`WorkspaceMenuButton`) mở Drawer điều hướng đủ **13 trang con trong 4 nhóm** (`getAccountWorkspaceGroups()`).
  - Hàng tiêu đề tài khoản (`AccountPageHeader`) căn gọn cùng 1 hàng với `[🔥 ngày] [🎫 xu ›] [⚙]` trên màn hình hẹp tới `360px` (`src/GameLayoutPolish.css`).
- **Thanh cuộn màn chơi Quest (`src/GameLayoutPolish.css` - Section 19)**: Đã khôi phục chuỗi chiều cao flex (`flex-column` + `min-height: 0`) và thanh cuộn dọc `6px` cho `QuestPlayPage` (`.q-scroll`, `.quest-journey-rail`), `PlayerDialog` (`.q-dialog`), `DueStartPage`, `DestinationPage`, và `CelebrationPage`.

### 4. Lưu ý kiểm thử và tệp nhạy cảm
- Một số test tích hợp tạo server HTTP loopback trên `127.0.0.1` (`account-features-api`, `auth-api`, `groups-api`, `reward-clock-api`, `transit-wallet`, `wallet-api`, `static-server`) và `test_real_node_http_contract_matches_django` yêu cầu môi trường cho phép mở socket local (có thể gặp `EACCES` nếu chạy trong sandbox chặn mạng).
- `.gitignore` đã bỏ theo dõi `backend/db.sqlite3*` để không commit nhầm CSDL dev cục bộ.

