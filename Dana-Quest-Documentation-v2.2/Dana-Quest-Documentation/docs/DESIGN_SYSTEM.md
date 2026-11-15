# Design System — Dana Quest

> Cập nhật chỉ dẫn 01/11/2026: xem [DESIGN.md của dự án](../../../DESIGN.md) để tra nhận diện hiện hành, công cụ thiết kế và thư viện Awesome DESIGN.md. Màu xanh v2.2 đã được duyệt tại docs/TASKS.md của ứng dụng; các giá trị runtime nằm trong src/ExperienceTokens.css. Những đề xuất cũ về font, cỡ chữ và bo góc bên dưới vẫn là đề xuất lịch sử, không tự ghi đè STYLE_PIXEL.md hiện hành.

## Design direction

Phiên bản 2.2 — 26/10/2026. Phạm vi game trình duyệt, mobile-first. Website giới thiệu hoãn. Dùng yêu cầu/nhãn quyết định ở PRD.md; đặc tả này không xác nhận code đã đạt. Workflow và quyền là nguồn chuẩn tại PRD; file này định nghĩa cách thể hiện chúng.

YÊU CẦU: bố cục/chức năng tham khảo ảnh Questo, nhận diện Dana Quest có pixel, màu tiết chế, đọc được cả VI/EN. THAM KHẢO: ../references/INDEX.md liên kết ảnh gốc. Logo/poster/mẫu avatar từ gói Bộ nhận diện là nguồn hình, chưa có brand book chuẩn được phê duyệt.

### Phân vai hình ảnh
- Logo, nhân vật, coin, huy hiệu, vật phẩm, địa danh minh họa: pixel có chủ đích. Phóng theo tỷ lệ để không nhòe, không làm méo nhân vật.
- Nội dung quest, form, error, chỉ dẫn/map label: chữ thông thường dễ đọc. Không biến toàn bộ giao diện thành font pixel.
- Ảnh nhận diện và clue: dùng ảnh thật đủ chi tiết, giữ tỷ lệ, có nguồn/quyền. Minh họa không thay cho bằng chứng nhận ra điểm thực.
- Ảnh người dùng: thể hiện nguyên nội dung đã xử lý, không áp filter pixel tự động vì có thể làm mất chi tiết.
- Bản đồ: tái sử dụng map Dana trong ZIP (Leaflet, pixelTiles, markerScale, daylight có trong source); kiểm tra độ đọc tên đường và đường đi. Không pixel hóa chữ chỉ dẫn/độ chính xác GPS. Hiệu ứng ngày đêm không làm chìm cảnh báo.

## UI tokens

Các giá trị dưới là **ĐỀ XUẤT bảng màu v2**, không phải số đo màu từ logo hoặc giá trị đã duyệt. Giữ bảng token tách khỏi CSS cũ để agent không hiểu đây là hiện trạng.

| Token semantic | Đề xuất | Cách dùng |
| --- | --- | --- |
| color.canvas | #F7F5EC | Nền sáng Explore/Account/Shop |
| color.surface | #FFFFFF | Card/form/dialog |
| color.text | #1E302A | Nội dung chính |
| color.textMuted | #52665C | Mô tả thứ cấp, kiểm tra tương phản trước dùng |
| color.primary | #216447 | CTA, trạng thái được chọn; chữ trắng |
| color.primarySoft | #E4F0E5 | Selection/background nhẹ, chữ đậm |
| color.water | #28657C | Map/info hỗ trợ, không tranh CTA |
| color.reward | #D5A13A | Coin/nhấn thưởng, dùng chữ đậm, không chữ trắng cỡ nhỏ |
| color.error | #A83732 | Lỗi + icon/text, không chỉ màu |
| color.focus | #1F6080 | Focus rõ trên nền sáng |
| color.playCanvas | #152D25 | Tùy chọn nền gameplay; chưa bật dark mode toàn app |
| color.playText | #F5F6EF | Đoạn truyện trên nền tối |
| font.body | Be Vietnam Pro, system-ui, sans-serif | Đề xuất; kiểm tra glyph/giấy phép và tự host bản cần dùng |
| font.size | 12/14/16/18/24/32 px | Body 16, story 18; chữ phụ 12 chỉ ở thông tin không cốt lõi |
| font.lineHeight | body 1.5; story 1.65; heading 1.25 | Câu dài VI/EN không cắt nội dung |
| space | 4/8/12/16/24/32 px | Padding, khoảng giữa nhóm, khoảng thở |
| radius | input 12, card 16, sheet 24 px | Tiết chế; pixel art vẫn vuông trong vùng ảnh |
| touch.target | ≥44 × 44 CSS px | Icon, camera, close, map controls |

