# Build Tasks — Dana Quest (lớp giao diện)

## Quyết định chủ dự án — 31/10/2026

- **Palette chính thức: xanh v2.2**, theo bảng token trong pack v2.2 `docs/DESIGN_SYSTEM.md`. Chủ dự án xác nhận trực tiếp trong hội thoại. Đã áp dụng lớp màu UI ở nhóm F, giữ nguyên font và màu minh họa/logo gốc; xem báo cáo để biết phạm vi kiểm tra.
- **Giữ Django**, vì chủ dự án sử dụng Django admin để quản lý thông tin hệ thống. Tiếp tục bảo toàn chức năng admin; không đóng băng hoặc loại bỏ backend này.
- Thứ tự mới theo bổ sung: E1 → Django → G (chỉ đề xuất) → F → A4 → phần còn lại. Không tự chốt O-04/O-09 hay chính sách local.

## Goal and scope
Tái cấu trúc lớp giao diện của `Dana-Quest-nhanh-dung` theo kết quả audit 28/10/2026: một hệ token, một stylesheet
mỗi màn, xóa CSS chết, dàn lại bố cục cho thu hút và logic — mà **không đổi logic, route, ID dữ liệu, API hay test**.
Chỉ dọn cấu trúc thư mục `src/` sau khi các phase trước đạt.

Phạm vi KHÔNG bao gồm: đổi stack, đổi gameplay, thêm tính năng mới, làm website giới thiệu (F5), tự chốt các O trong PRD.

## Status rules
`[ ]` Chưa xác minh hoàn tất. `[x]` Đã làm và đã kiểm tra.
Dùng dòng Status: To do / In progress / Blocked. **Không tick khi chưa chạy qua Check.**

## Baseline xác minh trước khi bắt đầu (bắt buộc chạy và ghi kết quả vào PR của task đầu tiên)
- `npm.cmd run build` đạt; `npm.cmd test` đạt (mốc hiện tại: 225 test); `npm.cmd run lint` chạy được, ghi lại **số cảnh báo hiện có làm baseline** — các task sau không được làm tăng số này.
- Ưu tiên luật trong `AGENTS.md` của Documentation v2.2: không xóa logic cũ trước khi có thay thế; hỏi chủ dự án trước mọi push.

## TASK-01: Đọc bộ tài liệu và chốt palette
- [x] Status: **Đã chốt palette — 31/10/2026**
Priority: High. Dependencies: none.
Đọc: `docs/DOC-INDEX.md` (thứ tự đọc), `USER-FLOWS.md`, `ENV.md`, pack v2.2 (`AGENTS.md`, `DESIGN_SYSTEM.md`, `CODE_STYLE.md`, `references/ui-design/SCREEN-SPECS.md`).
Done when: có quyết định bằng văn bản của chủ dự án về tông màu chính thức (vàng/navy hiện tại **hoặc** palette xanh v2.2 ĐỀ XUẤT) ghi tại đầu `TASKS.md`.
Check: chủ dự án trả lời trực tiếp; agent không tự chọn theo prototype.
> **Quyết định:** xanh v2.2; giữ font hiện hành. TASK-02 triển khai ở nhóm F theo thứ tự mới.

## TASK-02: Gom về một hệ design token
- [x] Status: Complete — nhóm F1,31/10/2026
Priority: High. Dependencies: TASK-01.
Gộp 7+ hệ biến (`--px-*`, `--dq-*`, `--quest-*`, `--qd-*`, `--ap-*`, `--text-*` của Workspace.css, hex cứng trong LoginExperience.css) về một hệ duy nhất trong `ExperienceTokens.css`.
Ánh xạ mọi biến alias (`--quest-pink`, `--ap-pink`...) về token thật **và khôi phục màu hover/accent vốn định** (hiện hover là no-op vì alias trỏ vào navy).
Cho thang `--px-space-*` được sử dụng thật. Token load một lần trong `App.tsx` trước mọi screen CSS.
Cấm: thêm `!important`, thêm khối "patch" cuối file — sửa luật gốc tại chỗ.
Done when: không còn hai hệ token song song; hover/accent đổi màu được; `npm test` vẫn đạt.
Check: grep `var(--quest-|var(--qd-|var(--ap-|var(--dq-` = 0 ngoài file token; build/test/lint đạt so baseline.
Evidence: alias cũ ngoài token0; hex ngoài token0;824tham chiếu spacing sau F3. Palette/hover/contrast xem báo cáo nhóm F và scripts/verify-f-ui.cjs; không đổi font.

## TASK-03: Một stylesheet cho mỗi màn, phạm vi đúng
- [x] Status: Complete — nhóm F2,31/10/2026
Priority: High. Dependencies: TASK-02.
Tách CSS misplaced: `QuestDetail.css` không styles trang Creator; `Discovery.css` không styles nav toàn cục hay InformationPage; `Quest.css` không lọt vào Account/Shop/404.
Bỏ 7 import CSS toàn cục trong `App.tsx` (giữ file token + reset tối thiểu); mỗi màn import CSS của chính nó.
Thống nhất một định nghĩa duy nhất cho `.app-shell`; ba con số chiều cao nav (104px+/94px/60px) về một token.
Done when: đổi thứ tự import trong `App.tsx` không lệch bố cục; nav một chiều cao duy nhất.
Check: build/test đạt; xem 4 màn chính (Home, Explore, Quest play, Account) ở 390/768/1440 px không lệch.
Evidence: App chỉ import token+App.css tối thiểu; một app-shell base, MainNavigation.css là owner nav duy nhất; token nav80desktop/112mobile+safe area. Matrix36trường hợp gồm320/390/768/1440, VI/EN ở390/1440; quest play có một action area.

