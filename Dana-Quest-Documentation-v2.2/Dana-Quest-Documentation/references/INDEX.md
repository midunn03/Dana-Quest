# Nguồn tham khảo và bản đồ ảnh — Dana Quest v2

## Phạm vi và nguồn gốc

Ảnh do chủ dự án cung cấp ngày 26/10/2026 trong hai ZIP: Ảnh màn hình Questo-20261026T133523Z-1-001.zip và Bộ nhận diện-20261026T133529Z-1-001.zip. Đã xem bảng tổng quan 92 ảnh Questo và xem phóng lớn các ảnh gameplay/photo/help được dùng phân tích. Các ảnh được đổi tên số để đường dẫn trong pack ổn định; bảng bên dưới giữ tên gốc. Đây là bằng chứng giao diện tại thời điểm chụp, không xác nhận toàn bộ phiên bản Questo hiện tại.

Code nguồn tham khảo là Dana-Quest.zip do người dùng gửi; chỉ đọc chọn lọc, chưa chạy hay audit toàn bộ. Yêu cầu sản phẩm lấy từ ghi chú 14 ý “Note document 26/10” trong Pasted text.txt và các cập nhật tiếp theo: game trình duyệt trước, website sau; tài liệu chi tiết cho vai trò/workflow/gameplay/ảnh. Không sao chép file pasted gốc có đường dẫn cá nhân vào gói phát hành.

## Cách dùng pack

Tám tài liệu chính ở AGENTS.md và docs/. references/ chỉ là tài sản tham khảo để agent nhìn bằng chứng. Không đưa nguyên ảnh Questo vào sản phẩm, không nhầm mẫu UX với yêu cầu phải có tất cả tính năng. Khi copy tài liệu cho agent khác, giữ references/ cạnh AGENTS.md để link ảnh không hỏng. Pack không chứa source ứng dụng, .git, account data hoặc API key.

Các quyết định chi tiết được đánh dấu YÊU CẦU/THAM KHẢO/ĐỀ XUẤT/CẦN CHỐT/HIỆN TRẠNG. Không coi mọi schema/API/token/test plan là đã được triển khai. Quy tắc sản phẩm chuẩn là PRD; dữ liệu/quyền/API/UI/tests dẫn chiếu theo ID.

## Xem nhanh

- [Bảng tổng quan toàn bộ ảnh Questo](questo-contact.png): số trên mỗi hình tra theo bảng tên gốc; một số hình không copy riêng vì không dùng trong đặc tả ưu tiên.
- [Bảng tổng quan bộ nhận diện](brand-contact.png).
- [Logo Dana Quest](brand/001.png), [poster mẫu](brand/002.png), [mẫu giao diện nhân vật](brand/003.png).

## Quan sát luồng chơi

| Nhóm | Ảnh trong pack | Nội dung nhìn thấy | Không suy ra từ ảnh |
| --- | --- | --- | --- |
| Khám phá | [002](questo/002.png), [014](questo/014.png), [037](questo/037.png), [040](questo/040.png), [046](questo/046.png) | List/card, tìm, map ghim và thẻ, quest detail | Thuật toán recommend, backend catalog, quyền GPS Dana |
| Chi tiết | [016](questo/016.png), [026](questo/026.png), [027](questo/027.png) | Cover/tóm tắt/việc cần làm/ảnh người chơi | Dana có trả phí/review/public photo feed |
| Chuẩn bị | [043](questo/043.png), [048](questo/048.png), [072](questo/072.png) | Màn chuẩn bị, tùy chọn và settings trong bộ reference | Phải thêm mọi mode, multiplayer/offline hoặc settings đó vào Dana |
| Điểm bắt đầu | [031](questo/031.png), [028](questo/028.png), [044](questo/044.png) | Ảnh nhận diện/map, quá xa, an toàn, xác nhận thấy điểm | Bán kính GPS, chống giả mạo, đường đi an toàn đã kiểm chứng |
| Ảnh kỷ niệm | [077](questo/077.png), [032](questo/032.png), [052](questo/052.png) | Mời chụp có thể để sau; xin quyền; ảnh riêng và lựa chọn chia sẻ | AI kiểm tra nội dung; mặc định ảnh public; phải thưởng khi share |
| Story/chỉ dẫn | [067](questo/067.png), [075](questo/075.png), [054](questo/054.png) | Đọc nội dung, hướng dẫn tới điểm, tiếp tục | Mỗi Continue là một challenge hoặc một lần nhận coin |
| Câu đố | [065](questo/065.png), [071](questo/071.png) | Ảnh clue, phóng to, trường đáp án, check/help | Upload ảnh player là cách trả lời duy nhất |
| Trợ giúp/kết quả | [055](questo/055.png), [063](questo/063.png), [017](questo/017.png), [018](questo/018.png) | Hint xác nhận, reveal, skipped state, tiếp tục truyện | Công thức điểm/coin/timer/quota hint của Dana |
| Menu/hỗ trợ/thoát | [074](questo/074.png), [057](questo/057.png), [060](questo/060.png) | Menu chơi, lựa chọn report, thông báo giữ tiến độ khi thoát | Dana phải có nhạc, mời bạn, gửi support thật hoặc offline |
| Tài khoản/quest riêng | [079](questo/079.png), [025](questo/025.png), [042](questo/042.png), [078](questo/078.png) | Guest nhắc login, My Quests, profile/settings | Dana cần leaderboard, crew, cùng hệ danh hiệu |

