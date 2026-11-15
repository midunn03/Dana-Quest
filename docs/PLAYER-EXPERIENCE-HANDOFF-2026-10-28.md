# Bàn giao hoàn thiện trải nghiệm Dana Quest — 28/10/2026

Thư mục thực hiện: Dana-Quest-nhanh-dung. Dự án đã được chạy trước khi sửa. Phiên5175 đã tắt theo yêu cầu; bản hiện tại chạy http://127.0.0.1:5174/. Không commit hoặc push GitHub; giữ thay đổi có sẵn.

## Thay đổi theo phản hồi

- Nền welcome/login:5ảnh, đổi20giây/ảnh, chuyển động nhẹ, tạm dừng cả ảnh/chuyển động, dừng khi tab ẩn và tôn trọng giảm chuyển động.
- Ngôn ngữ VI/EN/System dùng provider chung, lưu theo chủ tài khoản hoặc khách; catalog UI/lỗi/địa điểm/sự kiện và16quest song ngữ. Không dịch bằng thay DOM. ID, đáp án và nội dung người chơi giữ nguyên.
- Khám phá/bản đồ: bố trí lại shortcut, sidebar hai bộ lọc, danh sách/marker/bounds cùng selector; chọn hai chiều, highlight ghim, ẩn lựa chọn đã bị lọc, GPS/avatar đúng tài khoản và vòng sai số. Django là nguồn hiển thị có namespace riêng, không tự phát thông báo.
-16quest có tên phiêu lưu, hook, diễn tiến, hint/feedback, kết thúc và gợi ý hành trình tiếp theo. Hash kiểm thử xác nhận toàn bộ mechanics/reward/order cũ giữ nguyên.
- Quest giữ input khi hủy điều hướng hoặc lưu lỗi; chỉ chuyển sau pause được chấp nhận. Máy chủ yêu cầu xác nhận đến nơi trước khi mở/hoàn thành thử thách; đường dẫn trực tiếp chưa đến nơi có lối quay lại rõ ràng. beforeunload chỉ hỗ trợ cảnh báo của trình duyệt, không đảm bảo lưu sau khi hệ điều hành đóng cưỡng bức.
- Một ví xu server-authoritative, đối soát dữ liệu cũ, sao lưu migration, credit/debit không lặp, không trả số0giả khi lỗi. Dữ liệu mâu thuẫn chặn đổi và yêu cầu đối soát. Quà đã đổi ở Tài khoản → Ví xu/Voucher của tôi.
- Bảy ảnh quà PNG nền trong suốt do imagegen tạo trong public/rewards. Nguồn ghi docs/art-direction/reward-assets-20261028.md.
- Bỏ EventDemo khỏi màn người chơi. Công cụ operator riêng tạo lịch thật theo tài khoản, mặc định tắt, giữ cooldown5phút và các điều kiện riêng tư/quest/attendance. Xem docs/EVENT-PRESENTATION.md.
- Điều khoản/quyền riêng tư dùng nội dung chung public/account; FAQ10câu chi tiết. Không bịa đối tác/liên hệ/chính sách thương mại.
- Bỏ tiêu đề DANA QUEST thừa ở Khám phá/Quest; đồng bộ tím/kem/vàng, toast và nút tiếp tục quest dễ đọc hơn. Token riêng ExperienceTokens.css; hướng pixel trong docs/art-direction/pixel-transition.md.

## Bằng chứng kiểm tra

- Toàn bộ suite:225/225đạt, `.data/overhaul-final-tests-20261028.json`.
- Sau đó bổ sung regression đường dẫn chưa đến nơi và kiểm tra lại login/quest/guard: `.data/overhaul-followup-tests-20261028.json`.
- Chrome:320/390/768/1024/1440px, VI/EN,5route mỗi kích thước; không lỗi JavaScript/tràn ngang. Hủy thoát giữ input, pause lỗi ở lại, retry chuyển đúng đích; chọn ghim và lọc rỗng đúng. `.data/overhaul-browser-results.json`.
- Chrome slideshow390/1440:5ảnh/20giây, loop/pause đạt, không overflow/JS error.
- Build đạt; lint chạy thành công nhưng còn cảnh báo React hooks/Fast Refresh, không tuyên bố lint không cảnh báo. git diff --check đạt (Git nhắc chuẩn hóa CRLF trên Windows).
- Review độc lập: các phát hiện arrival bypass, avatar khác chủ, selection lệch và guard vô hình đã sửa; reviewer xác nhận đóng toàn bộ phát hiện.

## Giới hạn cần biết khi trình bày

- Công cụ sự kiện riêng hiện mặc định tắt; cần khởi động chính server5174 với DANA_PRESENTATION_EVENTS=1 theo hướng dẫn, rồi tạo lịch cho tài khoản báo cáo. Không bỏ cooldown để ép thông báo liên tiếp.
- Các quà hiện là vật phẩm kỷ niệm trong ứng dụng. Không tạo mã voucher giả có thể thanh toán; cần đối tác/hệ thống phát hành thật để đổi hàng hoặc dịch vụ ngoài ứng dụng.
- Không kiểm chứng GPS phần cứng, Web Push khi đóng trình duyệt hoặc tính khả dụng của nhà cung cấp bản đồ. Khi tile/GPS lỗi, danh sách và thông báo hướng dẫn vẫn sử dụng được.