Đề xuất chia primitive → semantic → component. Ví dụ primary color dùng cho button.primary.background; không tạo màu tùy hứng mỗi màn. Bảng màu trong TravelVisual.css cũ (#e8eeea, #23444e, #487b68...) là HIỆN TRẠNG tham khảo, không tự trộn cả hai hệ. Mọi thay palette phải xem trên logo và ảnh thật, đo tương phản trước phê duyệt.

## Layout rules

### Khung trình duyệt
- Mobile: dùng chiều rộng viewport, safe-area trên/dưới; tránh khóa chiều cao khiến bàn phím che input. Story dài cuộn được.
- Desktop: vẫn là game trình duyệt, không chuyển sang website giới thiệu. ĐỀ XUẤT khung chơi đọc được, map có không gian rộng hơn; không ép mọi màn vào điện thoại giả nếu chưa được duyệt.
- Chuẩn kiểm tra trước: 360, 390, 430 px và laptop 1280 px; thêm zoom chữ 200% và xoay ngang. Đây là kích thước test, không khẳng định đã đạt.
- Bottom nav: Explore, My Quests, Green Coin Shop, Account. Album có thể là mục trong Account/My Quests; **đề xuất** vị trí, chưa tự thêm tab thứ năm. Crew bị loại; Events trong code ZIP không mặc định ở MVP.
- Gameplay/camera: tập trung tác vụ, có back/menu rõ; điều hướng rời run có quy tắc lưu/nhắc draft. Sticky CTA chừa safe area, không che nội dung cuối hoặc bàn phím.
- Card/list không khóa chiều cao theo tiếng Anh; tên địa danh dài và bản dịch phải xuống dòng. Chữ số/coin/date theo locale, ID giữ nguyên.

### Danh mục màn và trách nhiệm
| Screen ID | Màn | Bắt buộc thể hiện | Workflow |
| --- | --- | --- | --- |
| S-01 | Chào/onboarding | Nhận diện, ngôn ngữ, login/register bắt buộc lần đầu; sau logout được browse theo WF-01 | WF-01 |
| S-02 | Login/register | Label, validation, đang gửi/lỗi, return intent an toàn | WF-02 |
| S-03 | Custom avatar | Preview, lựa chọn, xác nhận/hủy, lỗi lưu | WF-03 |
| S-04 | Explore list | Search, filter, quest cards, nút Map, kết quả rỗng | WF-04 |
| S-05 | Explore map | Bản đồ Dana, ghim, locate, thẻ tóm tắt, back/list | WF-04 |
| S-06 | Quest detail | Cover, intro, hai thử thách dự kiến, điểm đầu, safety, start/resume | WF-05 |
| S-07 | My Quests | Đang chơi/đã kết thúc, resume/result, guest gate | WF-11/12 |
| S-08 | Briefing/start | Ngôn ngữ, story mở đầu, photo/map, GPS state, safety | WF-06 |
| S-09 | Story/checkpoint | Tiến trình, nội dung, ảnh nhận diện, Continue | WF-07 |
| S-10 | Challenge | Prompt, ảnh clue, input, submit, help và result | WF-07/08 |
| S-11 | Camera/draft | Purpose, preview trực tiếp/draft, retake/save/cancel | WF-09 |
| S-12 | Album/photo detail | Quyền riêng, metadata, xem/tải/xóa, lỗi từng ảnh | WF-10 |
| S-13 | Result | Solved/skipped, coin xác nhận, kỷ niệm, về Explore | WF-12 |
| S-14 | Shop | Demo label, số dư, card reward, confirm redeem | WF-12 |
| S-15 | Account/settings | Avatar, profile, VI/EN, privacy, logout | WF-03/13 |
| S-16 | Help/report | Tác động hint/skip, form report, trạng thái gửi | WF-08/13 |

S-08–13 về gameplay là đặc tả F2, không phải nhiệm vụ code F1 tự động.

## Components

### C-01 — Button và hành động có ghi dữ liệu
Một primary CTA mỗi nhóm; secondary để hủy/quay lại. Default/hover/pressed/focus/disabled/loading có style rõ. Loading giữ chiều rộng và label có nghĩa (Đang lưu ảnh), tránh chỉ spinner. Disabled vì thiếu điều kiện phải kèm lý do gần nút. Toast chỉ là bổ trợ; kết quả lưu phải hiện bền trong màn. Bấm nhiều lần khóa UI nhưng server vẫn phải chống lặp.

### C-02 — Form field và xác thực
Label hiển thị ngoài placeholder, helper gắn aria-describedby. Mật khẩu có toggle tên rõ và autocomplete phù hợp. Error ngay dưới trường và summary khi cần; focus đến lỗi đầu sau submit. Tên người dùng/Email không bị dịch giá trị. Không yêu cầu camera/location ở màn login. Giới hạn input phản ánh server, không tự đổi chỉ phía UI.

### C-03 — Quest card
Cover là ảnh/illustration có nhãn phù hợp, title, area, số thử thách và thời lượng nếu có nguồn. Không sao/ratings/lượt chơi giả. Guest card không che nội dung bằng login overlay trước khi bấm start. Trạng thái chưa sẵn sàng cần label, không CTA hoạt động giả. Card on map và list cùng questId. Active run có badge Đang chơi và Resume khi có dữ liệu thật.

### C-04 — Map + bottom sheet
Chọn ghim mở sheet ngắn với tên/ảnh/CTA; mở rộng bằng thao tác và nút có thể dùng bàn phím. Locate hiển thị fetching/denied/inaccurate/fresh; marker người chơi gắn sai số, không kéo vào pin để giả đã đến. Search/list hoạt động khi tile lỗi. Attribution bản đồ luôn nhìn thấy, không bị sheet/nav che. Phiên bản map pixel phải giữ đường và label đủ hiểu; ảnh nhận diện nằm trong tab riêng.

### C-05 — Run header, story và challenge
Header đề xuất hiển thị thử thách hiện tại/tổng và menu. Score/timer chỉ hiện khi luật đã chốt và có dữ liệu; không sao chép ba badge của Questo như bắt buộc. Story có cỡ chữ dễ đọc, ảnh có alt; Continue không cộng xu. Challenge có heading rõ, prompt riêng và đáp án theo loại; chưa gửi không hiện solved. Input focus không đẩy mất Check; màn hình nhỏ vẫn đọc được prompt. Wrong answer là trạng thái nội dung, không error server đỏ gây nhầm. Solved/skipped/revealed có label khác nhau.

### C-06 — Ảnh clue/nhận diện
Ảnh PH-03 có nút phóng to và thoát rõ; đọc được biển tên, không dùng crop loại mất chi tiết giải đố. Phóng to không gửi ảnh cá nhân. Địa chỉ copy có báo thành công sau clipboard thực; clipboard lỗi có cách chọn thủ công. Không tự nhận ra địa điểm bằng camera khi chỉ có ảnh mẫu.

### C-07 — Camera và bản xem trước
Màn trước camera: mục đích, quyền cần, lựa chọn từ thiết bị nếu được duyệt. Live view: không có nhãn Đã lưu, nút chụp, đổi camera nếu hỗ trợ, hủy. Draft: hình đủ lớn, nhãn Chưa lưu, Chụp lại/Chọn khác, Lưu ảnh. Saved: nhãn riêng tư, ảnh đã lưu, nếu PH-02 có nút hoàn thành riêng. Không đặt Lưu ảnh và Hoàn thành cùng ý nghĩa.

| Trạng thái | UI bắt buộc | Hành động phục hồi |
| --- | --- | --- |
| Chưa xin quyền | Mục đích chụp + nút mở | Mở hoặc để sau nếu memory |
| Chờ quyền | Đang chờ trình duyệt, không vẽ hộp OS giả | Hủy màn, chờ quyết định |
| Từ chối | Nói camera bị chặn, không nói thiết bị hỏng | Hướng dẫn quyền; chọn file; quay lại |
| Không camera/bận | Mô tả lỗi thiết bị | Thử lại hoặc file |
| Live | Video thật, shutter có label | Chụp/hủy; dừng track khi rời |
| Draft/processing | Preview, trạng thái xử lý, chưa lưu | Hủy/chọn khác sau khi tác vụ an toàn |
| Chất lượng cần xem lại | Nội dung gợi ý, không AI_verified | Chụp lại hoặc user override theo O-05 |
| Uploading | Progress thật nếu có, nếu không dùng trạng thái chờ | Không giả phần trăm; khóa double submit |
| Upload failed | Draft còn nếu chưa rời/refresh, thông báo chưa lưu | Thử lại; không auto complete |
| Saved | Server xác nhận, photoId nội bộ, riêng tư | Quay lại; submit PH-02 riêng |
| Session changed | Không hiển thị ảnh A cho B | Đăng nhập đúng owner hoặc bỏ draft có xác nhận |

Chỉ PH-01 có lời mời bỏ qua camera mà vẫn đi tiếp; PH-02 nêu rõ chưa đủ minh chứng. Ảnh mẫu phóng to là C-06, không dùng màn camera.

### C-08 — Hộp xác nhận
Áp dụng xóa ảnh, logout có draft, bỏ qua thử thách, dùng trợ giúp có tác động và đổi reward. Title/hậu quả cụ thể; primary thể hiện hành động; cancel focus mặc định cho thao tác phá hủy. Tab/Shift+Tab ở trong dialog; Escape khi không busy; phục hồi focus về nút mở. Backdrop/close không gửi giao dịch. Native dialog hoặc implementation có focus management kiểm tra được; aria-modal một mình không đủ.

### C-09 — Album và Shop
Album rỗng có hướng dẫn tạo kỷ niệm, không dùng ảnh công cộng như ảnh của player. Tải ảnh gắn tên file an toàn; lỗi một ảnh có placeholder và retry riêng. Xóa thành công chỉ loại ảnh đã xóa; thông báo tác động coin theo PRD. Shop dùng tên item, cost, mô tả, trạng thái demo, đủ/thiếu xu, đã đổi; không fake inventory hoặc mã dùng thật.

## Accessibility

ĐỀ XUẤT nghiệm thu: tương phản chữ thường ≥4.5:1 và chữ lớn ≥3:1; đây là mục tiêu phải đo, chưa phải chứng nhận. Focus luôn thấy; không chỉ dựa màu. Dialog trap/restore focus; thao tác kéo có nút thay thế; map có list thay thế. Screen reader đọc số thử thách, error field và trạng thái lưu qua live region vừa đủ; không đọc lại cả story sau mỗi GPS update. Respect reduced-motion; không flash pixel hoặc tự phát audio. Cho tăng font/zoom, nhãn VI/EN đủ dài, dòng địa chỉ không tràn ngang. Camera preview/video có mô tả; quyền trình duyệt không bắt chước bằng hình giả.

## Screen states

Mỗi S có loading/empty/error/populated theo dữ liệu thực; cùng định nghĩa lỗi ở ARCHITECTURE. Không gộp guest empty với album zero-photo. Không gộp offline với sai mật khẩu. Không gộp location denied với quá xa. Không gộp skipped với solved. Các màn read-only F1 không ghi state engine F2. Website F5 không có route/page/asset mới trong vòng này.

## Approval

Chủ duyệt: chủ dự án Dana Quest. Đã xác nhận hướng game trước, Questo làm tham khảo, pixel nhận diện, VI/EN. Bảng màu/font, vị trí Album, custom avatar, onboarding và chi tiết gameplay mới vẫn là đề xuất/O trong PRD. Chưa xây mockup mới hoặc kiểm tra UI trực tiếp trong lần soạn này.


### Đính chính hướng cũ và onboarding v2.1
Nhận diện pixel từ bộ người dùng gửi và bố cục Questo là hướng hiện hành; minh họa mềm trong code/tư vấn trước chỉ là hiện trạng cũ, không buộc giữ. First-open chỉ có đường login/register trước các trang game; không tự vẽ Khám phá trước. Sau logout, login gate chỉ chặn hành động riêng/chơi, không phủ toàn màn Explore hoặc quest detail. Độ rộng màn hình không tự đổi game thành website giới thiệu; laptop vẫn có thể mở game để test/demo. Website tương lai cần thiết kế riêng vào F5, không kéo phạm vi vào vòng hiện tại.



## Bộ thiết kế trực quan v2.2 — nguồn bàn giao UI

Đã thiết kế riêng một bản tham khảo offline gồm **33 màn/biến thể thuộc 16 nhóm màn S**, chưa tích hợp vào app:
- [Mở bản thiết kế tương tác](../references/ui-design/index.html): chọn màn trái, xem notes phải; nút Xem toàn bộ màn để so sánh.
- [Bảng xem nhanh bốn màn](../references/ui-design/DESIGN-OVERVIEW.png).
- [Đặc tả chi tiết từng màn và trạng thái](../references/ui-design/SCREEN-SPECS.md): nguồn chính cho annotated UI handoff, ghi actor/nguồn/đọc từ trên xuống/hành động/trạng thái/ngoại lệ.
- [Nguồn ZIP, checksum và phạm vi sử dụng](../references/SOURCE-ARCHIVE.md).

Thiết kế này cụ thể hóa hướng palette/layout v2; vẫn là ĐỀ XUẤT để review. Các S/WF nối tài liệu PRD; V là biến thể, không tự thành feature mới. Prototype dùng Segoe UI/system-ui offline thay vì nhúng font cuối, map SVG chỉ sơ đồ bố cục, camera ảnh tĩnh, nội dung quest/coin/item mẫu. Memory saved về story; evidence saved cần confirm riêng. Chưa có auth/GPS/AI/upload/reward hoặc EN runtime; app thật phải đạt các yêu cầu đó theo phạm vi được duyệt.

Các pixel avatar trong mockup là phác thảo do agent tạo, không thay asset final. Không dùng screenshot Questo như màn production, không gán mọi chi tiết tự thiết kế cho Questo. Website vẫn hoãn F5.
