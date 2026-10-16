# Đối chiếu giao diện DANA QUEST

Giao diện được xây tiếp trong dự án hiện tại bằng React, CSS và SVG tự vẽ. Không dùng ảnh mockup làm nền hoặc làm giao diện. Không thay khóa dữ liệu hoặc xóa tiến độ cũ.

## Các màn hình đã triển khai

| Màn hình | Đường dẫn sau địa chỉ website |
| --- | --- |
| 1. Chào mừng | `#/` |
| 2. Chọn nhân vật | `#/nhan-vat` |
| 3. Bản đồ thành phố | `#/kham-pha` |
| 4. Chi tiết điểm đến | `#/dia-diem/cau-rong` |
| 5. Điều hướng minh họa | `#/chi-duong/cau-rong` |
| 6. Đến nơi / nhiệm vụ | `#/nhiem-vu/cau-rong` |
| 7. Camera | Mở từ nhiệm vụ ảnh đã được giao |
| 8. Ăn mừng | Mở từ nhiệm vụ đã hoàn thành; `#/hoan-thanh/demo` chỉ xem minh họa |
| 9. Kỷ niệm | `#/album` |
| 10. Đổi thưởng | `#/cua-hang` |

Màn đến nơi chỉ xác nhận sau kiểm tra vị trí hợp lệ. Màn camera vẫn có webcam thật, tải ảnh, xem trước và lưu cục bộ. Mở màn ăn mừng không tự cộng xu.

## Đã kiểm tra và điều chỉnh

- Lượt A: build/lint đạt; đã xem ảnh chụp welcome, avatar và bản đồ. Điều chỉnh logo pixel, khung desktop và dấu ghim Cầu Rồng nổi bật. Ảnh nằm trong `tests/visual/A-*.png`.
- Lượt B: build/lint đạt; đã xem chi tiết, điều hướng, nhiệm vụ và camera. Thu gọn phần thông tin, giảm chiều cao ảnh chi tiết, sửa hình camera để phủ kín khung. Ảnh nằm trong `tests/visual/B-*.png`; một số ảnh phản ánh giao diện trước điều chỉnh cuối.
- Lượt C: đã triển khai ăn mừng, lưới album và thẻ đổi thưởng; build/lint đạt. Đã xem màn ăn mừng trong phiên trình duyệt trước. Phiên trình duyệt sau đó không còn khả dụng (`Browser is not available: iab`), nên chưa hoàn tất ảnh đối chiếu cuối cho album/đổi thưởng hoặc kiểm tra lại toàn bộ trên kích thước điện thoại.
- Kiểm thử tự động bao gồm luồng trang chủ → bản đồ → chi tiết → điều hướng → nhiệm vụ, lưu tiến độ, ngưỡng 80%, ảnh, xu/voucher và lỗi tải nền bản đồ. Kiểm thử dùng môi trường mô phỏng, không thay thế việc thử webcam/GPS thật.

## Chi tiết còn gần đúng

- Cảnh Đà Nẵng, rồng, nhân vật và icon là SVG nguyên bản đơn giản hóa; chưa đạt độ chi tiết của tranh trong ảnh tham chiếu nhỏ. Không khẳng định khớp từng pixel.
- Giữ Leaflet/OpenStreetMap thật. Trong phiên kiểm tra, máy chủ tile có lúc không kết nối được: ứng dụng hiện lỗi và danh sách điểm đến thay thế. Chưa xác nhận nền tile tải ổn định trong môi trường này.
- Đường nét đứt ở màn điều hướng là demo, không tính lộ trình hay dẫn đường từng bước.
- Ảnh mẫu trong album được ghi là minh họa; ảnh người dùng và tiến độ vẫn lưu cục bộ. Voucher và Green Coins là demo. Nhiệm vụ thật nhận 10 xu theo quy tắc cũ; màn minh họa 50 xu không cộng vào số dư.
- Xác minh ảnh bằng AI chưa triển khai. Không thêm backend, đăng nhập hoặc dịch vụ trả phí.
