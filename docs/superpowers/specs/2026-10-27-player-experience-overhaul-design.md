# Dana Quest — Thiết kế hoàn thiện trải nghiệm người chơi

Trạng thái: đề xuất để chủ dự án duyệt; chưa phải mô tả tính năng đã triển khai.

## Mục tiêu và phạm vi

Hoàn thiện sản phẩm để người chơi có một hành trình khám phá liền mạch và có thể trình bày trong buổi báo cáo. Ưu tiên linh hồn quest, điều kiện chuyển trạng thái, xu và voucher đáng tin cậy, bản đồ dễ dùng, tiếng Việt/Anh đầy đủ và giao diện nhất quán. Không giả lập tính năng đã vận hành thật, không hứa đối tác hoặc giá trị thương mại chưa có. Không hiển thị công cụ kiểm thử trong trải nghiệm người chơi.

Giữ React + TypeScript + Vite + Leaflet. Node đang phục vụ tài khoản/gameplay; Django cung cấp một số dữ liệu bản đồ/sự kiện. Không chuyển toàn bộ backend hoặc sửa schema Django trong đợt này. Mọi thay đổi dữ liệu người chơi cần migration có kiểm tra, giữ ID quest/checkpoint và khả năng đọc tiến độ cũ. Kho mã hiện có nhiều thay đổi chưa commit: không reset, không ghi đè chúng.

## Những điều đã đối chiếu trong mã

| Phản ánh | Bằng chứng hiện tại | Hướng xử lý |
|---|---|---|
| Nền login không chuyển/không chuyển động | `WelcomePage.tsx` có timer 20.000 ms, chỉ chọn ảnh đã load; giảm chuyển động dừng autoplay. `AuthPage` dạng modal không tạo backdrop riêng. CSS hiện chỉ crossfade, chưa pan/zoom. | Tái hiện đúng entry point; duy trì nền liên tục khi chuyển welcome/login; phân biệt pan/zoom với đổi ảnh; tôn trọng reduced motion. |
| Chỉ Tài khoản đổi ngôn ngữ | `AccountExperience.tsx` tự quyết định tiếng Anh; `AccountSettings.tsx` còn ghi rõ phạm vi chỉ account/settings. | Một provider ngôn ngữ ở gốc, một bộ nội dung VI/EN cho toàn hệ thống. |
| Bản đồ/sự kiện không cùng hệ dữ liệu | `Explore.tsx` tải `/api/events/feed` từ Django và tự phát toast; `EventProvider` dùng catalog riêng và endpoint account. | Chuẩn hóa adapter dữ liệu sự kiện, một bộ chính sách nhắc; không để bản đồ tạo thêm lời nhắc ngoài chính sách. |
| Xu chia hai ví | `ShopPage` đọc cả `useProgress` và `useQuestProgress`; `server/game-logic.mjs` chỉ cho đổi từ tiến độ legacy, `quest-runs.mjs` lưu quest riêng. | Một ví theo tài khoản, sổ phát/chi có khóa nguồn, thưởng và đổi đều kiểm tra trên server. |
| Công cụ thử sự kiện lộ trong game | `EventsPage.tsx` gắn nút mở `EventDemo`; đây là state local với thời gian giả. | Gỡ khỏi luồng người chơi; thay bằng công cụ người trình bày có quyền và phạm vi riêng. |
| Nội dung và nhãn thử nghiệm dày đặc | Quest detail, discovery, cửa hàng, InformationPage và AccountSettings đều chứa nội dung lặp và nhãn demo. | Viết lại giọng sản phẩm; chỉ giữ thông tin giới hạn thực tế ở đúng nơi cần thiết. |
| Toast và quest đang chơi còn giao diện cũ | `App.css` đặt toast xanh lá; active indicator hình tròn 48px, chữ tiến độ 9px. | Toast theo token mới; nút tiếp tục quest có tên, tiến độ và vùng chạm rõ. |
| Bảo vệ rời quest chưa đồng nhất | `navigationGuard.ts` phát sự kiện, nhưng chỉ `NavigationPage.tsx` đăng ký; `QuestPlayPage.tsx` có hộp thoại leave riêng, chưa đăng ký guard chung. | Tất cả đường ra khỏi phiên chơi đi qua cùng một bộ chặn và quyết định lưu/tạm dừng. |
| Quest chưa có tính phiêu lưu | Catalog có 16 quest; phần lớn tên chỉ là tên địa danh, quest trường đại học còn tên DUE. | Đổi tên hiển thị, giữ ID; biên tập tuyến truyện, mục tiêu, gợi ý và kết thúc cho cả 16 quest. |

