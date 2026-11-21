# Đối chiếu báo cáo với website Dana Quest

Ngày đối chiếu: 20/11/2026.

Nguồn: `D:\DUE\hockyI-nam 3\dự án lớn\báo cáo.docx`, bản sửa ngày 17/11/2026, và mã hiện tại trong `Dana-Quest-nhanh-dung`. Đã đọc phần văn bản của báo cáo, gồm nội dung các bảng, rồi đối chiếu các tuyến giao diện, API, dữ liệu và tài liệu triển khai liên quan. Đây là đối chiếu hiện trạng mã; không phải kiểm chứng thực địa hoặc kiểm thử lại toàn bộ chức năng trong lượt này.

## Kết luận

Phần lõi demo tương đối khớp: danh mục thực có 16 quest với 35 thử thách, cùng tài khoản, nhân vật, bản đồ, chỉ đường, vòng chơi, lưu tiến độ, XP/xu, đánh giá/yêu thích/theo dõi và sự kiện. Tuy nhiên có năm điểm chưa khớp hoặc mới thực hiện một phần. Album ảnh là chênh lệch rõ nhất trong nhóm chức năng được báo cáo mô tả là hiện có; đo lường thử nghiệm là phần thiếu lớn nhất để thực hiện kế hoạch KPI.

## Năm điểm cần làm rõ hoặc bổ sung

| Điểm | Nội dung trong báo cáo | Hiện trạng web | Đánh giá |
| --- | --- | --- | --- |
| Album ảnh cá nhân | I.3.6.f, IV.3/Bảng 13: người chơi chủ động chọn, lưu ảnh kỷ niệm; kiểm soát quyền xem và xóa | `src/AlbumPage.tsx:13` hiển thị bìa quest và tiến độ. Ảnh cũ chỉ được đếm và cho xóa, không hiển thị tại thư viện. `src/DueMemory.tsx:3` chỉ xem trước và tải ảnh về máy, không lưu vào tài khoản. Luồng ảnh nhiệm vụ cũ có lưu qua `src/PhotoMission.tsx`, nhưng không tương đương album ảnh tự chọn xuyên suốt trải nghiệm hiện tại. | Có mã lưu ảnh nhiệm vụ, nhưng album kỷ niệm mô tả trong báo cáo chưa đầy đủ trên giao diện hiện tại. Không nên kết luận toàn bộ hệ thống chưa từng hỗ trợ ảnh. |
| Đo lường phiên chơi và nguồn truy cập | IV.4, IV.5/Bảng 16, Bảng 18, IV.6: 150 phiên hợp lệ, 60 bắt đầu, 42 hoàn thành; phân biệt QR/hướng dẫn viên/mạng xã hội; đo quay lại, thời gian và lý do bỏ dở | `server/quest-runs.mjs:24` lưu trạng thái và thời điểm bắt đầu/hoàn thành theo tài khoản. Chưa tìm thấy cơ chế đo phiên truy cập, gán nguồn chiến dịch, loại truy cập nội bộ/bot, ghi lượt quay lại/lý do bỏ dở hoặc trang/xuất báo cáo KPI trong mã ứng dụng. Thống kê cá nhân ở `src/lib/accountStats.ts` không thay thế thống kê thử nghiệm tổng thể. | Có dữ liệu tiến độ làm nền; chưa đủ công cụ đo kế hoạch marketing. Có thể thực hiện một phần bằng biểu mẫu và bảng theo dõi ngoài web nếu nhóm chọn vận hành thủ công. |
| Tiếp nhận và xử lý phản hồi | IV.7: ghi nhận vấn đề theo quest và mức độ ảnh hưởng, chuyển người phụ trách, xử lý và thông báo kết quả đã xác minh | `src/AccountForms.tsx:27` có gửi yêu cầu với tiêu đề/nội dung/nhóm yêu cầu. `server/account-features.mjs:49` lưu yêu cầu với trạng thái `received`. Chưa tìm thấy trường quest riêng, mức ưu tiên, phân công, phản hồi từ người xử lý hoặc luồng cập nhật trạng thái giải quyết. Đánh giá sao và bình luận công khai đã có. | Mới hoàn thành bước tiếp nhận. Quy trình hỗ trợ có thể làm thủ công ngoài web, nhưng chưa có hệ thống xử lý đầy đủ trong ứng dụng. |
| Sự kiện trên bản đồ và chỉ đường | I.3.6.c–d: gắn sự kiện với bản đồ và hành động đến nơi tổ chức | `src/lib/mapEntries.ts:8` cần sự kiện gắn với địa điểm trong danh mục để tạo ghim. Ví dụ Christmas Market có địa chỉ Ariyana trong `shared/city-events.json` nhưng chưa có `destinationId` tương ứng. `src/EventDetailsPage.tsx:15` đưa sự kiện không có địa điểm liên kết về bản đồ chung, không đặt đích đến đúng nơi tổ chức. Lịch, chi tiết, lưu và nhắc sự kiện có triển khai riêng. | Tích hợp bản đồ mới đầy đủ với một phần sự kiện. Không phải mọi sự kiện trong danh sách đều có ghim/chỉ đường riêng. Không nên tự gán tọa độ chưa xác minh. |
| Thời điểm xin quyền vị trí | I.3.6.c/e, IV.2.2 và IV.3/Bảng 13: xin quyền theo thao tác cần dùng và đúng lúc | `src/QuestDetailsPage.tsx:32` và `src/GoldenHourBanner.tsx:11` gọi `usePlayerLocation()` ngay khi trang thành phần được mở. `src/lib/usePlayerLocation.ts:56` bắt đầu theo dõi GPS trong effect, không chờ bấm Chỉ đường hoặc Nhận thưởng. Trình duyệt quyết định có hiện hộp quyền hay không tùy quyền đã cấp. | Hành vi hiện tại chưa hoàn toàn khớp mô tả “xin quyền theo thao tác”. Đây là chênh lệch hành vi, không phải thiếu GPS. |

