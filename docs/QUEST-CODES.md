# Cấp mã quest Dana Quest

Mã hiện dùng để gắn một quest có sẵn vào tài khoản. Đây không phải cổng thanh toán và không liên kết mã từ Tripadvisor, Viator hay nền tảng bên ngoài. Việc kích hoạt không tự hoàn thành nhiệm vụ, cộng xu hoặc bắt đầu gameplay.

## Công cụ dành cho chủ dự án

Mở terminal tại thư mục Dana-Quest-nhanh-dung, chạy:

```powershell
npm.cmd run codes:create -- due-dau-an-50-nam 30
```

Lệnh trả về mã mới, quest và thời điểm hết hạn. `30` là số ngày hiệu lực, cho phép từ 1 đến 365. Có thể thay quest bằng ID địa điểm hiện có, ví dụ `cau-rong`. Chạy không có tham số để xem các ID được hỗ trợ.

Chỉ người có quyền chạy lệnh và ghi file dữ liệu trên máy chủ mới có thể cấp mã. Không có endpoint HTTP công khai để cấp mã. Mã đầy đủ chỉ được in một lần ra terminal; gửi mã đó cho người nhận. Dữ liệu trên đĩa chỉ giữ bản băm của mã.

## Cách người chơi dùng mã

1. Màn chào: chọn liên kết **Bạn đã có mã quest hoặc lời mời?**; hoặc mở khối vàng trong bảng đăng nhập.
2. Chọn **Tôi có mã Dana Quest**.
3. Đăng nhập/tạo tài khoản nếu chưa có phiên. Tài khoản mới tùy chỉnh nhân vật rồi quay lại trang nhập mã.
4. Nhập mã và chọn **Kích hoạt quest**.
5. Quest xuất hiện trong **Quest**, với trạng thái **Đã kích hoạt**. Người chơi có thể tiếp tục các bước giới thiệu để đến Khám phá.

Một mã thuộc một tài khoản sau khi dùng. Gửi lại cùng mã từ cùng tài khoản trả về kết quả cũ; tài khoản khác bị từ chối. Mã chưa dùng nhưng hết hạn bị từ chối. Sau khi đã dùng, entitlement không tự mất khi ngày hết hạn của mã đi qua.

## Dữ liệu và vận hành

Kho mã là `.data/quest-codes.json`, cùng thư mục với `accounts.json`. Thư mục `.data` đã được Git bỏ qua và không được phục vụ như asset web. Cần sao lưu kho mã cùng tài khoản. Không xóa file này để làm mới giao diện.

Công cụ và API dùng file khóa độc quyền để tránh hai tiến trình cùng nhận một mã. Nếu tiến trình bị tắt đột ngột, file `.lock` có thể còn lại; chỉ xử lý file khóa sau khi xác nhận không có tiến trình cấp/nhận mã nào đang chạy. Bản này phù hợp máy chủ Node và file dữ liệu chung hiện tại; chưa có bảng quản trị web hay hệ thống phân phối nhiều máy chủ.