Kiểm tra trình duyệt hiện có `tests/login-slideshow-browser.cjs` đã đạt ở 390×844 và 1440×900: 5 ảnh, đổi mỗi 20 giây, quay vòng, tạm dừng, không tràn ngang hoặc lỗi JS. Điều này xác nhận vòng ảnh trong welcome đang hoạt động ở môi trường kiểm tra; không phủ nhận lỗi người dùng gặp ở modal/login hoặc yêu cầu ảnh tự chuyển động.

## Các hướng tiếp cận

1. Sửa từng màn bằng CSS, thay chữ và cộng hai số xu ở frontend: nhanh nhưng không giải quyết phân quyền, phát thưởng lặp, dịch thiếu và điều hướng. Không khuyến nghị.
2. **Đề xuất: sửa nền tảng theo từng lát chức năng, giữ hệ thống đang có.** Chuẩn hóa ngôn ngữ, ví, sự kiện, trạng thái quest, rồi áp dụng component/nội dung mới. Mỗi lát có kiểm thử hồi quy và màn desktop/mobile tương đương.
3. Viết lại app/backend hoặc chuyển sang pixel toàn phần ngay: phạm vi lớn, nguy cơ mất tiến độ, chậm có bản kiểm chứng. Không khuyến nghị trong đợt này.

Phương án 2 là đề xuất của người thực hiện, chưa ghi nhận là lựa chọn đã được chủ dự án phê duyệt.

## Giao diện và khả năng chuyển sang pixel

- Hướng: nhật ký phiêu lưu thành phố, sạch và có chiều sâu. Nền kem ấm, chữ mực đậm, một màu nhấn tím trầm phù hợp các màn mới, vàng cho phần thưởng. Màu trạng thái chỉ xuất hiện nơi có ý nghĩa.
- Giữ thương hiệu pixel ở nhân vật, vật phẩm, chi tiết thành phố; không ép font pixel vào đoạn truyện dài. Không phối đồng thời mọi bộ skin đã cài.
- Token theo vai trò: surface, text, accent, reward, success, warning, danger, focus; spacing, type, radius, shadow, motion. Component dùng token, không thêm lớp CSS vá ghi đè cuối file.
- Theme pixel sau này đổi token, khung/viền và asset registry; dữ liệu quest, bản đồ, ví, ngôn ngữ và điều kiện chơi không phụ thuộc skin.
- Bỏ dòng DANA QUEST riêng trên Khám phá/Quest; tiêu đề trang theo cùng hệ với Sự kiện. Thương hiệu vẫn có ở welcome/thông tin ứng dụng.
- Nút tối thiểu 44×44px; focus rõ, không phụ thuộc hover/màu; label không bị cắt ở tiếng Anh; safe area và keyboard trên điện thoại.
- Tương tác nút 120–180ms, panel/dialog 180–240ms, chuyển bước 180–280ms qua opacity/transform. Không animation trang trí liên tục cạnh câu đố. Reduced motion chuyển trực tiếp, không pan/zoom/parallax.

## Login

- 5 ảnh hiện có, 20 giây/ảnh, crossfade khoảng 1,2–1,6 giây và chuyển động pan/zoom nhẹ trong mỗi ảnh khi người dùng cho phép chuyển động.
- Một backdrop liên tục cho welcome và login/register toàn màn; modal đăng nhập giữ ngữ cảnh đang xem, không tự biến mọi trang thành nền slideshow.
- Ảnh kế tiếp preload/decode; ảnh hỏng bị bỏ qua; không hiện khung trống. Nút tạm dừng/tiếp tục truy cập được.
- Timer được dọn khi unmount, dừng khi tab ẩn; kiểm tra vòng qua ảnh thứ năm, đăng nhập dạng sheet, đường dẫn trực tiếp và mở lại app có cache cũ.