## Các mục chưa có nhưng báo cáo đã ghi là định hướng tương lai

Không nên liệt kê các mục sau như lỗi thiếu của bản demo hiện tại:

- Ứng dụng độc lập phát hành trên App Store/Google Play. PWA/cài từ trình duyệt không tương đương phát hành trên hai kho ứng dụng.
- Thanh toán thật, bán quest/pass, xác nhận giao dịch, hoàn/hủy và đối soát. Mức 30.000/50.000 đồng trong báo cáo là giả định thử nghiệm, không phải giá phải được đưa ngay lên web.
- Voucher/ưu đãi đổi dịch vụ thật và hoa hồng liên kết với đối tác. Vật phẩm/Green Coin demo không chứng minh đã có hợp tác thương mại.
- AI gợi ý sở thích, lịch trình cá nhân hóa, tối ưu tuyến nhiều địa điểm và xác minh ảnh/địa danh bằng AI.
- Công cụ cho nhà sáng tạo tự tạo/xuất bản quest và cổng quản trị dành cho đối tác.
- Phòng chơi nhiều người đồng bộ, thi đấu và quản lý đoàn tự động. Nhóm bạn bè/bảng điểm không đồng nghĩa đồng bộ gameplay.
- Thông báo Web Push khi đã đóng hoàn toàn trình duyệt. Báo cáo đã nêu giới hạn cần web/PWA còn hoạt động.

Riêng huy hiệu và bảng xếp hạng được báo cáo xếp là hướng bổ sung, trong khi mã web hiện tại đã có các mục này. Do đó đây là phần báo cáo có thể cập nhật theo hiện trạng, không phải chức năng web thiếu.

## Công việc vận hành không thể kết luận từ mã web

Báo cáo còn yêu cầu khảo sát thực địa, quyền triển khai tại điểm đến, nguồn/người chịu trách nhiệm/ngày kiểm tra nội dung, hai buổi thử với người ngoài nhóm, phiếu khảo sát và phỏng vấn mức sẵn lòng chi trả. Không thấy các công cụ này tích hợp đầy đủ trong web không có nghĩa nhóm chưa thực hiện ngoài ứng dụng. Cần kiểm tra phiếu khảo sát, bảng theo dõi và thỏa thuận thực tế trước khi kết luận.

Tương tự, đường dẫn quest có thể được mã hóa thành QR bằng công cụ ngoài. Không có bộ tạo QR trong mã web không phải bằng chứng rằng nhóm chưa có QR. Phần chưa tìm thấy trong ứng dụng là theo dõi nguồn và đo kết quả theo QR/kênh giới thiệu.

## Thứ tự xử lý phù hợp với phạm vi demo

1. Làm rõ và khôi phục đầy đủ trải nghiệm album ảnh cá nhân, hoặc sửa mô tả báo cáo nếu sản phẩm chủ đích chỉ là thư viện bìa quest.
2. Chốt cách đo phiên và KPI trước khi tổ chức thử nghiệm: tích hợp trong web hay dùng công cụ/bảng theo dõi ngoài; tránh tuyên bố dữ liệu chưa thu thập.
3. Hoàn thiện điểm đến đã xác minh cho sự kiện và thống nhất thời điểm xin quyền GPS.
4. Xác định người trực hỗ trợ, cách gắn phản hồi với quest và cách phản hồi kết quả; có thể vận hành thủ công trước khi cần cổng quản trị.

Lượt rà soát này không sửa mã website và không chỉnh sửa file Word gốc.