### Ghi chú độ chắc chắn
Ảnh 032 là hộp quyền camera hệ điều hành trong nền luồng kỷ niệm nhưng mô tả quyền nhắc avatar; tài liệu Dana phải dùng lời giải thích đúng purpose, không sao chép chỗ lệch đó. Bộ ảnh có cả quest khác và trạng thái không liền nhau; thứ tự số file không phải timeline đầy đủ. Không suy luật sai đáp án, auto-save, backend hay kết quả cuối quest từ một ảnh tĩnh. Phần Dana về preview/retake/quota/idempotency là thiết kế đề xuất được gắn nhãn trong tài liệu, không gán thành tính năng Questo đã được chứng minh.

## Nguồn công khai đã kiểm tra ở lượt tư vấn trước

- [Questo website](https://questoapp.com/): nguồn tham khảo website tương lai, không yêu cầu làm website hiện tại.
- [GitHub Pages là static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages): không tự chạy backend Node file-based.
- [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/): attribution/usage, không dịch vụ vô hạn hoặc offline bulk download.
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/) và [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/): nguồn khảo sát, chưa chọn làm nhà cung cấp.
- [Be Vietnam Pro](https://fonts.google.com/specimen/Be+Vietnam+Pro): ứng viên font đề xuất, chưa phê duyệt palette/font.

Không mặc định quota hoặc giá giữ nguyên khi đến triển khai. Kiểm tra lại nguồn chính thức tại thời điểm chọn dịch vụ; không tự đăng ký trả phí/bật billing.

## Tra tên gốc

| Số | Đường dẫn gốc trong ZIP | File riêng trong pack |
| --- | --- | --- |
| 001 | Ảnh màn hình Questo/Crew page khi đã đăng nhập/IMG_6757.PNG | Xem contact sheet |
| 002 | Ảnh màn hình Questo/Explore page/IMG_6728.PNG | [002](questo/002.png) |
| 003 | Ảnh màn hình Questo/Crew page khi đã đăng nhập/IMG_6761.PNG | Xem contact sheet |
| 004 | Ảnh màn hình Questo/Crew page khi đã đăng nhập/IMG_6762.PNG | Xem contact sheet |
| 005 | Ảnh màn hình Questo/Quest detail page/IMG_6750.PNG | Xem contact sheet |
| 006 | Ảnh màn hình Questo/Explore page/IMG_6729.PNG | Xem contact sheet |
| 007 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6740.PNG | [007](questo/007.png) |
| 008 | Ảnh màn hình Questo/Explore page/IMG_6731.PNG | Xem contact sheet |
| 009 | Ảnh màn hình Questo/Quest detail page/IMG_6752.PNG | Xem contact sheet |
| 010 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6739.PNG | [010](questo/010.png) |
| 011 | Ảnh màn hình Questo/Explore page/IMG_6766.PNG | Xem contact sheet |
| 012 | Ảnh màn hình Questo/Quest detail page/IMG_6753.PNG | Xem contact sheet |
| 013 | Ảnh màn hình Questo/Crew page khi đã đăng nhập/IMG_6763.PNG | Xem contact sheet |
| 014 | Ảnh màn hình Questo/Explore page/IMG_6727(1).PNG | [014](questo/014.png) |
| 015 | Ảnh màn hình Questo/Explore page/IMG_6727.PNG | Xem contact sheet |
| 016 | Ảnh màn hình Questo/Quest detail page/IMG_6747.PNG | [016](questo/016.png) |
| 017 | Ảnh màn hình Questo/Quest khi chơi/IMG_6799.PNG | [017](questo/017.png) |
| 018 | Ảnh màn hình Questo/Quest khi chơi/IMG_6800.PNG | [018](questo/018.png) |
| 019 | Ảnh màn hình Questo/Quest detail page/IMG_6754.PNG | Xem contact sheet |
| 020 | Ảnh màn hình Questo/Crew page khi đã đăng nhập/IMG_6760.PNG | Xem contact sheet |
| 021 | Ảnh màn hình Questo/Quest detail page/IMG_6748.PNG | Xem contact sheet |
| 022 | Ảnh màn hình Questo/Crew page khi đã đăng nhập/IMG_6759.PNG | Xem contact sheet |
| 023 | Ảnh màn hình Questo/Crew page khi đã đăng nhập/IMG_6758.PNG | Xem contact sheet |
| 024 | Ảnh màn hình Questo/Quest detail page/IMG_6755.PNG | Xem contact sheet |
| 025 | Ảnh màn hình Questo/Quest page/IMG_6810.PNG | [025](questo/025.png) |
| 026 | Ảnh màn hình Questo/Quest detail page/IMG_6751.PNG | [026](questo/026.png) |
| 027 | Ảnh màn hình Questo/Quest detail page/IMG_6749.PNG | [027](questo/027.png) |
| 028 | Ảnh màn hình Questo/Quest khi chơi/IMG_6774.PNG | [028](questo/028.png) |
| 029 | Ảnh màn hình Questo/Quest khi chơi/IMG_6797.PNG | Xem contact sheet |
| 030 | Ảnh màn hình Questo/Quest page/IMG_6811.PNG | Xem contact sheet |
| 031 | Ảnh màn hình Questo/Quest khi chơi/IMG_6773.PNG | [031](questo/031.png) |
| 032 | Ảnh màn hình Questo/Quest khi chơi/IMG_6778.PNG | [032](questo/032.png) |
| 033 | Ảnh màn hình Questo/Quest khi chơi/IMG_6771.PNG | Xem contact sheet |
| 034 | Ảnh màn hình Questo/Quest khi chơi/IMG_6772.PNG | Xem contact sheet |
| 035 | Ảnh màn hình Questo/Explore page/IMG_6730.PNG | Xem contact sheet |
| 036 | Ảnh màn hình Questo/Quest khi chơi/IMG_6767.PNG | Xem contact sheet |
| 037 | Ảnh màn hình Questo/Explore page/IMG_6764.PNG | [037](questo/037.png) |
| 038 | Ảnh màn hình Questo/Quest detail page/IMG_6756.PNG | Xem contact sheet |
| 039 | Ảnh màn hình Questo/Quest khi chơi/IMG_6791.PNG | Xem contact sheet |
| 040 | Ảnh màn hình Questo/Explore page/IMG_6732.PNG | [040](questo/040.png) |
| 041 | Ảnh màn hình Questo/Quest khi chơi/IMG_6792.PNG | Xem contact sheet |
| 042 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6742.PNG | [042](questo/042.png) |
| 043 | Ảnh màn hình Questo/Quest khi chơi/IMG_6768.PNG | [043](questo/043.png) |
| 044 | Ảnh màn hình Questo/Quest khi chơi/IMG_6775.PNG | [044](questo/044.png) |
| 045 | Ảnh màn hình Questo/Quest page/IMG_6812.PNG | Xem contact sheet |
| 046 | Ảnh màn hình Questo/Explore page/IMG_6765.PNG | [046](questo/046.png) |
| 047 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6737(1).PNG | Xem contact sheet |
| 048 | Ảnh màn hình Questo/Quest khi chơi/IMG_6790.PNG | [048](questo/048.png) |
| 049 | Ảnh màn hình Questo/Quest khi chơi/IMG_6776.PNG | Xem contact sheet |
| 050 | Ảnh màn hình Questo/Quest khi chơi/IMG_6769.PNG | Xem contact sheet |
| 051 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6737.PNG | Xem contact sheet |
| 052 | Ảnh màn hình Questo/Quest khi chơi/IMG_6779.PNG | [052](questo/052.png) |
| 053 | Ảnh màn hình Questo/Quest khi chơi/IMG_6786.PNG | Xem contact sheet |
| 054 | Ảnh màn hình Questo/Quest khi chơi/IMG_6777.PNG | [054](questo/054.png) |
| 055 | Ảnh màn hình Questo/Quest khi chơi/IMG_6796.PNG | [055](questo/055.png) |
| 056 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6743.PNG | [056](questo/056.png) |
| 057 | Ảnh màn hình Questo/Quest khi chơi/IMG_6782.PNG | [057](questo/057.png) |
| 058 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6745.PNG | Xem contact sheet |
| 059 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6735.PNG | Xem contact sheet |
| 060 | Ảnh màn hình Questo/Quest khi chơi/IMG_6801.PNG | [060](questo/060.png) |
| 061 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6735(1).PNG | Xem contact sheet |
| 062 | Ảnh màn hình Questo/Login page/IMG_6806.PNG | [062](questo/062.png) |
| 063 | Ảnh màn hình Questo/Quest khi chơi/IMG_6798.PNG | [063](questo/063.png) |
| 064 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6734.PNG | Xem contact sheet |
| 065 | Ảnh màn hình Questo/Quest khi chơi/IMG_6794.PNG | [065](questo/065.png) |
| 066 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6736.PNG | Xem contact sheet |
| 067 | Ảnh màn hình Questo/Quest khi chơi/IMG_6780.PNG | [067](questo/067.png) |
| 068 | Ảnh màn hình Questo/Quest khi chơi/IMG_6783.PNG | Xem contact sheet |
| 069 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6734(1).PNG | Xem contact sheet |
| 070 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6736(1).PNG | Xem contact sheet |
| 071 | Ảnh màn hình Questo/Quest khi chơi/IMG_6795.PNG | [071](questo/071.png) |
| 072 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6744.PNG | [072](questo/072.png) |
| 073 | Ảnh màn hình Questo/Quest khi chơi/IMG_6770.PNG | Xem contact sheet |
| 074 | Ảnh màn hình Questo/Quest khi chơi/IMG_6781.PNG | [074](questo/074.png) |
| 075 | Ảnh màn hình Questo/Quest khi chơi/IMG_6793.PNG | [075](questo/075.png) |
| 076 | Ảnh màn hình Questo/Quest khi chơi/IMG_6788.PNG | Xem contact sheet |
| 077 | Ảnh màn hình Questo/Quest khi chơi/IMG_6787.PNG | [077](questo/077.png) |
| 078 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6741.PNG | [078](questo/078.png) |
| 079 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6738.PNG | [079](questo/079.png) |
| 080 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6738(1).PNG | Xem contact sheet |
| 081 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6746.PNG | Xem contact sheet |
| 082 | Ảnh màn hình Questo/Login page/IMG_6803.PNG | [082](questo/082.png) |
| 083 | Ảnh màn hình Questo/Login page/IMG_6808.PNG | [083](questo/083.png) |
| 084 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6733(1).PNG | Xem contact sheet |
| 085 | Ảnh màn hình Questo/Login page/IMG_6809.PNG | [085](questo/085.png) |
| 086 | Ảnh màn hình Questo/Quest khi chơi/IMG_6789.PNG | Xem contact sheet |
| 087 | Ảnh màn hình Questo/Login page/IMG_6805.PNG | Xem contact sheet |
| 088 | Ảnh màn hình Questo/Quest khi chơi/IMG_6784.PNG | Xem contact sheet |
| 089 | Ảnh màn hình Questo/Quest khi chơi/IMG_6785.PNG | Xem contact sheet |
| 090 | Ảnh màn hình Questo/Page quest tb chưa login và page account/IMG_6733.PNG | Xem contact sheet |
| 091 | Ảnh màn hình Questo/Login page/IMG_6807.PNG | [091](questo/091.png) |
| 092 | Ảnh màn hình Questo/Login page/IMG_6804.PNG | [092](questo/092.png) |

## Đối chiếu v2.1
Xem [bảng phân bổ 14 ý và nội dung tư vấn](REQUIREMENTS-COVERAGE.md). Yêu cầu login lần đầu được đính chính là đã xác định; chi tiết nhận biết còn mở. Website vẫn hoãn F5. Bản ZIP v2 giữ nguyên, bản v2.1 chứa cập nhật mới.

## Thiết kế và ZIP nguyên bản v2.2
- [Mở thiết kế tương tác offline](ui-design/index.html).
- [Bảng tổng quan bốn màn](ui-design/DESIGN-OVERVIEW.png).
- [Chú giải cực chi tiết từng màn và biến thể](ui-design/SCREEN-SPECS.md).
- [Nguyên ZIP 92 ảnh Questo](<../../../docs/archive/source-packages/Ảnh màn hình Questo-20261026T133523Z-1-001.zip>) — giữ nguyên byte.
- [Checksum và chính sách dùng source](SOURCE-ARCHIVE.md).

Bản v2.2 có 33 màn/biến thể prototype, 9 ảnh nguồn được bổ sung thành file riêng bên cạnh ZIP nguyên bản. Source screenshot chỉ để review, không tự công khai GitHub.