## Ngôn ngữ toàn hệ thống

- Provider ở gốc ứng dụng; VI/EN/System áp dụng ngay cho navigation, auth, onboarding, bản đồ/tooltip, quest/story/hint, sự kiện, cửa hàng/voucher, account, legal/help và thông báo.
- Có catalog nội dung tiếng Anh đầy đủ; không dùng thay chữ trong DOM hoặc dịch tự động mỗi lần render. Dữ liệu người dùng tự nhập và tên riêng địa danh giữ nguyên khi thích hợp.
- `html.lang`, ngày/giờ/số, label trợ năng, lỗi validation và thông báo API phải theo locale. Server trả mã lỗi ổn định; client hiển thị bản dịch.
- Lựa chọn khách được giữ cục bộ; đăng nhập lấy preference đúng chủ tài khoản, đăng xuất không để ngôn ngữ/dữ liệu riêng của tài khoản trước rò sang tài khoản sau.
- Kiểm tra đủ khóa VI/EN và toàn bộ nội dung catalog, không chỉ vài nút account.

## Khám phá, bản đồ và vị trí

- Khám phá có thanh công cụ rõ: vị trí/khu vực và CTA **Mở bản đồ** cạnh tìm kiếm, không tạo hai khối rời rạc khó tìm.
- Desktop: bản đồ và sidebar danh sách cạnh nhau; mobile: bản đồ với sheet danh sách có thể mở rộng/thu gọn, hai bộ lọc luôn truy cập được.
- Hai lựa chọn chính: **Sự kiện sắp diễn ra** và **Địa điểm khám phá quest**. Khi đổi lọc, cùng một tập kết quả điều khiển danh sách và marker.
- `fitBounds` toàn bộ tập kết quả sau khi lọc, có padding cho sidebar/sheet, giới hạn maxZoom nếu chỉ có một điểm. Không tự kéo lại camera ở mỗi tick timer hoặc khi người dùng đang kéo.
- Sự kiện/quest có marker khác màu và khác ký hiệu kèm legend; chọn dòng highlight marker và ngược lại. Nhiều sự kiện cùng địa điểm không làm mất mục trong danh sách.
- Khi không có kết quả: giải thích và cho bỏ lọc; không fit bounds rỗng. Dữ liệu chưa có tọa độ không đặt ghim giả.
- Định vị dùng GPS thiết bị có sự đồng ý, hiển thị nhân vật của tài khoản hiện tại và vòng sai số; tọa độ không phải địa chỉ được suy đoán từ profile. Xử lý từ chối quyền, timeout, vị trí cũ, sai số lớn và người dùng ở ngoài Đà Nẵng.

## Xu, phần thưởng và voucher

