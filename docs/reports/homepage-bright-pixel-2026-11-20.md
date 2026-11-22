# Trang chủ pixel sáng — 20/11/2026

Yêu cầu mới nhất: giữ màu tươi sáng, thêm ombre, giảm khoảng trống, viết lại
tiêu đề/câu dẫn hấp dẫn hơn. Phạm vi vẫn chỉ là giao diện trang chủ.

- Nền chuyển sắc xanh trời, xanh ngọc và vàng nhạt; bảng trắng kem, nút vàng.
- Tiny5 dành cho tiêu đề lớn; Nunito Sans dành cho đoạn văn và biểu mẫu.
- Giới thiệu, minh họa và đăng nhập nằm trong cùng một cụm hai cột trên desktop.
- Hướng dẫn và quest chuyển về lưới gọn; giữ đủ nội dung và cả ba quest hiện có.
- Tiêu đề mới: “Đà Nẵng giấu điều gì?”. Câu dẫn và tiêu đề các phần đã cập nhật
  bằng cả tiếng Việt và tiếng Anh; thông tin quest, phần thưởng và FAQ giữ nguyên.
- Giữ lớp motion trang chủ đã được người dùng cho phép chạy mặc định.

Tham khảo: bốn ảnh do người dùng gửi; dùng minh họa Đà Nẵng, logo, font và các
minh họa Illos có sẵn trong dự án. Không thêm gói thư viện hoặc tài nguyên trả phí.
UI UX Pro Max: kết quả `pixel-art` được kiểm chứng là phù hợp; không áp dụng
gợi ý 3D không phù hợp từ tìm kiếm rộng. Taste: split-stage, seed 177270974.
Ombre, khung pixel và bóng dạng bậc theo yêu cầu người dùng được ưu tiên trước
các quy tắc mặc định của taste về nền phẳng và không dùng bóng.

Ý tưởng: nét pixel của bản đồ và Cầu Rồng trong logo trở thành khung dẫn vào
một chuyến khám phá Đà Nẵng. Tương tác thật vẫn là các nút và form hiện có.

Kiểm tra: build thành công; đối chiếu AST xác nhận hooks, handlers, route và
props đăng nhập không đổi. Trong trình duyệt ở 1440 và 727 CSS px: không tràn
ngang, chuyển Việt/Anh đúng, menu đóng sau khi chọn mục, FAQ mở được, đủ ba
liên kết quest. Bộ kiểm tra viewport không xuống được 390 CSS px nên không
khẳng định đã kiểm tra trực tiếp kích thước đó ở lượt này.

ROUND 2

Seen in one second: trò chơi khám phá Đà Nẵng theo phong cách pixel tươi sáng.
Idea: bản đồ pixel trong logo mở ra câu chuyện của thành phố.
Live thing: đăng nhập và các lối vào quest giữ nguyên.
Layout: hero=giới thiệu/minh họa và form; hướng dẫn=lưới ba mục;
quest=ba thẻ; thưởng=hai cột; FAQ=ảnh và câu hỏi; CTA=chữ và nút.
Scores (tự đánh giá): design 7.8 · usability 8.2 · creativity 7.5 · content 8.1.
Top three fixes: nền tối đổi sang ombre sáng theo phản hồi; chữ phụ trên bảng
kem được tăng tương phản; điều hướng đáy được đổi sang chữ đậm màu để dễ đọc.

Các trang trong game, logic, backend và chức năng của mọi nút không thay đổi.
