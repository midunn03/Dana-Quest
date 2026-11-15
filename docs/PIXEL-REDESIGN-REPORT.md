# Dana Quest — Bàn giao giao diện pixel tươi sáng

Thực hiện trong `Dana-Quest-nhanh-dung`, tiếp tục chạy tại **http://127.0.0.1:5174/**. Không push GitHub.

## Kết quả A → B → C

**Bộ quy chuẩn:** `STYLE_PIXEL.md` và `src/ExperienceTokens.css` xác định màu, chữ, lưới khoảng cách, khung, trạng thái và chuyển động. `src/ui/PixelUI.tsx` cung cấp Button, Card, Badge, ProgressBar, Modal, Toast, Input, Tab, Tooltip và Accordion; `PixelIcons.tsx` có tám icon tự vẽ theo lưới 16. Nội dung tiếng Việt dùng Be Vietnam Pro; font pixel chỉ dùng cho nhãn ngắn. Font WOFF2 được lưu cùng dự án, có giấy phép OFL, preload và font-display:swap.

**Trang chủ:** header sticky, logo và minh họa Cầu Rồng/sông Hàn bằng SVG nguyên bản, form đăng nhập/đăng ký thật trong hero, ba bước chơi, quest lấy từ catalog, giới thiệu phần thưởng, FAQ, CTA và footer. Header cuộn tới form, không thay trang nền. Người đã đăng nhập nhìn thấy avatar/tên và nút Vào chơi. URL đăng nhập/đăng ký cũ trở về trang chủ đúng chế độ; thao tác submit thành công giữ chuyển hướng hiện có.

**Toàn website:** đã sửa trực tiếp các khai báo giao diện trong 24 stylesheet. Toast, modal và thanh XP sử dụng primitive/contract chung; các control hiện có giữ DOM và handler để tránh đổi hành vi. Danh sách từng màn và nơi sở hữu CSS nằm trong `docs/PIXEL-SCREEN-INVENTORY.md`.

Giữ GameVisual/TravelVisual/MapCompact vì chúng còn chứa layout và breakpoint thiết yếu, nhưng các khai báo hình thức đã chuyển sang token mới. Bỏ `src/pixel.css` không còn được import và có biến màu xung đột. Không dùng một stylesheet `!important` phủ toàn bộ giao diện cũ.

Các màn được phủ gồm khám phá/tìm kiếm, bản đồ/định vị, quest chi tiết/chỉ đường/màn chơi, gợi ý/pause/kết thúc, sự kiện, cửa hàng/ví, tài khoản/XP/xếp hạng/cài đặt, thư viện, avatar/onboarding/kích hoạt, camera và các luồng địa điểm cũ, điều khoản/privacy, 404 và các trạng thái lỗi/rỗng/loading.

Không thay backend, API, dữ liệu tiến độ, checkpoint, đáp án hoặc phần thưởng. Thay đổi điều phối trang chủ và auth alias chỉ phục vụ cách trình bày mới; các thao tác xác thực thật vẫn dùng mã hiện có.

## Kết quả D

| Kiểm tra | Kết quả |
| --- | --- |
| Build / TypeScript / parser CSS | Đạt; không lỗi cú pháp CSS |
| Toàn bộ suite | **231/231 đạt** — `.data/pixel-tests-final.json` |
| Trang chủ responsive | **390/768/1280/1440/1600px × VI/EN**, không tràn ngang hoặc lỗi JavaScript; tab form và FAQ hoạt động |
| Luồng game | **320/390/768/1024/1440px**; quest guard, map selection/filter, cửa hàng/ví và thông tin hoạt động |
| Xác thực qua backend tạm | **390/1280px**: đăng ký, chuyển sang chọn nhân vật, khôi phục phiên, trang chủ đã đăng nhập, đăng xuất, sai mật khẩu rồi đăng nhập đúng |
| Modal trên Quest/sự kiện | **320/390/844 ngang/1440px**: đóng, mở lại, focus, đăng nhập và lưu sự kiện đạt |
| Axe trang chủ | **0 vi phạm tự động** WCAG 2 A/AA và 2.1 AA ở VI/390px, EN/1280px |
| Axe các màn game | **0 vi phạm tự động** trên map, sự kiện, ví, cửa hàng, điều khoản ở VI/390px và EN/1280px |
| Reduced motion | Cuộn được chuyển về `auto`; hiệu ứng lặp và nảy tắt |
| Lighthouse mobile bản build | **Performance 95 / Accessibility 100 / SEO 100** |
| LCP / CLS | Khoảng **1,66 giây / 0,037** |
| Lint / diff | Lint exit 0, còn cảnh báo React hooks/Fast Refresh; git diff --check đạt |

