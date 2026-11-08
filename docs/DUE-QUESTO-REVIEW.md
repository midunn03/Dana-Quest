# DUE: đối chiếu Quest khi chơi

Phạm vi chỉ mẫu DUE, tham khảo 35 ảnh IMG_6767–6801. Giữ hai thử thách, thứ tự, luật phải giải đúng và thưởng 120 XP/20 xu quest một lần.

| Ảnh | Chức năng quan sát được | Áp dụng DUE |
|---|---|---|
| 6767–6772 | Chuẩn bị, ngôn ngữ, Adventure/Escape, độ khó, nhóm, thời điểm, briefing và cue cuộn | Giữ tiếng Việt, solo, không đếm giờ; briefing/lưu ý an toàn. Không dựng lựa chọn chưa có engine/nội dung. |
| 6773–6776 | Toàn màn tối, back/help, khoảng cách, ảnh/map, địa chỉ, checklist gập, không tìm thấy, modal nhận diện, xác nhận đã đến, bắt đầu | Màn DUE riêng. GPS hỗ trợ sau thao tác bật vị trí; tự xác nhận bằng mắt lưu theo tài khoản, không gọi GPS xác minh và không thưởng. Giữ nền bản đồ/tuyến đi bộ hiện có. |
| 6777–6780 | Ảnh kỷ niệm, quyền camera, chia sẻ có thưởng, story | Ảnh kỷ niệm tùy chọn từ menu, chỉ tải về thiết bị; không hứa album tài khoản/chia sẻ/thưởng. Chưa bổ sung server PH-01. |
| 6781–6782 | Menu riêng, âm thanh, hỗ trợ, chụp màn hình, restart, quit | Menu riêng, cỡ chữ, hành trình, đọc lại, lưu thẻ hành trình, FAQ, báo lỗi, tạm dừng/rời. Không giả slider nhạc/giọng khi chưa có asset; xem lại không reset thưởng. |
| 6783–6787 | Help trắng, FAQ tìm kiếm/lọc/accordion, report nhóm lỗi, chat | FAQ và report riêng. Report tải file gửi thủ công, không báo đã gửi. Không hứa chat 24/7 khi chưa có vận hành. |
| 6788–6794 | HUD, ảnh lớn/phóng to, chỉ dẫn, Guide me, chapter/story, back/continue, challenge/input/help | HUD riêng, ẩn điều hướng app cả khi chỉ đường. Bản đồ trong Guide, minh họa phóng to, đọc lại story không đổi câu trả lời. Không sao chép timer/15 checkpoint/điểm mẫu. |
| 6795–6799 | Help, xác nhận hint, reveal, skip, trạng thái skipped | Gợi ý hướng quan sát có xác nhận, không trừ xu; không reveal/skip theo quyết định người dùng. |
| 6800–6801 | Về story sau câu đúng, exit/feedback và Explore | Phản hồi lưu trước tiếp tục, recap/tổng kết; xác nhận thoát giữ tiến độ. |

## Thiết kế

Nền #0d0a1c, HUD #19152f, panel #201a42, tím #7955f5, mint #70deb0, chữ #f5f1ff. FAQ/report trắng. Đọc trái, tối đa khoảng 700px trên desktop; mobile tràn màn, không khung điện thoại. Nội dung cuộn riêng, thanh hành động luôn thấy, nút tối thiểu 44px. Bỏ thanh Khám phá/Sự kiện/Tìm kiếm/Quest/Tài khoản khi chỉ đường/chơi DUE, giữ HUD lượt chơi như mẫu.

## Giới hạn

Kho ảnh chưa chứa ảnh cổng DUE xác minh: dùng minh họa có nhãn và mô tả biển tên; không thay bằng ảnh địa điểm khác/Questo. Xác nhận đến là tự xác nhận, không giả kiểm chứng GPS/AI. Không thay đổi nhiệm vụ địa điểm khác. GPS/camera thật cần kiểm tra trên thiết bị, mock không chứng minh hoạt động phần cứng.

## Kết quả kiểm tra 27/10/2026

- Toàn bộ 150 test/35 file đạt. Một lần chạy song song timeout chờ lazy map của luồng legacy; kiểm tra riêng 7 test flow đạt, chạy lại toàn bộ đạt. Không sửa luồng legacy.
- Sau chỉnh focus/ẩn nội dung nền: 7 test tập trung trong 4 file đạt; bản dựng thành công, lint chỉ còn 3 cảnh báo cũ trong AuthContext/useLiveVisitInfo.
- Chrome headless: 360×800, 390×844, 430×860, 844×390, 1280×720, 1440×900, 1920×1080 đều qua: chỉ đường không có nav chính, đổi tab, xác nhận đến, reload, bắt đầu, phóng to hình, menu, pause/resume, đáp án sai giữ input, đọc lại truyện giữ input, hint xác nhận, FAQ tìm kiếm, tải báo cáo, đúng hai câu, tổng kết/reload không thưởng lặp.
- 390/1440 thêm chọn ảnh giả lập (không ảnh cá nhân), preview, tải ảnh về, bỏ preview và thoát; đây không phải kiểm tra camera phần cứng.
- Browser dùng tài khoản và kho tiến độ kiểm tra riêng. HTTP integration dùng phiên cookie thật trên server kiểm tra tạm. Không thay tiến độ tài khoản người dùng để test.
- Ảnh minh chứng: `tests/visual/due-arrival-390.png`, `due-menu-390.png`, `due-faq-390.png`, `due-challenge-1440.png`.
- Máy chủ Vite tự khởi động lại khi bổ sung action xác nhận đến; phiên bộ nhớ có thể hết, cần đăng nhập lại. Không xóa tài khoản/tiến độ đã lưu.