## TASK-04: Xóa CSS chết (xác minh bằng grep từng mục trước khi xóa)
- [x] Status: Complete — nhóm F3,31/10/2026
Priority: Medium. Dependencies: TASK-03 (thứ tự có thể đổi nhưng phải sau khi TASK-02 bản đề xóa không còn tham chiếu).
Danh sách đã audit: `Auth.css` và `Account.css` (không ai import), phần chết của `Explore.css` (giữ luật atlas sống), lớp iOS-sheet bị ghi đè trong `LoginExperience.css` + layout full-page login không tới được, khối chết trong `GameVisual.css`/`App.css`/`QuestPlayer.css` (`.q-route-overview`, `.q-briefing-*` trừ `.q-briefing-start`), `.home-user` trùng trong `HomePage.css`, khối legacy sheet trong `MapCompact.css`, component PixelUI không ai dùng (PixelCard/Badge/Modal/Input/Tab/Tooltip) — chọn xóa hoặc dùng, không giữ trạng thái lửng.
Không xóa file/tham chiếu nào test đang dùng.
Done when: danh sách trên được xác minh grep và xóa; test vẫn đạt.
Check: `npm test` đạt; không còn selector 0 lần dùng trong TSX (báo số dòng CSS đã giảm).
Evidence: các file audit cũ đã được xóa trước F không tính lại. F3 tìm kiếm source/tests rồi xóa7rule chết/trùng,634bytes và3dòng vật lý; giữ px-modal đang được hai dialog dùng, q-briefing-start và qd-creator-link còn sống. Không tuyên bố mọi selector động trong dự án đều đã được chứng minh chết/sống.

## TASK-05: Dàn lại bố cục (visual hierarchy)
- [ ] Status: Partially verified — nav/header/quest action kiểm tra ở F; chưa đánh dấu toàn bộ redesign hoàn tất
Priority: High. Dependencies: TASK-02 và TASK-03 (phải trước, nếu không layout lại chồng chéo cũ).
Nội dung:
1. Bottom nav xuất hiện thống nhất trên mọi màn công khai **kể cả Home**.
2. Mobile quest-play: bỏ tình trạng hai thanh fixed chồng nhau (play panel + nav); chừa đúng một nav height, content chiếm phần còn lại.
3. Explore mobile: không ẩn mất tiêu đề màn hình.
4. Thẻ auth về một ngôn ngữ thị giác duy nhất (pixel), bỏ tình trạng hai metaphor card cùng vị trí.
5. Dải marquee trang trí trang chủ không đẩy CTA thật xuống dưới mobile.
6. Thống nhất pattern card + cover + grid giữa Discovery, Quest Library, Account (hiện 3 cách làm khác nhau) thành một component dùng chung trong `src/ui/`.
7. Xem lại thứ tự khối Home: hero → auth → steps → quests → rewards → FAQ → CTA → footer; Discovery: header → search → filters → grid; Account: hai cột, sticky cột cộng đồng từ 900 px.
Done when: các màn chính có thứ tự khối hợp lý, khoảng thở theo token, không tràn ngang ở 320/390/768/1440 px.
Check: build/test đạt; chụp màn hình 390/1440 so sánh trước–sau (lưu `tests/visual/`, đặt tên có hậu tố ngày); VI/EN đều kiểm.

## TASK-06: Tổ chức lại thư mục `src/` (tùy chọn, cần duyệt riêng)
- [ ] Status: To do — Blocked khi chưa có yêu cầu riêng
Priority: Low. Dependencies: TASK-01→05 hoàn tất và đạt.
Tách `src/pages/`, `src/components/`, `src/ui/`, `src/styles/` (giữ nguyên `lib/`, `data/`, `i18n/` đã có). Chỉ mechanical import updates, không đổi logic.
Tách JSX dày đặc 1 dòng của các màn lớn (ví dụ `QuestDetailsPage.tsx`) thành multi-line qua formatter, không đổi ngữ nghĩa.
Done when: build/test/lint đạt, không có file nào đổi nội dung ngoài import/format.
Check: diff review — mọi thay đổi chỉ là import path và xuống dòng.

## Blockers and next action
- **TASK-01 đã chốt:** xanh v2.2; nhóm Django/G đã được duyệt, F đã triển khai. Dừng báo cáo F trước A4. TASK-05 chỉ đánh dấu những tiêu chí thực sự kiểm chứng; TASK-06 và format/đổi thư mục vẫn chưa tự mở.
- Quyết định O-01→O-09 trong PRD vẫn thuộc chủ dự án; task nào đụng nhánh bị chặn thì ghi Blocked, không tự triển khai.
- Không push GitHub khi chưa xin phép; nếu được phép, chỉ nhánh phụ.
- Không đánh dấu hoàn thành khi Check chưa pass; sửa phải hướng CSS/cấu trúc, tuyệt đối không sửa test cho pass.