Lighthouse dùng viewport 412×823, CPU chậm 4× và mô phỏng mạng mobile. Đây là phép đo local, không phải bảo đảm cho mọi thiết bị hoặc môi trường triển khai. Không có lỗi JavaScript/hydration mới trong các luồng Chrome đã kiểm tra. Dữ liệu kiểm thử backend nằm trong thư mục tạm, tách khỏi tài khoản thật.

Kiểm tra cuối còn xác nhận nút zoom bản đồ đủ 44×44px, chọn địa điểm hoạt động, nút tiếp tục quest có vùng bố cục riêng và không chặn danh sách. Trang riêng cũ không còn xuất hiện trong lúc chuyển hướng khách vào đăng nhập. Sau thay đổi này, 17 test xác thực được chạy lại và đều đạt.

Review độc lập đã dẫn tới các sửa chữa: neo form bị header che, specificity của reduced-motion, tương phản nút tiếp tục quest và liên kết lỗi form với ô nhập.

Bằng chứng: `.data/pixel-after/responsive.json`, `axe.json`, `game-accessibility.json`, `lighthouse-mobile.json`; các script `tests/pixel-*.cjs` và các kiểm thử auth/game hiện có.

## Ảnh trước và sau

Ảnh đầu trang nằm trong `.data/pixel-before` và `.data/pixel-after`. Ảnh riêng của khung đăng nhập có tên `login-*` trong thư mục sau.

- Mobile VI: [Trước](C:/Users/Admin/Documents/ChatGPT/Dana Quest 2/Dana-Quest-nhanh-dung/.data/pixel-before/home-390-vi.png) · [Sau](C:/Users/Admin/Documents/ChatGPT/Dana Quest 2/Dana-Quest-nhanh-dung/.data/pixel-after/home-390-vi.png)
- Mobile EN: [Trước](C:/Users/Admin/Documents/ChatGPT/Dana Quest 2/Dana-Quest-nhanh-dung/.data/pixel-before/home-390-en.png) · [Sau](C:/Users/Admin/Documents/ChatGPT/Dana Quest 2/Dana-Quest-nhanh-dung/.data/pixel-after/home-390-en.png)
- Desktop VI: [Trước](C:/Users/Admin/Documents/ChatGPT/Dana Quest 2/Dana-Quest-nhanh-dung/.data/pixel-before/home-1440-vi.png) · [Sau](C:/Users/Admin/Documents/ChatGPT/Dana Quest 2/Dana-Quest-nhanh-dung/.data/pixel-after/home-1440-vi.png)
- Desktop EN: [Trước](C:/Users/Admin/Documents/ChatGPT/Dana Quest 2/Dana-Quest-nhanh-dung/.data/pixel-before/home-1440-en.png) · [Sau](C:/Users/Admin/Documents/ChatGPT/Dana Quest 2/Dana-Quest-nhanh-dung/.data/pixel-after/home-1440-en.png)

## Giả định và tài nguyên

