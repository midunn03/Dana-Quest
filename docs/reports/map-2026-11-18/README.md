# Rà soát frontend bản đồ và ảnh — 18/11/2026

Phạm vi được chủ dự án yêu cầu: ảnh thật tại các vị trí thiếu ảnh, rà lỗi frontend, bản đồ và dẫn đường; bộ lọc ở phía trên, kết quả ở thanh bên theo cấu trúc ảnh tham khảo Google Maps. Hệ thống tiếp tục dùng Leaflet/OpenStreetMap, không phải Google Maps API hay ảnh vệ tinh của Google.

## Đã sửa

- Chữ và mật độ riêng cho bản đồ, bộ lọc ngang theo loại địa điểm, danh sách có ảnh/tên địa điểm/tên quest/địa chỉ. Tìm kiếm không dấu, trạng thái rỗng, xóa lọc, lọc theo vùng nhìn thấy và liên kết chỉ đường.
- Danh sách mobile kéo ba mức, hỗ trợ bàn phím, bỏ lớp gợi ý che kết quả. CSS mobile cũ được điều chỉnh để không ép chữ/kích thước của bố cục mới bằng `!important`.
- Dùng lại 15 ảnh thật đã có nguồn trong catalog, đưa vào danh sách, ảnh bìa, trang nhiệm vụ, thumbnail và gallery. Không tải thêm ảnh web chưa xác nhận quyền sử dụng. Giữ tác giả/nguồn tại trang chi tiết.
- Dữ liệu admin không có ảnh vẫn dùng ảnh catalog; ảnh admin tải lỗi thử ảnh catalog rồi mới minh họa. Đọc được `places[]` từ Django hiện tại và `content` cũ. Không nhận URL ảnh nguy hiểm hoặc tên khóa object đặc biệt.
- Sửa thứ tự gọi React hooks trong NextStepChip/StartHub khi đổi trang hoặc cờ giao diện. Ẩn gợi ý nổi trên màn bản đồ để không che kết quả.
- Xóa tuyến/tiến độ chỉ đường cũ khi đổi đích; hủy yêu cầu cũ, tính tuyến mới ngay. GPS hết hạn không được dùng cho chỉ dẫn. Thu gọn chữ và đặt bảng dẫn đường bên trái trên desktop.
- Lint chỉ kiểm tra mã dự án, bỏ thư mục skill của bên thứ ba khỏi phạm vi kiểm tra.

## Bằng chứng

- Toàn bộ 87 tệp kiểm thử: **323/323 bài qua**. Các bài API chạy trong môi trường cho phép kết nối localhost; lần chạy hạn chế quyền trước đó có EACCES, không coi đó là lỗi sản phẩm.
- Build production thành công. Lint không có lỗi chặn, còn 28 cảnh báo cần rà dần; build vẫn cảnh báo gói chính trên 500 kB. Không khẳng định đã loại bỏ mọi lỗi của toàn hệ thống.
- Trình duyệt: 320/390/768/1280/1440px, VI/EN; không tràn ngang. Bảo tàng 2 kết quả, công viên 2, biển 3; ghim và kết quả lọc thống nhất. Tìm kiếm không có kết quả và xóa lọc hoạt động. Ảnh bảo tàng tải được ở danh sách và chi tiết. Kiểm tra cuối nền bản đồ tải đủ 25/25 ô.
- [Desktop](desktop.png), [Mobile](mobile.png). [Bố cục dẫn đường](navigation-desktop.png) được mở trực tiếp bằng component để kiểm tra giao diện, không phải bằng chứng đã đi bộ/GPS ngoài thực tế.

## Còn thiếu / cần xử lý tiếp

1. Quest DUE chưa có ảnh thật với nguồn/quyền sử dụng được xác nhận; tiếp tục hiển thị minh họa có nhãn.
2. Đã cài môi trường Django riêng tại thư mục tạm và chạy local 127.0.0.1:8000; API địa điểm/sự kiện trả lời được. API trạm xe còn lỗi vì DB hiện tại thiếu bảng `pixels_transitstation`. Chưa chạy migrate, seed hay thay đổi dữ liệu cá nhân; frontend vẫn dự phòng bằng các trạm đã xác minh có sẵn, không tạo trạm giả.
3. Nền OSM từng gặp lỗi kết nối, sau đó tải lại được. Phụ thuộc mạng ngoài; có trạng thái lỗi/thử lại và danh sách vẫn dùng được.
4. Chưa xác nhận dẫn đường ngoài đường phố trên điện thoại thật; kiểm thử GPS/tuyến tự động không thay thế việc đó. Không thay luật nhận thưởng hay điều kiện đến nơi trong đợt này.

