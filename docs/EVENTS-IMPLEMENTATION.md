# Sự kiện Đà Nẵng: kế hoạch và đối chiếu triển khai

Phạm vi: React và Node trong Dana-Quest-nhanh-dung. Không sửa Django, không push. Kế thừa kiểu thẻ bo tròn, màu hồng #df2776, viền #e9e4d8, chữ #36352f của trang tài khoản.

- [x] Dữ liệu sự kiện dùng chung client/server; lịch theo Asia/Ho_Chi_Minh, phân biệt giờ chính xác và lịch cả ngày/dự kiến.
- [x] Test quy tắc trước khi triển khai: ba giờ, để sau một giờ, ngừng lời mời trước 30 phút, nhắc người đã lưu một lần.
- [x] Lưu từng lần tổ chức theo tài khoản; máy chủ tuần tự hóa claim để chống nhiều tab/thiết bị cùng báo. Không tải ảnh hồ sơ khi polling sự kiện.
- [x] Danh sách/lọc/tìm kiếm/đã lưu, chi tiết, nguồn, chia sẻ, chỉ đường.
- [x] Thông báo toàn trang hoãn khi chơi quest; không hỏi quyền trình duyệt cho thông báo trong trang.
- [x] Demo riêng Cầu Rồng 09:30 với đồng hồ giả lập, không tác động dữ liệu thật.
- [x] Kiểm thử toàn bộ và Chrome nhiều kích thước; rà ảnh chụp và sửa lỗi thực tế.

Quyết định: lựa chọn chỉ áp dụng cho một lần tổ chức. Bỏ lưu chủ động sẽ tắt lời mời lần đó. Mỗi lần sau bắt đầu trạng thái mới. Tắt thông báo trong ứng dụng chặn cả lời mời/lời nhắc sự kiện. Quyền thông báo thiết bị có sẵn vẫn được giữ và dùng cùng bộ lịch, không còn bộ hẹn giờ độc lập gây báo trùng. Khi website đóng hoàn toàn chưa có Web Push nền.

Dữ liệu cũ ba sự kiện được giữ. Cầu Rồng lịch thật 21:00 thứ Sáu/Bảy/Chủ nhật theo Danang Fantasticity; ngày lễ phải được bổ sung lịch riêng. Thời lượng xem khoảng 20 phút phục vụ tra cứu, không là cam kết giờ kết thúc. Hai sự kiện nhiều ngày chưa có giờ chương trình không bị nhắc lúc 00:00. Ảnh không phải ảnh sự kiện được ghi là minh họa.

Thay đổi/hủy lịch: key bao gồm giờ bắt đầu, trạng thái cancelled không được hiển thị/claim. Hiện catalog được quản lý trong repo, chưa có nguồn cập nhật tự động hoặc công cụ quản trị lịch; không hứa tự phát hiện thay đổi từ đơn vị tổ chức.


Kết quả xác minh: 173/173 test (45 tệp) với maxWorkers=2; build thành công, lint không lỗi (một cảnh báo Fast Refresh có sẵn tại AuthContext). Chrome kiểm tra 320x568, 390x844, 844x390, 1440x900: lưu/bỏ lưu và tải lại, tìm kiếm, chi tiết/chỉ đường, demo/hoãn quest; 16 lần kiểm tra bố cục không tràn ngang. Luồng thông báo toàn website dùng API thật với đồng hồ thử riêng đã kiểm tra hoãn quest, để sau một giờ, chống lặp khi tải lại, lưu tham gia và nhắc một lần trước 30 phút, vị trí desktop/mobile. Không dùng tài khoản thật để kiểm thử. Không sửa Django, không push.

Giới hạn: nguồn lịch quản lý thủ công, không tự lấy sự kiện mới hay thông báo đổi lịch từ website bên ngoài; chưa có Web Push khi đóng website hoàn toàn. Kiểm tra thời gian mỗi 30 giây và khi quay lại tab nên có sai số khoảng 30 giây khi tab đang hoạt động. Máy chủ Node một tiến trình tuần tự hóa claim; khi triển khai nhiều tiến trình cần chuyển claim sang kho dữ liệu dùng chung có transaction.