- UI chỉ có **Xu Dana** và XP; tất cả nhiệm vụ/quest hợp lệ cấp vào cùng một số dư do backend quản lý. Không chỉ cộng số ở frontend.
- Ledger theo tài khoản, mỗi credit có định danh nguồn bất biến (quest/checkpoint hoặc legacy mission), debit gắn receipt. Gửi lặp, hai tab, reload và retry không cấp/chi hai lần.
- Migration tính lại lịch sử hiện có, không cộng kép tiến độ legacy đã chuyển sang quest; bảo toàn số đã chi và voucher cũ. Lưu backup, version và marker migration; không tự reset.
- Cửa hàng và Account/Wallet đọc cùng API. Đổi thành công tạo receipt/voucher thuộc chủ tài khoản; Account có **Voucher của tôi**, gồm ảnh, quyền lợi, ngày đổi, trạng thái, điều kiện và lịch sử.
- Quyết định đối soát: completion/checkpoint đã được server xác nhận và receipt ghi thành công là nguồn xác thực; cache client không tự tạo credit. Nếu dữ liệu cũ không đủ xác định overlap hoặc khoản chi lớn hơn phần thu có thể chứng minh, không đoán, không xóa hay ghi balance mới. Giữ nguyên bản cũ/backup, trả trạng thái cần đối soát cùng lịch sử đọc được và tạm chặn redeem của tài khoản đó cho đến khi operator xử lý có ghi adjustment rõ lý do. Tài khoản dữ liệu hợp lệ migration tự động; trường hợp bất thường có test riêng.
- Nếu chưa có nhà cung cấp thực, ghi giới hạn ngắn trong điều kiện voucher; không tạo mã có vẻ dùng được tại đối tác chưa liên kết. Bỏ nhãn demo lặp khắp UI không đồng nghĩa tạo quyền lợi thương mại giả.
- Bộ 7 ảnh: bưu thiếp, đồ uống, quà lưu niệm, mì Quảng, phương tiện, vé tham quan, chèo kayak. Dùng ImageGen với tham chiếu pixel thương hiệu đã cung cấp. Tạo bản duyệt hướng hình, rồi xuất 7 asset riêng nhất quán và tích hợp; không coi SVG placeholder hiện tại là ảnh đã tạo.

## Sự kiện và cách trình bày thông báo bất kỳ lúc nào

- Xóa import/nút `EventDemo` khỏi trang người chơi; không thêm nút bí mật cho mọi tài khoản hoặc nhận `now` từ client.
- Một nguồn catalog/occurrence và một policy nhắc. Nền tảng backend là nơi claim/kiểm tra chủ tài khoản, thời gian và chống lặp. Bản đồ không phát toast sự kiện riêng.
- Quyết định định danh: Node giữ canonical event ID và occurrence ID; adapter Django ánh xạ bằng ID nguồn có namespace trong bảng mapping tường minh, không ghép ngầm theo tên. Event mới chưa map không được nhập chung với event có sẵn. Occurrence key gồm event ID + giờ bắt đầu UTC. Khi đổi giờ, occurrence cũ được đánh dấu thay lịch, giữ lịch sử/attendance cũ để đối soát nhưng không tự chuyển đồng ý sang giờ mới; người chơi xác nhận lại, mỗi occurrence mới vẫn chịu cooldown và chống lặp. Điều chỉnh mô tả không đổi giờ thì giữ occurrence và quyết định hiện tại.
- Công cụ người trình bày ở chế độ được bật riêng trên server, thao tác qua CLI quản trị cục bộ hoặc tài khoản có quyền, không nằm trong menu người chơi. Tạo một lịch phiên trình bày thuộc nhóm/tài khoản được chọn, không sửa giờ sự kiện công khai và không đổi đồng hồ máy.
- Kịch bản mời: tạo lịch phiên bắt đầu sau 90 phút để thực sự nằm trong cửa sổ lời mời hiện có (trước 3 giờ và ngoài 30 phút cuối). Kịch bản nhắc: tạo lịch sau 20 phút rồi người trình bày chủ động chọn tham gia; bộ luật thật cho phép lời nhắc trước 30 phút. Đây là hai ca riêng, không ép state người chơi thành đã tham gia.
- Vẫn bắt buộc phiên hợp lệ, audience đúng, sự kiện có giờ/trạng thái xác nhận, chưa hết hạn, bật thông báo, cooldown 5 phút, không lặp occurrence, tab hiển thị và không ở luồng quest. Nếu đang chơi thì chờ trạng thái an toàn; nếu đã quá giờ thì không hiện.
- Công cụ có trạng thái giải thích vì sao chưa đủ điều kiện cho người trình bày. Tạo occurrence mới khi bắt đầu lần trình bày mới; không xóa lịch sử của người dùng để ép thông báo.
- Phân biệt thông báo trong app và hệ điều hành. Trình duyệt phải được cấp quyền cho loại thứ hai; không hứa gửi khi app đóng nếu chưa có Web Push.

## Quest: tên và linh hồn câu chuyện