- Không có file logo/mockup mới ngoài bản mô tả trong lượt này. Logo và minh họa được tự vẽ; không cắt từ ảnh mockup. Ảnh địa điểm và ảnh quà hiện có giữ vai trò tài nguyên nội dung.
- Không bịa số người chơi, đánh giá, đối tác, email hay địa chỉ liên hệ. Footer dẫn tới mục Hỗ trợ hiện có.
- Hệ thống hiện không có OAuth/social login hoặc luồng quên mật khẩu độc lập. Không dựng nút giả cho các tính năng đó. Khách vẫn xem được các route công khai.
- Quà vẫn là kỷ niệm trong ứng dụng, chưa phải ưu đãi thương mại. Thanh XP trên trang giới thiệu được ghi rõ là minh họa.
- Có favicon mới, ảnh chia sẻ PNG 1200×630 từ SVG nguyên bản, metadata VI/EN và robots.txt. Canonical lấy host thật khi triển khai ngoài localhost. Chưa công bố sitemap vì chưa có tên miền triển khai; không bịa domain.
- Lighthouse còn chỉ ra cơ hội giảm CSS/JS không dùng tại trang chủ; phần lớn thuộc các màn game trong SPA. Không thêm thư viện animation vào app. Công cụ QA chỉ nằm trong `.data/qa-tools`.

## Danh sách file thay đổi

Danh sách dưới so với snapshot ngay trước đợt pixel, không gom những sửa đổi đã có từ công việc trước:

- Đã sửa: `src/AccountExperience.tsx`
- Đã sửa: `src/AccountReference.css`
- Đã sửa: `src/App.css`
- Đã sửa: `src/App.tsx`
- Đã sửa: `src/Auth.css`
- Đã sửa: `src/AuthPage.tsx`
- Đã sửa: `src/AvatarCustomize.css`
- Đã sửa: `src/CoinShop.css`
- Đã sửa: `src/ConfirmDialog.css`
- Đã sửa: `src/ConfirmDialog.tsx`
- Đã sửa: `src/Discovery.css`
- Đã sửa: `src/DueExperience.css`
- Đã sửa: `src/Events.css`
- Đã sửa: `src/ExperienceTokens.css`
- Đã sửa: `src/Explore.css`
- Đã sửa: `src/GameVisual.css`
- Đã sửa: `src/index.css`
- Đã sửa: `src/JourneyOnboarding.css`
- Đã sửa: `src/LoginExperience.css`
- Đã sửa: `src/MapCompact.css`
- Đã sửa: `src/MobileLayout.css`
- Đã sửa: `src/NavigationPage.css`
- Đã sửa: `src/NearbyDrawer.css`
- Đã sửa: `src/Notifications.tsx`
- Đã sửa: `src/Onboarding.css`
- Đã bỏ: `src/pixel.css`
- Đã sửa: `src/Quest.css`
- Đã sửa: `src/QuestDetail.css`
- Đã sửa: `src/QuestLibrary.css`
- Đã sửa: `src/QuestPlayer.css`
- Đã sửa: `src/QuestPlayerUi.tsx`
- Đã sửa: `src/TravelVisual.css`
- Đã sửa: `src/WelcomePage.tsx`
- Đã sửa: `src/Workspace.css`
- Đã sửa: `src/i18n/LocaleProvider.tsx`
- Đã sửa: `index.html`
- Đã sửa: `public/manifest.webmanifest`
- Mới: `src/CoastalScene.tsx`
- Mới: `src/HomePage.css`
- Mới: `src/lib/pageMetadata.ts`
- Mới: `src/ui/PixelIcons.tsx`
- Mới: `src/ui/PixelUI.css`
- Mới: `src/ui/PixelUI.tsx`

Tài nguyên mới: `public/fonts/`, `public/dana-pixel-mark.svg`, `public/dana-social.png`, `public/robots.txt`; các tài liệu và kiểm thử mới trong docs/tests.

## Hoàn tác UI

Snapshot `.data/pixel-before/ui-before-paths.zip` giữ đúng cấu trúc đường dẫn của src, index và manifest/icon cũ; không chứa API hoặc dữ liệu người chơi. Dừng máy chủ, lưu một bản sao trạng thái hiện tại, rồi chạy từ thư mục dự án:

```powershell
Expand-Archive -LiteralPath '.data/pixel-before/ui-before-paths.zip' -DestinationPath '.' -Force
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Các file UI/font mới có thể còn trên đĩa nhưng không được import sau khi khôi phục. Các test kỳ vọng trang chủ mới cần điều chỉnh nếu quay lại UI cũ. Không dùng git reset/clean và không đụng tài khoản, ví, tiến độ hay ảnh người chơi. Không tạo commit trộn các thay đổi có sẵn; dùng snapshot theo đợt để hoàn tác.
