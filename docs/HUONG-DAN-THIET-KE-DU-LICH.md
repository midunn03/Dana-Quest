# Hướng dẫn chỉnh Dana Quest theo góp ý

## Hiểu đúng các góp ý trong hai ảnh

Đây là kinh nghiệm và đề xuất của người góp ý, không phải tiêu chuẩn bắt buộc hay yêu cầu đổi toàn bộ công nghệ. Với Dana Quest, chọn hướng minh họa 2D mềm kết hợp ảnh địa điểm thật là một phương án phù hợp để thử. Nhận xét về ChatGPT, Claude, Qwen/GLM là trải nghiệm cá nhân, không phải kết quả so sánh hay yêu cầu phải mua thêm công cụ.

## Những phần đã sửa trong bản này

- Thay lớp giao diện pixel bằng TravelVisual.css: màu biển, giấy sáng, chữ hệ thống dễ đọc, nút bo tròn và vùng chạm lớn hơn ở màn khám phá.
- Vẽ lại logo, cảnh mở đầu lấy cảm hứng từ sông Hàn–Cầu Rồng, ba nhà khám phá và người bạn mèo bằng SVG mềm. Đây là minh họa cách điệu, không phải hình tái hiện chính xác địa danh.
- Giữ ID nhân vật để lựa chọn đã lưu vẫn tương thích. Tên tệp PixelAvatar/PixelLogo/PixelScene còn giữ vì được dùng ở nhiều màn; hình hiển thị đã đổi.
- Giữ các ảnh địa điểm thật và luồng đăng nhập, bản đồ, nhiệm vụ, album, xu demo hiện có. Việc đổi hình không bổ sung AI xác minh ảnh.

## Bạn nên thực hiện thế nào

1. Viết cảm xúc muốn người chơi nhận được: “Một chuyến khám phá Đà Nẵng nhẹ nhàng, gần gũi, có niềm vui khi tìm ra điều mới.” Dùng câu này để quyết định màu, chữ, ảnh và nhịp thưởng.
2. Tạo một bảng tham khảo nhỏ: 3 ảnh Đà Nẵng bạn có quyền sử dụng, 2 giao diện du lịch dễ đọc, 2 kiểu nhân vật minh họa. Ghi rõ thích điểm nào ở mỗi mẫu; không sao chép nguyên thiết kế.
3. Giữ phong cách thống nhất: ảnh thật cho thông tin điểm đến; minh họa cho chào mừng, nhân vật và phần thưởng; màu xanh biển, xanh cây và cát ấm. Tránh thêm hiệu ứng pixel mới. Chưa cần đầu tư 3D trong vòng sửa này.
4. Chơi thử một số trò khám phá mà bạn có sẵn. Ghi lại: bắt đầu có dễ hiểu không, nhiệm vụ có rõ không, phần thưởng có tạo động lực không. Áp dụng vào một luồng nhỏ của Dana Quest trước.
5. Giao việc cho AI theo từng màn với tiêu chí cụ thể. Ví dụ: “Sửa màn nhiệm vụ theo phong cách nhật ký du lịch. Hiển thị mục tiêu, số nhiệm vụ hoàn thành và phần thưởng rõ ràng; nút dùng được trên màn 390 px. Giữ quy tắc cộng xu, kiểm tra luồng và báo phần chưa xác minh.”
6. Sau mỗi vòng, chơi thử thực tế và ghi lỗi trước khi thêm tính năng. Bạn quyết định trải nghiệm và nội dung; AI hỗ trợ code, hình và kiểm tra nhưng kết quả vẫn cần đối chiếu trên thiết bị.

## Chạy dự án

Mở terminal trong thư mục DANAQUEST-WEB:

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Mở http://127.0.0.1:5173/. Nếu cổng đang có dự án khác, dừng phiên đó hoặc chọn cổng khác. Dữ liệu trình duyệt gắn với địa chỉ và cổng; thay cổng có thể khiến tiến độ cũ không hiện ở vùng lưu mới.

## Checklist chơi thử

- Màn chào: đọc rõ logo, mô tả, nút khám phá và tạo tài khoản.
- Chọn nhân vật: thử cả bốn nhân vật; tải lại vẫn đúng nhân vật đã chọn.
- Tài khoản → bản đồ → địa điểm → nhiệm vụ → ảnh → album → thưởng demo: đi hết một vòng, kiểm tra không cộng xu lặp.
- Kiểm tra trên màn 390 px và máy tính; không tràn ngang, không che nút bởi thanh điều hướng.
- Camera/GPS: thử cho phép và từ chối; ứng dụng phải giải thích tình trạng rõ ràng. Thử điện thoại qua HTTPS, không dùng 127.0.0.1 trên điện thoại để kết nối máy tính.
- Đổi trang, tải lại, mất kết nối: ghi nhận dữ liệu còn giữ và thông báo lỗi.

## Giới hạn và bước tiếp theo

Đây là vòng sửa định hướng hình ảnh, chưa phải kết luận sản phẩm đã sẵn sàng phát hành. Ưu tiên kiểm tra bố cục trực tiếp trên điện thoại, rà soát các hình phụ như favicon/phần thưởng để đồng bộ phong cách, và đánh giá hiệu năng khi mạng chậm. Ảnh, giờ hoạt động, giá vé và dữ liệu điểm đến phải kiểm tra nguồn riêng khi cập nhật; hai ảnh góp ý không cung cấp thông tin đó.
