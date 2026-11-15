# Trình bày thông báo sự kiện theo thời gian thật

Công cụ này nằm ngoài giao diện người chơi. Nó tạo một cuộc hẹn riêng cho một tài khoản có sẵn, với giờ bắt đầu tương đối so với **giờ thật trên máy chủ**. Không thay đổi đồng hồ, không reset lịch sử lựa chọn hoặc bỏ qua các điều kiện thông báo.

## Chuẩn bị

Dừng rồi chạy lại **chính máy chủ đang dùng** với biến môi trường sau trong PowerShell. Không mở thêm một bản ứng dụng khác hoặc dùng chung tệp dữ liệu giữa hai tiến trình:

```powershell
$env:DANA_PRESENTATION_EVENTS = '1'
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Với bản build chạy Node, đặt cùng biến môi trường rồi dùng `npm.cmd start` theo cổng của môi trường đó. Khi không có biến hoặc khác `1`, mọi cuộc hẹn do công cụ tạo đều bị bỏ qua. Sau buổi trình bày, bỏ biến và khởi động lại máy chủ để tắt nguồn dữ liệu riêng này.

Chọn ID của tài khoản trình bày có sẵn trong `.data/accounts.json`; không đưa mật khẩu hoặc toàn bộ tệp tài khoản lên màn hình chia sẻ. CLI kiểm tra tài khoản tồn tại trước khi ghi. Tham số `--accounts` có thể chỉ đến tệp tài khoản của môi trường local riêng; dữ liệu sự kiện được lưu cạnh tệp đó.

## Hiện lời mời tham gia

```powershell
node server/presentation-event.mjs --owner ACCOUNT_ID --scenario invite
```

Cuộc hẹn bắt đầu sau 90 phút, thuộc cửa sổ mời trước 3 giờ. Đăng nhập đúng tài khoản, bật thông báo trong ứng dụng, ra khỏi quest đang chơi (tạm dừng trước), mở Khám phá hoặc Sự kiện và để tab hiển thị. Danh mục được làm mới khi cửa sổ được focus hoặc tối đa khoảng 30 giây. Không cần chỉnh giờ hệ thống.

## Hiện lời nhắc cho kế hoạch đã lưu

```powershell
node server/presentation-event.mjs --owner ACCOUNT_ID --scenario reminder
```

Cuộc hẹn bắt đầu sau 20 phút. Mở Sự kiện, tìm cuộc hẹn **Cuộc hẹn bên dòng sông Hàn** và chọn **Chắc chắn sẽ tham gia**. Sau khi máy chủ lưu lựa chọn, cơ chế bình thường có thể gửi lời nhắc thuộc cửa sổ trước 30 phút. Công cụ không tự đánh dấu tham gia thay người chơi.

## Điều kiện được giữ nguyên

- Chỉ tài khoản chỉ định nhìn thấy và thao tác được cuộc hẹn riêng. Tài khoản khác và khách không nhận nó.
- Không hiển thị khi đang chơi/chỉ đường quest, chọn nhân vật, đăng nhập, tab ẩn hoặc đã tắt thông báo. Máy chủ cũng không cấp lượt nhắc nếu tài khoản có quest chưa hoàn thành đang không tạm dừng.
- Khoảng cách giữa hai thông báo là ít nhất 5 phút; gọi CLI liên tục không vượt qua giới hạn này. Chuẩn bị kịch bản trước khi trình bày hoặc chờ hết khoảng cách.
- Lời mời cần cửa sổ trước 3 giờ và ngoài 30 phút cuối. Lời nhắc cuối cần người chơi đã chọn tham gia; mỗi lần diễn ra chỉ nhắc một lần.
- Mỗi lần gọi tạo ID lần diễn ra mới, không xóa quyết định cũ. Chỉ thay cuộc hẹn riêng hiện tại của tài khoản đó, không sửa sự kiện công cộng.
- Cuộc hẹn riêng hết hạn sau 3 giờ và không có API công cộng để tạo hoặc thay đổi nó. Tệp hỏng hoặc cấu hình tắt sẽ không nạp thêm sự kiện.

Danh sách Sự kiện, trang chi tiết và bản đồ dùng cùng danh mục trả bởi máy chủ. Luồng dữ liệu Django trên bản đồ chỉ dùng để hiển thị các mục `django:<id>:<start>`, không phát nhắc độc lập và không ghép với sự kiện chuẩn bằng tên.

Để biểu diễn bất kỳ thời điểm nào, người trình bày chủ động tạo một cuộc hẹn mới có giờ bắt đầu phù hợp; người xem vẫn quan sát đầy đủ điều kiện thật. Cách này không cam kết bỏ qua 5 phút chờ, trạng thái quest hoặc lựa chọn riêng tư.