## Nguồn ảnh catalog hiện có

| Địa điểm | Tác giả/giấy phép | Nguồn |
| --- | --- | --- |
| Cầu Rồng | Somerset999 — Wikimedia Commons (CC BY-SA 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:Dragon_Bridge,_Da_Nang_at_night_-_20230819.jpg) |
| Cầu Sông Hàn | Nobbipunktcom — Wikimedia Commons (CC BY-SA 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:Han_River_Bridge,_Da_Nang,_20241209,_Ansicht01.jpeg) |
| Bảo tàng Đà Nẵng | Linhcandng — Wikimedia Commons (CC BY-SA 3.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:B%E1%BA%A3o_t%C3%A0ng_%C4%90%C3%A0_N%E1%BA%B5ng.jpeg) |
| Bảo tàng Điêu khắc Chăm | Daderot — Wikimedia Commons (CC0) | [Nguồn](https://commons.wikimedia.org/wiki/File:Interior_view_-_Museum_of_Cham_Sculpture_-_Danang,_Vietnam_-_DSC01931.JPG) |
| Công viên APEC | Quang Nguyen Vinh — Pexels (Pexels License) | [Nguồn](https://www.pexels.com/photo/apec-park-in-da-nang-vietnam-14021726/) |
| Cầu Tình Yêu | Supanut Arunoprayote — Wikimedia Commons (CC BY 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:Love_Lock_Bridge_Da_Nang_05.19.jpg) |
| Bãi biển Mỹ Khê | Christophe95 — Wikimedia Commons (CC BY-SA 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:Boats_on_My_Khe_Beach_1.jpg) |
| Công viên Biển Đông | Leanh2001 — Wikimedia Commons (CC BY-SA 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:C%C3%B4ng_vi%C3%AAn_Bi%E1%BB%83n_%C4%90%C3%B4ng_%C4%90%C3%A0_N%E1%BA%B5ng.jpg) |
| Bãi biển Mân Thái – chèo SUP | Alexkom000 — Wikimedia Commons (CC BY 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:2024-11-30_Da_Nang,_Tho_Quang_Beach.jpg) |
| Chùa Linh Ứng – Bãi Bụt, Sơn Trà | Alexkom000 — Wikimedia Commons (CC BY 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:2024-12-07_Linh_Ung_Pagoda_2.jpg) |
| Đỉnh Bàn Cờ | Christophe95 — Wikimedia Commons (CC BY-SA 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:Da_Nang_Bay_seen_from_the_Son_Tra_Mountain.jpg) |
| Hải Vân Quan | David McKelvey — Wikimedia Commons (CC BY 2.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:H%E1%BA%A3i_V%C3%A2n_Gate,_H%E1%BA%A3i_V%C3%A2n_Pass,_Vietnam_(6944533488).jpg) |
| Danh thắng Ngũ Hành Sơn | Kuroczynski — Wikimedia Commons (CC BY-SA 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:Da_Nang_Marble_Mountains_2020_IMG_4008.jpg) |
| Bà Nà Hills – khu vực Cầu Vàng | Vivu Vietnam — Wikimedia Commons (CC BY-SA 4.0) | [Nguồn](https://commons.wikimedia.org/wiki/File:Golden_Bridge_above_the_clouds_Ba_Na_Hills_Da_Nang_Vietnam.jpg) |
| Bãi biển Nam Ô | Bánhmỳchảo — Wikimedia Commons (CC0) | [Nguồn](https://commons.wikimedia.org/wiki/File:Bi%E1%BB%83n_Nam_%C3%94.jpg) |

Nhánh làm việc: `fix/map-results-and-place-photos`; chưa commit/push. Không thay đổi cơ sở dữ liệu, ảnh riêng, mã địa điểm hoặc tiến độ người dùng.
