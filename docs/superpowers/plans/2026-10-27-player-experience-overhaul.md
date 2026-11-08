# Dana Quest — Kế hoạch hoàn thiện theo phản hồi người chơi

> Bản kế hoạch để duyệt. Khi triển khai, dùng executing-plans theo từng lát chức năng; áp dụng test-driven-development cho logic và verification-before-completion trước khi báo hoàn tất.

**Goal:** Hoàn thiện luồng quest, bản đồ/sự kiện, VI/EN, ví/voucher, nội dung và giao diện theo thiết kế đi kèm, không vá giao diện lên trên logic mâu thuẫn.

**Architecture:** Giữ React/TypeScript/Leaflet và Node đang phục vụ gameplay. Đưa locale, wallet, catalog sự kiện và quest transition về nguồn dùng chung phù hợp; giữ adapter Django đọc dữ liệu bản đồ hiện có. Không migrate Django hoặc thay nền tảng trong đợt này.

**Tech stack:** React 19, TypeScript, Vite, Leaflet, Node, Vitest, Testing Library, kiểm tra trình duyệt Chrome hiện có.

**Spec:** `docs/superpowers/specs/2026-10-27-player-experience-overhaul-design.md`.

## Ràng buộc chung

- Giữ toàn bộ thay đổi hiện có; không reset/checkout hàng loạt, không commit lẫn công việc chưa xác định chủ sở hữu.
- Giữ ID quest/checkpoint, dữ liệu người chơi và lịch sử đổi quà. Sao lưu và migration có version trước khi đổi ví.
- Không thêm UI giả, đối tác giả, mã voucher có vẻ hợp lệ khi chưa có dịch vụ thực.
- Không đưa công cụ trình bày/giờ giả vào luồng người chơi; server không tin giờ hoặc số xu do client gửi.
- Mỗi tính năng đủ trên mobile/laptop; không thêm thư viện chuyển động nếu CSS/Leaflet đã đáp ứng.

## Những trường hợp dễ bị bỏ sót

1. Đổi tài khoản khi request cũ còn chờ: locale, ví, tiến độ và voucher không được lẫn chủ.
2. Hai tab cùng hoàn thành/đổi thưởng; timeout sau khi server đã ghi: một lần credit/debit duy nhất.
3. English dài hơn tiếng Việt; bottom sheet và bàn phím che nút; phải truy cập đủ hành động.
4. GPS denied/stale/inaccurate, sự kiện thiếu tọa độ, bộ lọc rỗng: không giả vị trí hoặc camera bị kéo bất ngờ.
5. Rời quest bằng Back/deep link/tab và hết phiên lúc lưu: không mất input hoặc bỏ qua điều kiện.

## 0. Chụp baseline và đối chiếu môi trường

Files: `tests/`, `vitest.config.ts`, `vite.config.ts`, các báo cáo trong `docs/`; không sửa app ở bước này.

- [x] Đọc cấu trúc frontend/Node/Django, catalog, lịch sử kế hoạch và git status.
- [x] Chạy suite baseline; lần trong sandbox bị EACCES kết nối localhost/EPERM ghi file tạm và có cả mismatch UI. Không coi mọi lỗi là lỗi sản phẩm.
- [x] Chạy Chrome thật `node tests/login-slideshow-browser.cjs`: đạt cả 390×844 và 1440×900.
- [x] Baseline chạy lại ngoài hạn chế sandbox với 2 worker: **196/196 test đạt**, JSON `success: true`, không test fail. Kết quả lưu tại `.data/baseline-feedback-20261027.json`. Đây là bằng chứng trạng thái hiện tại, chưa chứng minh các yêu cầu mới đã được làm.
- [ ] Kiểm tra đúng bản chạy/entry point login mà người dùng gặp; so welcome, auth độc lập và modal trên trang hiện tại.

## 1. Nguồn ngôn ngữ và hợp đồng nội dung

