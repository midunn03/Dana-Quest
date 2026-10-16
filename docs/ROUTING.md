# Chỉ đường đi bộ

Màn hình `#/chi-duong/:id` theo dõi GPS bằng `watchPosition`. Nhân vật luôn dùng tọa độ thiết bị; tuyến đường và khoảng cách còn lại dùng dữ liệu đường phố từ Valhalla/OpenStreetMap.

API cùng origin: `GET /api/navigation/route?lat=16.049&lng=108.239&id=cau-rong`. Vite dev, preview và `npm.cmd run api` đều phục vụ endpoint này. Backend gửi tọa độ xuất phát và tọa độ điểm đến cho dịch vụ định tuyến; không lưu tọa độ vào tài khoản hay tiến độ. Không cần API key.

Mặc định dùng `https://valhalla1.openstreetmap.de/`, dịch vụ demo công khai của FOSSGIS. Có thể đặt `VALHALLA_URL` thành URL gốc của máy chủ Valhalla riêng (kết thúc bằng `/`). Khi triển khai cho nhiều người dùng, dùng máy chủ riêng hoặc nhà cung cấp phù hợp; demo có giới hạn fair-use. [Dịch vụ demo](https://github.com/valhalla/valhalla#demo-server).

Cấu hình `pedestrian`, `shortest: true`, `disable_hierarchy_pruning: true`, `exclude_ferries: true` để tối ưu quãng đường đi bộ trên dữ liệu bản đồ, không dùng tuyến ô tô hay đường thẳng. Tính tối ưu phụ thuộc dữ liệu đường, quyền đi bộ, khả năng kết nối của điểm đến và giới hạn tìm kiếm của dịch vụ. [Tài liệu định tuyến](https://valhalla.github.io/valhalla/api/route/api-reference/).

Chỉ dẫn hiển thị đi thẳng, rẽ trái/phải, quay đầu, vòng xuyến và khoảng cách còn lại dọc theo tuyến. Khi GPS di chuyển, hệ thống chiếu vị trí lên tuyến để đếm số mét tới chỗ rẽ tiếp theo, bỏ phần đường đã đi và tự chuyển chỉ dẫn sau chỗ rẽ. Lấy nhanh vị trí mạng/bộ nhớ trình duyệt còn mới (tối đa 30 giây, timeout 5 giây) song song với GPS độ chính xác cao. Tính tuyến ngay khi sai số không quá 150 m; trên 50 m hiển thị sai số và không báo rẽ ngay như một vị trí chính xác. Vị trí lệch hơn 150 m vẫn hiện trên bản đồ cùng sai số, nhưng chưa dùng để dẫn đường. GPS tốt hơn tiếp tục cập nhật trong nền; khi cải thiện xuống 50 m thì tính lại tuyến từ vị trí tốt hơn. Chưa có kết quả: báo sau 6,5 giây và thử lại mỗi 10 giây, có nút thử lấy vị trí khi gặp lỗi quyền/thiết bị. Vị trí quá 60 giây bị loại bỏ. Nhân vật không bị kéo sang tọa độ đường để giả vờ GPS chính xác.

Khi lệch tuyến quá `max(35 m, 1.5 × sai số GPS)`, ẩn chỉ dẫn cũ và tính lại tuyến. Yêu cầu định tuyến cách nhau ít nhất 15 giây; GPS và khoảng cách vẫn cập nhật giữa các yêu cầu. Yêu cầu bị hủy khi rời trang. Khi dịch vụ lỗi hoặc không có tuyến, báo trạng thái và tự thử lại; không vẽ đường thẳng thay thế.

Kiểm tra: `npm.cmd run test -- tests/routing.test.ts tests/walking-route.test.tsx tests/navigation.test.tsx tests/player-location.test.tsx`.

