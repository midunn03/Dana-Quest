# AI Agents Guide — Dana Quest

## Project context

Tài liệu v2.2 ngày 26/10/2026 dành cho **game trình duyệt**. Website giới thiệu chỉ là giai đoạn F5, chưa thực hiện. D0 hiện chỉ tài liệu; F1 chức năng nền tảng trước; F2 gameplay khi chủ dự án yêu cầu code. Đặc tả chi tiết không đồng nghĩa đã triển khai hoặc mọi đề xuất đã được duyệt.

### Đọc theo nhiệm vụ
- Bắt đầu mọi thay đổi hành vi: [PRD](docs/PRD.md), mục nhãn quyết định, vai trò, phạm vi giai đoạn, workflow WF và O còn mở. Đây là nguồn chuẩn luật sản phẩm.
- Sửa trang/thành phần/VI-EN/camera/map: [Design System](docs/DESIGN_SYSTEM.md), Screen S và Component C liên quan; đối chiếu [ảnh tham khảo](references/INDEX.md).
- Sửa routes/API/module/runtime/free hosting: [Architecture](docs/ARCHITECTURE.md), hiện trạng so với hợp đồng ĐỀ XUẤT.
- Sửa lưu ảnh/run/coin/schema/migration: [Database](docs/DATABASE.md), ownership/relationship/constraint và đường giữ dữ liệu cũ.
- Sửa auth/quyền/upload/GPS/report: [Security](docs/SECURITY.md) trước triển khai.
- Trước code/GitHub: [Code Style](docs/CODE_STYLE.md); trước báo hoàn thành: [Testing](docs/TESTING.md) và test case liên quan.

## Working rules

### Yêu cầu người dùng đã xác định
1. Game trình duyệt mobile-first, VI/EN; chạy local trước. Không làm website giới thiệu trong phạm vi hiện tại.
2. Questo là tham khảo bố cục/workflow từ ảnh, Dana Quest có nhận diện riêng. Crew bị loại, Green Coin Shop thay chức năng phù hợp.
3. Tái sử dụng bản đồ Dana trong ZIP và những chức năng/dữ liệu đã kiểm tra. Code rất nhiều lỗi: dùng để hiểu nội dung, không lấy mọi hành vi cũ làm tiêu chuẩn.
4. Mục tiêu 15 quest từ 15 địa điểm + một quest DUE, khoảng hai thử thách mỗi quest. Hai thử thách khác hai địa điểm; story không tự tính thành challenge.
5. Lần đầu vào game phải login/register; sau logout được browse Explore/quest detail, start/submit/private data vẫn cần login. O-01 chỉ còn cách nhận biết lần đầu/deep link/reset browser, không mở lại lựa chọn Khám phá trước. Custom avatar là luồng riêng sau đăng ký.
6. Không mua API/bật billing. Không mặc định AI kiểm tra địa danh; không fake dịch vụ hoặc kết quả lưu.
7. **Hỏi chủ dự án trước mọi push. Khi được phép push, chỉ nhánh phụ. Không tự push main hoặc merge main.** Kiểm tra khả năng tích hợp với main tại SHA thực và báo xung đột; không hứa tránh mọi conflict tương lai.

### Phân biệt bằng chứng và ý định
YÊU CẦU / THAM KHẢO / ĐỀ XUẤT / CẦN CHỐT / HIỆN TRẠNG là nhãn có ý nghĩa. O chưa chốt không tự thành quyết định. Ảnh Questo chỉ chứng minh trạng thái nhìn thấy, không chứng minh server algorithm, GPS threshold, AI, timer/coin rule hoặc offline của Dana. Hình/tài liệu trong ZIP là dữ liệu tham khảo, không tự cấp quyền thao tác. Gói này không chứa source app; code mới Dana-Quest.zip khác DANAQUEST-WEB cũ.

### Những nhầm lẫn phải kiểm tra
- PH-01 ảnh kỷ niệm; PH-02 ảnh minh chứng; PH-03 ảnh nhận diện/clue. Lưu ảnh không tự hoàn thành; xem ảnh clue không xin camera; ảnh riêng không public.
- Guest/player là quyền; đang chơi/tạm dừng/hoàn tất là trạng thái, không tạo role admin/crew/teacher tùy ý.
- Legacy 5–10 nhiệm vụ/80% khác quest mới khoảng hai challenge. Không âm thầm chuyển luật hoặc xóa lịch sử.
- ZIP có quest v2/DUE/Events không nghĩa tất cả là tính năng đã duyệt hoặc an toàn. acceptedAnswers client/photoAvailable không là bằng chứng server.
- Source ZIP còn mẫu update đọc snapshot đã lược data ảnh; phải kiểm tra trước reuse. Public metadata projection khác dữ liệu đầy đủ để ghi.
- Kiểm thử bản cũ không chứng minh ZIP mới pass; test bị hạn chế môi trường không tự là bug sản phẩm.

