# Account page: đối chiếu mẫu Questo

Nguồn: 16 ảnh trong thư mục Account page. Chỉ sửa React/Node trong checkout được phép; Django không sửa, không push. Ảnh có các nhóm Search/Crew login/Profile/Settings/My quests; không biến Crew thành tính năng nhóm khi luật Dana hiện vẫn solo.

## Thiết kế

Màu giấy trắng #fff, chữ #36352f, chữ phụ #837d6d, viền #e9e4d8, hồng #df2776, vàng #ffca05, xanh #54a257. Viền card 2px và chân viền nhẹ như mẫu; mobile một cột, laptop hai cột hoặc form tối đa 760px. Nút/đường dẫn ít nhất 44px; cài đặt có route riêng và back; điều hướng chính giữ trên hồ sơ, ẩn ở màn cài đặt con.

## Phần có dữ liệu thật, không dùng tài khoản mẫu trong ảnh

- Hồ sơ tên hiển thị/ảnh/bio/quê quán, nhân vật Dana riêng, email/điện thoại; copy email.
- XP theo checkpoint quest máy chủ đã ghi nhận; không tự gán XP từ xu legacy. Rank trình bày: Rookie dưới 2000 XP, Seeker dưới 5000 XP, Explorer từ 5000 XP; không làm thay đổi thưởng.
- Ví phân biệt Green Coins demo với xu từ các quest. Không sao chép 51.991đ của người trong ảnh.
- Passport tính dấu từ quest hoặc điểm đến đã hoàn thành; lịch sử ghé/thực hiện/nhiệm vụ cũ giữ đủ. Không giả số km vì hệ thống chưa lưu quãng đường.
- Thư viện kỷ niệm dùng ảnh bìa quest và trạng thái hành trình, đồng bộ giữa trang Tài khoản và Album; ảnh cũ riêng tư không còn dùng làm ảnh đại diện quest. Bảng thành phố/toàn bộ lấy người chủ động tham gia; mặc định không công khai, chỉ đưa tên hiển thị/nhân vật/XP, không email/điện thoại/ảnh riêng.
- Cài đặt tài khoản, mật khẩu có kiểm tra mật khẩu cũ, thông báo thiết bị/in-app, ngôn ngữ riêng vùng tài khoản, xóa bộ nhớ shell không xóa tiến độ/ảnh, đọc lại quest đã kích hoạt bằng mã.
- Quyền cho phép ảnh quảng bá được lưu và tắt được, không đồng nghĩa ảnh tự công khai hoặc có chiến dịch quảng cáo thật.
- How to play/FAQ/tìm kiếm, báo lỗi/yêu cầu hỗ trợ/gợi ý địa điểm lưu trong hệ thống Node, điều khoản/quyền riêng tư/giới thiệu/phiên bản. Không hứa có nhân viên phản hồi 24/7.
- Đăng xuất giữ dữ liệu. Xóa tài khoản cần mật khẩu và cụm xác nhận; xóa đúng dữ liệu chủ tài khoản, thu hồi phiên, mã đã dùng không trở thành mã dùng lại. Không thao tác xóa tài khoản thật trong kiểm thử.

## Mục trong ảnh chưa có dịch vụ hoặc quy tắc để vận hành thật

Pass 3 ngày/mua/tặng pass, tiền giới thiệu, trả tiền video, hướng dẫn tour/đặt tour riêng cần thanh toán, đối soát, chính sách và vận hành. Giữ các mục và trang giải thích, không giả giao dịch/tiền/đối tác. Chia sẻ đường dẫn quest thì làm được bằng chức năng trình duyệt, không đồng nghĩa tặng vé có giá trị. Thách đấu/nhóm chưa bật trong luật solo. Push khi app đóng hẳn và email tự động cần dịch vụ gửi riêng; nhắc khi app mở dùng chức năng sẵn có.

Các mục My quests/Memories trong ảnh nối với Quest của bạn/Album đang có để giữ chức năng cũ. Search nối với Tìm kiếm hiện có; Crew không được đưa trở lại.

## Kiểm chứng cuối
- Vitest: 165/165 bài kiểm tra, 42 tệp (maxWorkers=2). Lượt chạy mặc định có một test bản đồ timeout khi chạy nhiều worker; lượt giới hạn worker vượt qua toàn bộ.
- Chrome: 120 kiểm tra trang/luồng tại 320x568, 390x844, 844x390, 1440x900; không lỗi JavaScript hoặc tràn ngang. Tài khoản kiểm thử dùng API và thư mục tạm riêng.
- Build thành công. Lint không lỗi; còn cảnh báo Fast Refresh có sẵn tại AuthContext.tsx.
- Django không có thay đổi; không push GitHub.

## Hộp đăng nhập tại chỗ (Quest và Sự kiện)

Khách mở Quest của bạn hoặc bấm đăng nhập để chơi/lưu sự kiện sẽ thấy hộp đăng nhập trên trang hiện tại, nền mờ và inert; không chuyển sang route đăng nhập. Đóng bằng nút ×, Escape hoặc nền ngoài; chuyển đăng ký/đăng nhập trong hộp không đổi URL. Điện thoại dùng bottom sheet; desktop dùng hộp giữa màn hình. Liên kết điều khoản/quyền riêng tư/kích hoạt mã vẫn hoạt động. Tài khoản mới vẫn tùy chỉnh nhân vật trước, rồi quay lại trang nguồn đã được kiểm tra đường dẫn. API vẫn kiểm tra phiên và quyền sở hữu; trang Quest khách không đọc dữ liệu cá nhân.

Sửa thêm lỗi vùng hiển thị bị remount khi khôi phục phiên: state sự kiện/notice được gắn owner trong provider thay vì đổi key toàn cây UI, giữ nội dung đang nhập và vị trí trang khi đăng nhập. Test phiên trả chậm chứng minh ô tìm kiếm giữ nội dung.

Kiểm chứng: 179/179 test (47 tệp), build thành công; lint còn duy nhất cảnh báo Fast Refresh cũ. Chrome 320x568, 390x844, 844x390, 1440x900 kiểm tra hộp Quest, đóng/mở, đăng ký tại chỗ, đăng nhập thật trên Sự kiện rồi lưu. Luồng thông báo toàn trang cũng chạy lại thành công. Tài khoản kiểm thử và API dùng thư mục tạm, không thao tác tài khoản thật. Django không thay đổi, không push.