Create: `src/i18n/LocaleProvider.tsx`, `src/i18n/messages.ts`, `src/i18n/content.ts`, `tests/i18n.test.tsx`.
Modify: `src/App.tsx`, `src/AccountExperience.tsx`, `src/AccountSettings.tsx`, các component và formatter theo từng lát bên dưới; API error adapters trong `src/lib/`.

Interfaces: `useLocale()` trả `{locale, t, setPreference}`; preference là `vi | en | system`; `t(key, params?)` dùng key có type, không dựa vào DOM. `localizeQuest(id, locale)` và các adapter event/place/reward trả cùng schema ổn định.

- [ ] Test đổi VI/EN/System phản ứng toàn app, `html.lang`, ngày/giờ, key parity, đăng nhập/đăng xuất và phản hồi preference cũ.
- [ ] Tách text account sang provider; chuyển navigation/auth/onboarding/common dialogs trước.
- [ ] Bản địa hóa content của toàn bộ 16 quest, địa điểm, sự kiện, cửa hàng và thông tin; proper name/user content xử lý có chủ đích.
- [ ] Quét màn VI/EN, không bỏ raw server error tiếng Việt trong giao diện English.

## 2. Guard và trạng thái quest

Create: `src/lib/useQuestNavigationGuard.ts`, `tests/quest-navigation-guard.test.tsx`.
Modify: `src/lib/navigationGuard.ts`, `src/QuestPlayPage.tsx`, `src/QuestNavigationPage.tsx`, `src/NavigationPage.tsx`, `server/quest-runs.mjs`, `shared/quest-challenges.mjs` khi cần.

- [ ] Test ở từng phase: Back, đổi tab, link bản đồ, deep link, menu leave; hủy thoát giữ input; chấp nhận lưu pause rồi đi đúng đích.
- [ ] Một hook quản lý đích đang chờ, busy và dialog; không có nhiều guard xử lý cùng một điều hướng.
- [ ] Test pause thất bại/timeout: giữ màn/input, báo lỗi, không điều hướng và không báo đã lưu; retry xác nhận server rồi mới đi đúng đích.
- [ ] Test server chặn advance sai thứ tự, submit sai checkpoint, confirm-arrival sai điều kiện, request lặp và account switch.
- [ ] Xác nhận đến nơi, pause/resume và tổng kết vẫn đọc được tiến độ cũ; không tự tặng lại xu.

## 3. Ví thống nhất và voucher

Create: `server/wallet.mjs`, `shared/wallet.mjs`, `src/lib/wallet.ts`, `src/lib/useWallet.ts`, `src/VoucherWallet.tsx`, `tests/wallet.test.ts`, `tests/wallet-api.test.ts`.
Modify: `server/auth.mjs`, `server/game-logic.mjs`, `server/quest-runs.mjs`, `src/ShopPage.tsx`, `src/AccountExperience.tsx`, `src/data/rewards.ts` và phần thông báo thưởng.

Interfaces dự kiến: GET `/api/auth/wallet` trả `{version,balance,entries,vouchers}` theo phiên; redeem nhận rewardId + requestId, không nhận amount/owner từ client. Receipt có id, rewardId, owner scope, redeemedAt, status và điều kiện thực. Error là code ổn định để dịch trên client.

- [ ] Viết fixture migration legacy-only, quest-only, đã chuyển legacy, đã đổi voucher, dữ liệu hỏng, hai tab.
- [ ] Chốt mapping credit nguồn và khoản chi cũ; backup trước import, marker migration idempotent, không balance âm hoặc credit kép.
- [ ] Test lịch sử mơ hồ/chi vượt thu chứng minh được: không ghi đè, giữ backup/lịch sử, chặn redeem với trạng thái đối soát; adjustment chỉ do operator có lý do, không mint từ cache client.
- [ ] Mọi read/credit/debit đi qua khóa tuần tự cùng chủ tài khoản; không tạo race do ghi hai file riêng không giao dịch.
- [ ] Cửa hàng và Account dùng cùng hook; voucher đổi xong hiện ngay ở `#/tai-khoan/wallet` và nhóm Voucher của tôi.
- [ ] Test double-click, insufficient funds, HTTP timeout/retry, stale owner, reload và giữ nguyên voucher cũ.

