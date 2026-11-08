# Hướng chuyển giao diện pixel

Giữ chữ nội dung, biểu mẫu và bản đồ dễ đọc; pixel hóa nhân vật, vật phẩm, dấu ghim và các khung trang trí trước. Không dùng pixel font cho cốt truyện dài hoặc điều khoản.

Bảng màu chung dùng nền kem, mực tím đậm, tím cho hành động và vàng cho xu. Các biến --dq-* trong App.css xác định màu ngữ nghĩa, bo góc và thời gian chuyển động. Khi thêm skin pixel, đổi token khung/viền và asset thay vì đổi logic component hoặc API.

Ảnh quà: bảy PNG nền trong suốt trong public/rewards, tạo bằng imagegen. Không có mã voucher hoặc logo đối tác trong ảnh. Giữ bản gốc để xuất sprite đúng lưới sau khi chốt kích thước pixel. Các ảnh hiện tại có chi tiết pixel art nhưng chưa phải sprite sheet hoặc pixel-perfect ở mọi tỉ lệ.

Chuyển động giao diện dùng opacity/transform ngắn; ảnh nền20giây mỗi cảnh. Tôn trọng prefers-reduced-motion. Pixel skin vẫn phải giữ44px vùng chạm, focus bàn phím, tương phản và mobile/laptop đủ chức năng.
