# Đổi font VI/EN — Dana Quest

## Kết quả

Đã áp dụng lớp typography theo ngôn ngữ, giữ nguyên nội dung và logic. Kế hoạch được lưu trước khi sửa code tại `docs/superpowers/plans/2026-10-29-bilingual-pixel-fonts.md`.

- Tiếng Việt: **Tiny5 Regular**, tự lưu WOFF2, đủ toàn bộ dấu trong các chuỗi thử bắt buộc.
- Tiếng Anh: **Pixelify Sans Bold** tạm thay Game Paused theo yêu cầu. Dùng nét đậm thật từ nguồn 700, khai báo CSS weight 400; không dùng synthetic bold.
- Chưa có file/giấy phép Game Paused trong đính kèm. Không đóng gói font đó hoặc khẳng định đã dùng đúng Game Paused. Token đã đặt tên Game Paused ở đầu danh sách; khi nhận được file và quyền nhúng web, cần thêm @font-face trỏ tới WOFF2 được cấp phép.
- Hai tài nguyên tải thực tế: Tiny5 9.544 byte + Pixelify 5.032 byte = **14.576 byte**. Font cũ vẫn lưu để hoàn tác nhưng không còn được CSS tham chiếu/tải.

## Nguồn và giấy phép

Tiny5 lấy từ [Google Fonts chính thức](https://github.com/google/fonts/tree/main/ofl/tiny5), giấy phép [SIL OFL 1.1](https://raw.githubusercontent.com/google/fonts/main/ofl/tiny5/OFL.txt), lưu tại `public/fonts/tiny5-OFL.txt`. Bản nguồn biến thể được đóng băng ở wght=400, wdth=100, ROND=BLED=JITT=0, subset Latin/Vietnamese và chuyển WOFF2 bằng FontTools.

Pixelify Sans dùng font biến thể Latin đã có trong dự án, đóng băng trục wght=700 trước khi subset (`pixel-font-18.woff2`), thuộc [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans), OFL 1.1 tại `public/fonts/pixelifysans-OFL.txt`. Chỉ giữ ASCII và dấu câu trong mặt tiếng Anh; các ký tự có dấu Việt rơi về Tiny5. Hash, kích thước và metrics nằm trong `.data/font-migration/font-metadata.json`.

## Tokens và quy tắc

- `--font-vi`, `--font-en`, `--font-ui` trong `ExperienceTokens.css`; các token `--px-font*` trỏ về ngữ cảnh hiện tại.
- `html[lang=vi/en]` dùng cơ chế i18n hiện có, không sửa logic locale. `[lang=en]` hoặc `.font-en` ép ngữ cảnh tiếng Anh; Tiny5 là fallback ngay sau các mặt EN, monospace là fallback cuối.
- Thang `--text-sm/md/lg/xl/2xl/3xl` = **16/24/32/40/48/64px**. Giữ thêm 80/96/128/160px cho chữ trang trí lớn đã có. Không còn clamp cho font-size; breakpoint đổi bậc cố định.
- CSS font-weight 400, font-synthesis none. Chữ Việt ở tiêu đề, nút, nhãn và navigation dùng uppercase trình bày; không biến đổi chuỗi hoặc dữ liệu nhập. Prose dùng leading 1.8 và tracking .04em; input tối thiểu 16px.
- Ngoại lệ có chủ đích: **thanh chọn cỡ chữ quest 16–22px được giữ nguyên** để không làm mất chức năng hoặc sửa nội dung hiển thị của thanh chọn. Muốn đưa cả thanh này lên lưới 8px sẽ cần một thay đổi chức năng riêng.
- Font-display swap và preload hai file. Metrics hai mặt font cùng ascent 100%, descent 25%, line-gap 0; đây không phải bảo đảm mọi tình huống fallback đều không dịch chuyển bố cục.

## Kiểm tra

- Baseline và sau đổi font: build đạt, **231/231 npm test**, không đổi test expectations.
- Lint: so với baseline, không có cảnh báo mới sau khi sửa warning trong script kiểm chứng mới.
- So sánh cú pháp của **73 file TSX** với snapshot trước: giống hệt sau khi bỏ các thuộc tính trình bày `lang/fontWeight/fontFamily`; không thay handler, điều kiện, chuỗi, route hoặc state.
- Browser 390/768/1280: Home, Explore map, quest đang chơi, Account, Events, Shop không tràn ngang toàn trang và không có page error. Guard rời quest giữ đáp án khi hủy, không rời khi lưu lỗi, thử lại thành công mới rời.
- Chrome DevTools xác nhận Tiny5 vẽ cả câu tiếng Việt và dãy dấu bắt buộc; Pixelify vẽ chuỗi HUMAN OF VIETNAM/STEP/XP/LV; đoạn EN có dấu Việt dùng đúng Tiny5 cho dấu, không có font hệ thống xen vào trong chuỗi thử, kể cả dạng Unicode tổ hợp NFD.
- Đổi VI → EN → VI qua nút giao diện không reload, ô đăng nhập giữ giá trị; không có request WOFF2 404.
- Kiểm thử đăng nhập thật hiện có `tests/auth-overlay-browser.cjs` đạt 320×568, 390×844, 844×390 và 1440×900: đóng/mở modal, đăng ký, đăng nhập, lưu sự kiện.
- CLS Home đo trong lượt font test = 0 tại 390/768/1280. Đây là phép đo phòng thử nghiệm cho Home, không phải kết luận Lighthouse toàn site. Đã chạy Lighthouse qua npm exec (không thêm dependency vào dự án), trên dev server 5174: Performance 62/100, Accessibility 100/100, CLS 0. Công cụ cảnh báo CPU chậm hơn cấu hình giả lập. Không có baseline Lighthouse trước thay đổi để so sánh; **chưa xác minh điều kiện điểm Lighthouse không giảm**. Đây không phải số đo production. Kết quả gốc: .data/font-migration/lighthouse-final.json.
- Màu giao diện giữ nguyên. Các cặp chữ navy/nền chính đã tính lại đạt 5,11–13,84:1 (contrast-tokens.json); đây không phải audit tương phản đầy đủ mọi trạng thái.
- Nền map ngoài chưa tải được trong môi trường kiểm tra; đã kiểm tra fallback, tiêu đề, điều khiển và danh sách.

## Ảnh trước/sau

Ảnh đầy đủ trong `.data/font-migration/before/` và `after/`:

| Ngữ cảnh | Trước | Sau |
| --- | --- | --- |
| VI mobile | [390 VI Home](../.data/font-migration/before/390-vi-home.png) | [390 VI Home](../.data/font-migration/after/390-vi-home.png) |
| EN mobile | [390 EN Home](../.data/font-migration/before/390-en-home.png) | [390 EN Home](../.data/font-migration/after/390-en-home.png) |
| VI desktop | [1280 VI Home](../.data/font-migration/before/1280-vi-home.png) | [1280 VI Home](../.data/font-migration/after/1280-vi-home.png) |
| EN desktop | [1280 EN Home](../.data/font-migration/before/1280-en-home.png) | [1280 EN Home](../.data/font-migration/after/1280-en-home.png) |

Các ảnh `390/768/1280-glyph-proof.png` thể hiện chuỗi dấu bắt buộc và font trộn. Ảnh auth VI/EN riêng cũng có trong thư mục after.

## Những điểm cần nhận biết

Tiny5 16px giữ đúng phong cách nhưng đọc đoạn dài chậm hơn font body trước. Không tự đổi sang sans-serif. Nếu cần ưu tiên khả năng đọc, có thể chọn bậc 24px cho nội dung dài hoặc duyệt ngoại lệ font dễ đọc; chưa tự thực hiện hai thay đổi này.

Không có canvas fillText/strokeText cần đồng bộ font trong mã hiện tại. Mobile 390px còn được kiểm tra ở deviceScaleFactor=2 (HiDPI); font vẫn đúng và các chuỗi dấu không bị cắt. Điều khiển zoom, attribution, popup và tooltip của Leaflet cũng áp font tại stylesheet chủ sở hữu, không sửa thư viện.

Chữ bên trong tài nguyên ảnh/export không tự thay theo CSS: `public/dana-quest.svg`, `public/dana-social.png`, chữ trong ảnh cover/thumbnail và SVG thẻ hành trình tạo trong `QuestPlayPage.tsx`. Các tài nguyên đó được báo cáo, không tự sửa hình ảnh gốc hoặc cơ chế export.

## Hoàn tác

Snapshot chính xác trước công việc nằm tại `.data/font-migration/before.zip`. Chỉ khôi phục các file đã liệt kê dưới đây từ snapshot (thư mục `fonts/` trong ZIP tương ứng `public/fonts/`); không dùng git reset hoặc giải nén đè toàn dự án vì có thay đổi khác từ trước. Sau đó bỏ hai preload mới/khôi phục index.html và stylesheet font cũ theo snapshot. Hai WOFF2 mới có thể để lại mà không được tải. Chạy lại build/test/lint. Không push hoặc commit trong công việc này.

## File đã đổi

- `src/AccountExperience.tsx`
- `src/AccountForms.tsx`
- `src/AccountReference.css`
- `src/AccountSettings.tsx`
- `src/ActiveMissionIndicator.css`
- `src/AvatarPage.css`
- `src/BookingPage.css`
- `src/CameraPage.css`
- `src/CelebrationPage.css`
- `src/CoinShop.css`
- `src/ConfirmDialog.css`
- `src/CreatorPage.css`
- `src/CreatorPage.tsx`
- `src/DestinationPage.tsx`
- `src/DestinationSheet.css`
- `src/Discovery.css`
- `src/DiscoveryPage.tsx`
- `src/DueStartPage.css`
- `src/EventDetailsPage.css`
- `src/EventNotice.css`
- `src/Events.css`
- `src/ExperienceTokens.css`
- `src/Explore.css`
- `src/HomePage.css`
- `src/index.css`
- `src/InformationPage.css`
- `src/LoginBackdrop.css`
- `src/LoginExperience.css`
- `src/MainNavigation.css`
- `src/NavigationPage.css`
- `src/NearbyDrawer.css`
- `src/NotFoundPage.css`
- `src/OnboardingPage.css`
- `src/PhotoMission.css`
- `src/PixelLogo.tsx`
- `src/PlayerCard.css`
- `src/PlayerInformation.css`
- `src/Quest.css`
- `src/QuestDetail.css`
- `src/QuestDetailsPage.tsx`
- `src/QuestLibrary.css`
- `src/QuestPlayerUi.css`
- `src/QuestPlayerUi.tsx`
- `src/QuestPlayPage.css`
- `src/QuestPlayPage.tsx`
- `src/VoucherWallet.css`
- `src/WelcomePage.tsx`
- `src/WorkspaceNavigation.css`
- `src/ui/Controls.css`
- `src/ui/MapControls.css`
- `src/ui/PixelUI.css`
- `public/fonts/fonts.css`
- `index.html`
- `STYLE_PIXEL.md`

File mới: `public/fonts/tiny5-regular.woff2`, `public/fonts/pixelify-bold-latin.woff2`, `public/fonts/tiny5-OFL.txt`, ba script `capture-font-baseline.cjs`, `verify-font-layout.cjs`, `verify-fonts.cjs`, kế hoạch và báo cáo này. Công cụ FontTools và dữ liệu kiểm chứng chỉ nằm trong `.data/font-migration/`.

## Nhãn tiếng Anh đã gắn ngữ cảnh

- `src/AccountExperience.tsx:68`: `{stats.tier}`
- `src/AccountExperience.tsx:68`: `{questProgress.loading?'…':stats.xp}XP`
- `src/AccountExperience.tsx:79`: `XP`
- `src/AccountForms.tsx:20`: `Email<input type="email" value={email} maxLength={254} onChange={event=>setEmail(event.target.value)}/>`
- `src/AccountSettings.tsx:43`: `Dana Quest`
- `src/CreatorPage.tsx:15`: `Dana Quest`
- `src/CreatorPage.tsx:15`: `@danaquest`
- `src/DestinationPage.tsx:35`: `DANA QUEST`
- `src/DiscoveryPage.tsx:66`: `{filtered.length}quest`
- `src/PixelLogo.tsx:2`: `DANA`
- `src/PixelLogo.tsx:2`: `QUEST`
- `src/QuestDetailsPage.tsx:40`: `Dana Quest`
- `src/QuestPlayerUi.tsx:9`: `DUE`
- `src/QuestPlayPage.tsx:56`: `XP`
- `src/QuestPlayPage.tsx:60`: `{totals.xp}XP`
- `src/QuestPlayPage.tsx:81`: `Dana Quest`
- `src/WelcomePage.tsx:71`: `{(['vi','en'] as const).map(value=><button key={value} type="button" aria-pressed={locale===value} onClick={()=>setLanguage(value)}>{value.toUpperCase()}</butto`
- `src/WelcomePage.tsx:75`: `<img src={'${import.meta.env.BASE_URL}dana-pixel-mark.svg'} alt="" width="40" height="40"/><span>DANA<br/>QUEST</span>`
- `src/WelcomePage.tsx:76`: `READY, EXPLORER?`
- `src/WelcomePage.tsx:77`: `LET’S GO!`
- `src/WelcomePage.tsx:77`: `0{index+1}`
- `src/WelcomePage.tsx:77`: `WALK · DISCOVER · COLLECT`
- `src/WelcomePage.tsx:77`: `DANA QUEST`
- `src/WelcomePage.tsx:77`: `YOUR CITY ADVENTURE`
- `src/WelcomePage.tsx:78`: `CHOOSE YOUR QUEST`
- `src/WelcomePage.tsx:78`: `QUEST {String(index+1).padStart(2,'0')}`
- `src/WelcomePage.tsx:79`: `QUEST COMPLETE`
- `src/WelcomePage.tsx:79`: `XP`
- `src/WelcomePage.tsx:79`: `COINS`
- `src/WelcomePage.tsx:79`: `MEMORIES`
- `src/WelcomePage.tsx:79`: `TAKE THE STORY HOME`
- `src/WelcomePage.tsx:80`: `BEFORE YOU GO`
- `src/WelcomePage.tsx:81`: `THE CITY IS YOUR PLAYGROUND`
- `src/WelcomePage.tsx:82`: `<img src={'${import.meta.env.BASE_URL}dana-pixel-mark.svg'} width="40" height="40" alt=""/><span lang="en">DANA QUEST</span>`
- `src/WelcomePage.tsx:82`: `DANA QUEST`
- `src/WelcomePage.tsx:82`: `© {copyrightYear}Dana Quest`
