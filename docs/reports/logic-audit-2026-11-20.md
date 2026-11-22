# Rà soát và sửa lỗi logic Dana Quest — 20/11/2026

## Phạm vi

Rà soát mã của ứng dụng React, dịch vụ Node đang chạy qua Vite, các tuyến API Django và các bộ kiểm tra hiện có. Chỉ sửa lỗi trong chức năng hiện có; không thay bố cục, thêm kiểu chơi, bỏ tính năng hoặc thay cơ chế nhiệm vụ/xu bằng cơ chế khác. Những thay đổi có sẵn trong thư mục làm việc trước lượt rà soát được giữ lại.

## Các lỗi đã xác nhận và sửa

| Khu vực | Lỗi | Sửa |
| --- | --- | --- |
| Giờ vàng | Thiếu tọa độ vẫn có thể nhận xu vì khoảng cách thành NaN và vượt qua điều kiện so sánh | Kiểm tra tọa độ hữu hạn, đúng phạm vi và sai số GPS dương |
| Trạm di chuyển xanh | Sai số GPS âm hoặc tọa độ ngoài phạm vi không được loại bỏ đầy đủ | Kiểm tra dữ liệu đầu vào trước khi tính thưởng |
| Ghi hành trình | Điểm GPS thiếu giờ, trùng giờ, đảo ngược giờ hoặc NaN vẫn được cộng quãng đường | Bỏ điểm không hợp lệ và không tính đoạn có thời gian không tăng |
| Thưởng hành trình | Gửi lại hành trình, mở lại trang hoặc gửi đồng thời có thể cộng xu nhiều lần | Lưu mốc thời gian GPS đã xử lý theo tài khoản và chỉ tính đoạn mới, giữ điểm nối giữa hai lần gửi |
| Lưu hành trình dài | Máy chủ chỉ nhận 8 KB trong khi giao diện lưu tới 1.000 điểm GPS | Điều chỉnh giới hạn riêng của yêu cầu ghi hành trình; giữ giới hạn của các yêu cầu khác |
| Riêng tư hành trình | Bật ẩn đầu/cuối nhưng chuyến đi ngắn vẫn lộ toàn bộ tuyến | Trả về tuyến trống khi toàn bộ chuyến đi nằm trong vùng cần ẩn |
| Lưu tiến độ | Dữ liệu sai dạng có thể được nhận là hợp lệ hoặc gây TypeError trước khi nhận diện hỏng | Kiểm tra đúng cấu trúc và báo lỗi dữ liệu hỏng để luồng khôi phục hiện có xử lý |
| Đổi tài khoản | Chuỗi ngày, GPS đã lưu và trạng thái nhận thưởng trạm dùng chung bộ nhớ | Tách khóa lưu theo tài khoản; không tự nhận dữ liệu cũ không rõ chủ sở hữu vào tài khoản mới |
| Đổi tài khoản khi đang tải | Phản hồi của tài khoản cũ có thể cập nhật bộ nhớ hoặc thông báo của tài khoản mới | Kiểm tra chủ sở hữu trước khi nhận phản hồi và phát thông báo |
| Đổi voucher | Đổi tab rồi quay lại lúc đang lưu có thể làm yêu cầu đổi thưởng báo thất bại dù máy chủ đã trừ xu | Không để lần làm mới chen ngang lần đổi thưởng của cùng tài khoản |
| Đổi tài khoản khi đổi voucher | Yêu cầu cũ đang chờ có thể chặn tải ví của tài khoản mới | Gắn khóa đang lưu với tài khoản; vẫn cho phép tải ví chủ sở hữu mới |
| Thưởng theo ngày | Trình duyệt có thể truyền ngày tùy ý cho chuỗi ngày hoặc thưởng trạm | Dùng thời gian máy chủ tại ranh giới API; giữ lịch ngày Việt Nam |
| Chuỗi ngày | Hoàn thành checkpoint không được ghi nhận vì kiểm tra sai tên hành động | Nhận đúng hành động `complete-checkpoint` |
| Huy hiệu | Chỉ nhận nhiệm vụ, chưa hoàn thành hoạt động nào cũng được tính đã ghé | Không cấp huy hiệu từ danh sách nhiệm vụ trống hoạt động hoàn thành |
| Huy hiệu | Mã địa điểm Mỹ Khê và Linh Ứng trong danh mục hiện tại không khớp mã huy hiệu | Bổ sung các mã tương ứng, giữ tương thích mã cũ |
| Đánh giá quest | Chuyển quest khi mạng chậm có thể hiện đánh giá của quest trước | Chỉ nhận phản hồi của yêu cầu và quest còn hiện hành |
| Điều hướng | Phản hồi tuyến đường chứa điểm null hoặc thiếu kiểu chỉ dẫn có thể làm vỡ màn hình | Từ chối tuyến sai cấu trúc trước khi dùng để chỉ đường |
| Nhóm bạn bè | Trang nhóm gọi dịch vụ Django trong khi đăng nhập đang dùng Node; chức năng không dùng được cùng phiên | Nối các thao tác nhóm hiện có với dịch vụ tài khoản đang chọn; hỗ trợ các tuyến tương ứng ở cả hai dịch vụ |
| Nhóm bạn bè | Lỗi tải nhóm bị biến thành danh sách rỗng; lỗi rời nhóm bị bỏ qua | Hiển thị thông báo lỗi và giữ trạng thái khi thao tác thất bại |

## Chứng cứ kiểm tra

- Thêm các ca kiểm tra tái hiện lỗi trước khi sửa, sau đó chạy lại các ca bị ảnh hưởng.
- Kiểm tra chức năng nhóm bằng tài khoản tạm: tạo, tham gia, chống tham gia lặp, xem trong phạm vi thành viên, chặn chủ sở hữu sai, rời nhóm và xử lý nhóm hết thành viên.
- Bộ kiểm tra Python dùng cơ sở dữ liệu tạm; 53/53 ca đạt.
- Lượt kiểm tra cuối của web: 94/94 tệp kiểm tra, 342/342 ca đạt. Build thành công. Lint kết thúc với mã 0, không có lỗi chặn, còn 30 cảnh báo.
- Kiểm tra trình duyệt thực: trang chủ, Khám phá, chi tiết DUE và Sự kiện mở được trên `http://localhost:5173/`; không ghi nhận lỗi JavaScript trong các bước đã kiểm tra.
- Kết quả kiểm tra web toàn bộ và build được ghi trong `audit-final-tests.log` và `audit-final-build.log` tại thư mục dự án.

## Giới hạn

Không thể suy ra “không còn bất kỳ lỗi nào” từ một lượt rà soát. Chưa thử GPS/camera thật trên điện thoại, thông báo hệ điều hành khi đóng ứng dụng, hoặc tải nhiều người dùng trên nhiều tiến trình ghi cùng dữ liệu. Dữ liệu kiểm tra là dữ liệu tạm; không xóa hay đặt lại tiến độ, ảnh hoặc tài khoản thật.

Build vẫn có cảnh báo kích thước gói và lint còn cảnh báo React. Chúng không được giải quyết bằng thay đổi giao diện hoặc tái cấu trúc ngoài phạm vi sửa lỗi này.