## 4. Bản đồ và danh sách

Create: `src/lib/discoveryMap.ts`, `src/MapSidebar.tsx`, `tests/map-filters.test.ts`, browser scenario bản đồ.
Modify: `src/DiscoveryPage.tsx`, `src/Explore.tsx`, `src/Explore.css`, `src/MapCompact.css`, `src/Discovery.css`, adapter catalog sự kiện.

Interfaces: `MapFilter = 'events' | 'quests'`; view model có id, type, title, position, href, occurrence khi là event. Pure selector là nguồn duy nhất cho list/marker/bounds.

- [ ] Test hai filter, query, 0/1/nhiều điểm, nhiều event cùng tọa độ, thiếu tọa độ và timezone.
- [ ] Layout sidebar desktop/bottom sheet mobile, list-marker selection hai chiều, legend khác màu và khác hình.
- [ ] Fit bounds chỉ khi tập lọc đổi; padding theo panel; không reset vị trí khi tick hoặc kéo bản đồ.
- [ ] GPS hiện avatar đúng tài khoản, vòng sai số; không giả vị trí khi denied/stale/inaccurate; giữ fallback danh sách khi tile lỗi.

## 5. Sự kiện: một scheduler, công cụ người trình bày riêng

Create: `server/presentation-events.mjs`, `server/presentation-cli.mjs`, kiểm thử API/policy và hướng dẫn buổi báo cáo.
Modify: `src/EventsPage.tsx`, `src/EventProvider.tsx`, `src/Explore.tsx`, `shared/event-policy.mjs`, `server/account-features.mjs`, event catalog adapter.

- [ ] Gỡ nút/import EventDemo khỏi giao diện người chơi. Đưa fixture kiểm thử vào tests, không phục vụ như một tính năng game.
- [ ] Map/sidebar/page/scheduler đọc cùng occurrence model; bỏ toast tự nhắc ngoài policy trong Explore.
- [ ] Test mapping ID nguồn Django có namespace; đổi giờ tạo occurrence mới và yêu cầu xác nhận lại, sửa mô tả giữ occurrence cũ; không gửi lặp/làm mất lịch sử attendance.
- [ ] Tool mặc định tắt, chỉ chạy khi operator bật server config; target tài khoản/nhóm cụ thể, không nhận thời gian giả từ trình duyệt.
- [ ] Tạo occurrence thật cho phiên báo cáo; ca invite sau 90 phút, ca reminder sau 20 phút + người chơi tự chọn tham gia.
- [ ] Test không quyền, sai account, notifications off, active quest, hidden tab, hết giờ, cooldown, repeat/restart và lịch thay đổi.
- [ ] Thực hiện checklist thao tác trình bày: có cả ca đủ điều kiện và ca bị chặn; giải thích giới hạn OS notification/Web Push.

## 6. Nội dung quest và hướng dẫn

Modify: `src/data/questCatalog.json`, `src/lib/questPresentation.ts`, `src/QuestDetailsPage.tsx`, `src/DueStartPage.tsx`, `src/DueSupport.tsx`, `src/InformationPage.tsx`, `src/AccountSettings.tsx`; thêm catalog VI/EN và tests tương ứng.

- [ ] Đổi tên hiển thị 16 quest theo bảng trong spec; cập nhật cover, title, share, card, search và marker, giữ mọi ID cũ.
- [ ] Biên tập mỗi quest với hook, vai người chơi, mục tiêu, diễn tiến checkpoint, gợi ý nhiều mức, phản hồi sai/đúng, kết thúc và tuyến tiếp nối.
- [ ] Không đổi đáp án/khoảng cách/checkpoint order khi chỉ đổi truyện; fixture tiến độ cũ vẫn tiếp tục đúng bước.
- [ ] Nội dung fact dựa vào nguồn hiện có; đánh dấu điều cần kiểm chứng, phân biệt hư cấu dẫn chuyện.
- [ ] Một nguồn FAQ/cách chơi/terms/privacy cho trang public và account, đủ mục về GPS, an toàn, ảnh, xu, voucher, pause, thông báo và phục hồi lỗi.
- [ ] Không bịa chủ thể vận hành, liên hệ hoặc đối tác; ghi danh sách thông tin cần chủ dự án bổ sung.