Giữ nguyên ID và checkpoint ID để không mất tiến độ. Thay tên, bìa, mô tả, từng đoạn dẫn chuyện/gợi ý/kết thúc bằng catalog bản địa hóa. Truyện là hư cấu dẫn dắt khám phá; địa chỉ, lịch sử và quy định địa điểm phải có nguồn, không biến hư cấu thành dữ kiện.

| Địa điểm hiện tại | Tên hành trình đề xuất |
|---|---|
| DUE | Mật thư của người giữ ký ức |
| Cầu Rồng | Đánh thức Long Mạch |
| Cầu Sông Hàn | Khi dòng sông đổi chiều |
| Bảo tàng Đà Nẵng | Những trang thành phố thất lạc |
| Bảo tàng Điêu khắc Chăm | Lời thì thầm trong đá |
| Công viên APEC | Mật mã dưới cánh diều |
| Cầu Tình Yêu | Bức thư bên bờ Hàn |
| Bãi biển Mỹ Khê | Dấu chân người nhặt sóng |
| Công viên Biển Đông | Người gác bình minh |
| Mân Thái | Hải trình của cánh buồm nhỏ |
| Chùa Linh Ứng – Bãi Bụt | Dấu lặng trên Sơn Trà |
| Đỉnh Bàn Cờ | Nước cờ giữa tầng mây |
| Hải Vân Quan | Cánh cổng của hai miền gió |
| Ngũ Hành Sơn | Năm mảnh ấn sơn |
| Cầu Vàng | Lối đi trên bàn tay mây |
| Nam Ô | Mảnh bản đồ nơi đầu sóng |

Khung biên tập mỗi quest: hook + vai người chơi + mục tiêu cụ thể + vật chứng/ẩn số; mỗi checkpoint tiết lộ một phần và cần hành động quan sát/giải đố; gợi ý chia mức không tiết lộ ngay; trả lời sai có phản hồi hỗ trợ; kết thúc giải đáp bí ẩn, nhắc quan sát thực tế và mở tuyến tiếp theo phù hợp.

Ví dụ DUE: người chơi nhặt được một phong thư không ghi người gửi, chỉ có một tọa độ và năm mảnh ký ức. “Con số mở cổng” là tọa độ đầu; “Nửa thế kỷ” là chìa khóa sắp lại dòng thời gian; các bước ghép/sắp xếp hiện có trở thành khôi phục lá thư. Kết thúc trả lại ký ức cho người giữ thư, thay vì chỉ thông báo hoàn thành bài kiểm tra. Không đổi đáp án đúng hoặc thứ tự checkpoint khi chỉ biên tập truyện; nếu thay cơ chế thì tăng catalog version và có migration riêng.

## Luồng chơi và điều hướng

Trạng thái chuẩn: chưa bắt đầu → chuẩn bị → chỉ đường → xác nhận đến → truyện → thử thách → phản hồi → checkpoint kế tiếp → kết thúc. Tạm dừng/tiếp tục là trạng thái có lưu, không tự cấp thưởng.

- Server kiểm tra điều kiện từng bước, checkpoint hiện tại, chủ tài khoản và việc đã nhận thưởng. Không cho URL trực tiếp bỏ qua đến nơi hoặc nhảy checkpoint.
- Back trình duyệt, menu, tab điều hướng, link bản đồ và deep link đều đi qua cùng guard trong phiên chơi. Hộp thoại cho ở lại hoặc lưu/tạm dừng rồi rời đi; không mất input khi chỉ đọc lại truyện/gợi ý.
- Logout/phiên hết hạn/mạng lỗi có hướng phục hồi rõ; phản hồi chậm của tài khoản A không ghi đè tài khoản B.
- Nếu lưu pause thất bại hoặc timeout: giữ người chơi ở màn hiện tại, giữ đáp án đang nhập, hiển thị lỗi và cho thử lại/ở lại; chỉ điều hướng đến đích chờ sau khi server xác nhận. Không báo “đã lưu” trước xác nhận. Refresh/đóng tab dùng cảnh báo trình duyệt khi hỗ trợ; không hứa giữ được input chưa lưu khi hệ điều hành cưỡng bức đóng app. Tiến độ đã xác nhận vẫn phục hồi từ server.
- Không đưa người chơi qua vòng auth → quest → auth hoặc quest detail → navigation → detail mà không có lý do. Nút chính trỏ đến bước kế tiếp hợp lệ theo trạng thái.
- Mobile/laptop có đủ cùng hành động, khác bố cục. Không giấu chức năng chỉ vì thiếu chiều rộng.