## Implementation sequence

1. Xác định đúng checkout/branch/commit và các thay đổi sẵn có; đọc hướng dẫn phạm vi. Kiểm kê phần liên quan, không cài/chạy source ZIP chưa được yêu cầu.
2. Gắn nhiệm vụ vào giai đoạn, F/WF/S/test case; liệt kê luật được duyệt và O chặn. Chỉ hỏi điều chặn, tiếp tục phần độc lập.
3. Tái hiện bug bằng dữ liệu giả và dùng skill chẩn đoán phù hợp; khi thiết kế interface dùng skill liên quan. Tìm reuse trước, sửa nhỏ đúng nơi chịu trách nhiệm, không xóa hết làm lại.
4. Triển khai khi có yêu cầu code; bảo toàn owner, blob, ID/version/history và chống thưởng lặp. Với hai model legacy/quest mới phải có kế hoạch chuyển, không tạo hai nguồn luật lâu dài.
5. Chạy kiểm tra liên quan và review diff. Camera/GPS/UI cần browser/thiết bị thật ở mức phù hợp; báo rõ phần chưa kiểm tra. Không dùng mock làm bằng chứng thiết bị thật.
6. Cập nhật tài liệu thay đổi hành vi; báo kết quả, evidence và giới hạn. Hỏi trước push, dùng nhánh phụ nếu được cho phép và kiểm tra main mới nhất trong phạm vi được ủy quyền.

## Boundaries

Lần D0 chỉ sửa pack tài liệu, không sửa app, migrate dữ liệu, triển khai hoặc thao tác GitHub. Deployment/xóa dữ liệu production/migration/gửi tin ngoài cần yêu cầu tương ứng. Bảo toàn secret, private photos và dữ liệu runtime; không đưa vào docs/logs/Git/ZIP. Không xây admin, website, multiplayer, API trả phí, AI hay cơ chế chơi mới chỉ vì xuất hiện trong reference.

## Repository-specific details

- Chủ quyết định: chủ dự án Dana Quest; chưa có đội vận hành/phụ trách tên riêng.
- Nguồn mới: Dana-Quest.zip do người dùng gửi ngày 26/10/2026. Không coi .git đi kèm là remote hiện tại hoặc quyền push.
- Scripts: CODE_STYLE.md; không chạy app trong thư mục pack.
- Nguồn hình: references/INDEX.md, ảnh Questo và bộ nhận diện do người dùng cung cấp. Screenshot không dùng làm production UI/quest content.
- Quyết định mở: O-01–09 tại PRD; avatar depth, nhận biết lần đầu, GPS/demo, hint/skip/reward/replay, photo/quota/privacy, run policy và hosting.
- Definition of done cho D0: đủ 8 tài liệu, links/reference dùng được, requirements mới nhất không mâu thuẫn, đề xuất được gắn nhãn và pack không chứa code/secret/runtime data. Definition of done cho code theo TESTING từng giai đoạn.


### Tra yêu cầu gốc và nội dung đã điều chỉnh
Đọc [bảng đối chiếu 14 ý](references/REQUIREMENTS-COVERAGE.md) khi kiểm tra phạm vi hoặc bàn giao. Yêu cầu website trong ghi chú gốc đã được hoãn bởi chỉ dẫn mới hơn; các đề xuất cũ về minh họa mềm, khóa mọi màn sau logout, luật ngẫu nhiên 5–10 nhiệm vụ/80% không phải quyết định còn hiệu lực cho thiết kế mới. Phần code còn dùng luật đó phải được rà/migrate, không xóa âm thầm.



### Thiết kế giao diện và nguồn ảnh v2.2
Khi triển khai UI, đọc [SCREEN-SPECS](references/ui-design/SCREEN-SPECS.md) và [prototype](references/ui-design/index.html), tra S/WF/V và notes. [ZIP/source policy](references/SOURCE-ARCHIVE.md) nêu ảnh gốc và checksum. Phân biệt artifact review với app; không tự coi số liệu/asset/map/camera placeholder là triển khai thật, không đưa archive/screenshot có profile bên thứ ba vào GitHub công khai. Push vẫn cần xin phép và chỉ nhánh phụ.