## 7. Hệ giao diện, nền login và ảnh thưởng

Create: `src/ExperienceTokens.css`, bộ primitive cần dùng thực, `public/rewards/` cho 7 asset đã chọn; test browser/i18n/layout.
Modify: `src/App.css`, `src/Workspace.css`, `src/Discovery.css`, `src/Events.css`, `src/CoinShop.css`, `src/AccountReference.css`, `src/LoginExperience.css`, `src/WelcomePage.tsx`, `src/Notifications.tsx`, `src/ActiveMissionIndicator.tsx`, `src/RewardArt.tsx`.

- [ ] Token trước, component chung sau; xóa/chỉnh rule cũ ở nơi sở hữu, không chồng thêm file vá cuối cascade.
- [ ] Bỏ brand riêng trên Discovery/Quest; thống nhất toolbar, spacing, text hierarchy, cards, focus/error/loading/empty states.
- [ ] Toast bỏ xanh lá cũ; active quest thành hành động dễ nhận biết có tên/progress, không che bottom nav/map controls.
- [ ] Login giữ 20 giây/ảnh, thêm chuyển động nhẹ khi được phép; preload, cleanup, pause, hidden tab, reduced motion và case mọi ảnh hỏng.
- [ ] Duyệt concept sheet ImageGen theo brand-contact.png; tạo 7 ảnh riêng, ghi prompt/nguồn và kích thước; kiểm tra item thực đúng rewardId, không dính chữ hoặc logo đối tác.
- [ ] Chuyển động áp dụng có chủ đích; không thêm GSAP chỉ để thay CSS opacity/transform hoặc Leaflet flyTo.
- [ ] Kiểm tra 320/390/768/1024/1440px, ngang/dọc, bàn phím, touch/focus, EN dài và reduced motion.

## 8. Nghiệm thu toàn hành trình

- [ ] Unit/integration: `npm.cmd test -- --maxWorkers=2`; giữ dữ liệu test riêng.
- [ ] `npm.cmd run build`, `npm.cmd run lint`, `git diff --check`; không sửa suppressions hoặc giảm tiêu chuẩn để vượt kiểm tra.
- [ ] Browser: guest → đăng nhập → chọn nhân vật → khám phá/map → quest detail → chỉ đường → đến nơi → giải sai/đúng → hint/pause/reload → hoàn tất → nhận xu → đổi thưởng → Account/voucher.
- [ ] Lặp ở mobile/laptop và VI/EN; đổi tài khoản, expired session, offline/error, deep links, Back và request race.
- [ ] Code review tập trung authority server, idempotency, nguồn dữ liệu trùng, cleanup, CSS ownership, auth boundaries và dữ liệu lịch sử.
- [ ] Báo cáo từng yêu cầu với file thay đổi, kiểm tra thực, ảnh minh chứng và giới hạn. Không tuyên bố vận hành thương mại/Web Push/GPS phần cứng nếu chưa kiểm chứng.

## Tài nguyên thiết kế đang chuẩn bị

- Tham chiếu gốc: `Dana-Quest-Documentation-v2.2/Dana-Quest-Documentation/references/brand-contact.png` tính từ thư mục dự án.
- Concept sheet 7 phần thưởng do ImageGen tạo được lưu trong `docs/art-direction/` để duyệt hướng; chưa phải bộ 7 asset đã tích hợp.
- Prompt và kết quả baseline được ghi riêng để người thực hiện tiếp theo phân biệt bằng chứng với đề xuất.