## Nội dung hướng dẫn và thông tin sử dụng

Một nguồn nội dung dùng chung giữa thông tin công khai và Account: cách bắt đầu, chọn quest, quyền GPS, giải câu đố, ảnh, gợi ý, pause/resume, xu, đổi quà, tìm voucher, thông báo, xử lý lỗi. Có mục lục, ví dụ thao tác và trường hợp mất kết nối.

Điều khoản/quyền riêng tư phản ánh dữ liệu và dịch vụ thực tế, bao gồm an toàn khi đi bộ, khu vực được phép, tài khoản, ảnh, vị trí, bên nhận dữ liệu bản đồ/chỉ đường, lưu trữ/xóa, phần thưởng, liên hệ và phiên bản hiệu lực. Thông tin chủ thể vận hành, địa chỉ liên hệ và chính sách thương mại chưa được cung cấp phải đánh dấu cần xác nhận, không tự bịa. Không tự nhận chính sách đã được tư vấn pháp lý hay đối tác chấp thuận.

## Skill và công cụ theo công việc

| Việc | Skill/công cụ sử dụng |
|---|---|
| Chẩn đoán, dữ liệu và lỗi bất đồng bộ | systematic-debugging, kiểm tra source/data flow, Vitest/API |
| Bố cục, hệ token, pixel readiness | ui-ux-pro-max, frontend-ui-engineering, apple-design cho nguyên tắc tương tác khi phù hợp |
| Chuyển động | animate, animation-performance; CSS/Leaflet trước, GSAP chỉ khi có nhu cầu thực |
| Nội dung/luồng quest | spec-driven-development, planning-and-task-breakdown, biên tập catalog VI/EN |
| Ảnh thưởng | imagegen với brand-contact.png, không thay ảnh AI bằng placeholder |
| Ví/API/quyền công cụ trình bày | api-and-interface-design, security-and-hardening, test-driven-development |
| Rà soát cuối | code-review-and-quality, ponytail-review, verification-before-completion, trình duyệt thật |

Không chạy tất cả skill cùng lúc vì các workflow/gu thẩm mỹ có thể xung đột. Mỗi việc dùng bộ phù hợp và chuẩn UI chung của sản phẩm.

## Điều kiện nghiệm thu

1. VI/EN đầy đủ mọi màn, nội dung quest, lỗi và label; đổi ngôn ngữ không mất phiên/input.
2. Nền welcome/login quay vòng qua cả 5 ảnh đúng 20 giây; kiểm tra chuyển động, lỗi ảnh, reduced motion, tab ẩn.
3. Danh sách/marker/bounds khớp cả hai bộ lọc; định vị đúng nhân vật và có fallback.
4. Một số dư xu, một lịch sử giao dịch; chơi/đổi/retry/hai tab không nhận lặp; voucher hiện trong Account.
5. Không có công cụ thử trong game; hai tình huống thông báo được chứng minh bằng policy thật, cả ca phải bị chặn.
6. Cả 16 quest có hook, diễn tiến và kết thúc VI/EN; tên mới không làm mất tiến độ cũ.
7. Không rời quest vô ý; mọi đường điều hướng được kiểm tra theo trạng thái và quyền.
8. Kiểm tra 320/390/768/1024/1440px, ngang/dọc, keyboard, reduced motion, mạng lỗi, account switch.
9. Build/lint/unit/integration/browser được báo kết quả thực; phân biệt chặn môi trường và lỗi sản phẩm. Không lấy test cũ không liên quan làm bằng chứng tính năng mới.
