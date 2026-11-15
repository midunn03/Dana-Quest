# User Flows — Dana Quest

> Trạng thái: mô tả **hành vi hiện có trong code** (thư mục `Dana-Quest-nhanh-dung`, kiểm kê 28/10/2026).
> Luật sản phẩm mục tiêu nằm ở `Dana-Quest-Documentation-v2.2/Dana-Quest-Documentation/docs/PRD.md` (WF-01→WF-15).
> Khi hai nguồn khác nhau: hành vi đã có là HIỆN TRẠNG, PRD là hướng; agent không tự đổi hành vi nếu chưa có yêu cầu.

## Purpose and audience
Cho người khám phá Đà Nẵng đi quest theo địa điểm thật: biết cần đến đâu, làm thử thách tại chỗ, lưu kỷ niệm và đổi quà demo.
Ngôn ngữ VI/EN (provider chung, lưu theo chủ tài khoản hoặc khách). Mobile-first, chạy local trước.

## Route map (hash routes, `src/App.tsx`)

| Route | Màn |
| --- | --- |
| `#/` | Trang chủ (hero + form đăng nhập/đăng ký nhúng) |
| `#/dang-nhap`, `#/dang-ky` | Xác thực — luôn redirect về `#/`, chỉ đóng vai trò tiền xử lý form |
| `#/bat-dau/thanh-pho` → `#/bat-dau/ke-hoach` → `#/bat-dau/gioi-thieu` | Onboarding hành trình 3 bước |
| `#/kich-hoat`, `#/nhap-ma` | Kích hoạt quest / nhập mã (BookingPage) |
| `#/chon-nhan-vat`, `#/nhan-vat` | Chọn / sửa nhân vật pixel |
| `#/tim-kiem` | Discovery — tìm kiếm quest |
| `#/quest-cua-toi` | Discovery — quest đã tham gia |
| `#/kham-pha`, `#/map` | Bản đồ khám phá (Leaflet + pixel tiles) |
| `#/quest/:id` | Chi tiết quest |
| `#/quest/:id/chi-duong`, `#/chi-duong/:id` | Dẫn đường đi bộ |
| `#/quest/:id/choi` | Chơi quest (story/checkpoint/challenge) |
| `#/nhiem-vu/:destinationId` | Nhiệm vụ theo địa điểm (gameplay legacy) hoặc chi tiết quest mới |
| `#/dia-diem/:id` | Chi tiết địa điểm |
| `#/may-anh/:id/:missionId` | Camera nhiệm vụ ảnh |
| `#/hoan-thanh/:id/:missionId` | Ăn mừng hoàn thành |
| `#/album`, `#/cua-hang` | Kỷ niệm / cửa hàng đổi quà |
| `#/su-kien`, `#/su-kien/:id` | Sự kiện / chi tiết sự kiện |
| `#/nha-sang-tao/:id` | Hồ sơ nhà sáng tạo |
| `#/tai-khoan`, `#/tai-khoan/:view` | Tài khoản + trang con (wallet, privacy, support...) |
| `#/dieu-khoan`, `#/quyen-rieng-tu` | Điều khoản / quyền riêng tư |

## Flow 1: Đăng ký / đăng nhập
Entry: `#/` (form nhúng trong hero) hoặc modal mở qua sự kiện `dana-request-login` khi bấm hành động cần phiên.
1. Nhập tên đăng nhập và mật khẩu (6–128 ký tự).
2. Submit bị khóa trong lúc gửi; server kiểm tra, tạo tài khoản và phiên.
3. Thành công: cookie HttpOnly, SameSite=Strict, hết hạn 7 ngày hoặc khi restart server; chuyển tiếp tạo/bộ chọn nhân vật hoặc về ý định trước đó.
Validation: tên trùng → báo lỗi cạnh trường; sai mật khẩu → thông báo riêng, không lẫn với lỗi mạng.
Save failure: giữ input, cho thử lại; không giả lưu local thành tài khoản server.
Cancel: đóng modal, tiếp tục xem nội dung công khai.
Email/số điện thoại: bổ sung sau ở Tài khoản, không bắt buộc lúc đăng ký, không đăng ký trùng.

## Flow 2: Lần đầu mở game
1. Mở `#/` → xem trang chủ, đổi ngôn ngữ VI/EN/System.
2. Bắt đầu quest yêu cầu phiên → nếu chưa đăng nhập, điều hướng về màn đăng nhập của trang chủ.
3. Sau xác thực thành công: onboarding hành trình (`#/bat-dau/...` → `#/kich-hoat` → `#/nhap-ma`) hoặc chọn nhân vật `#/chon-nhan-vat`.
4. Xác nhận nhân vật lưu bằng khóa `dana-quest-avatar-v1` (khách) hoặc theo tài khoản (đăng nhập); tải lại vẫn còn.

## Flow 3: Khám phá và bản đồ
Entry: `#/tim-kiem` (danh sách) hoặc `#/kham-pha` (bản đồ).
1. Tìm theo tên có dấu/không dấu; gõ "gần tôi"/"quanh đây"/"xung quanh" để lọc theo khoảng cách (cần GPS còn mới, sai số ≤50 m).
2. Chạm card/ghim → thẻ tóm tắt; Khám phá → chi tiết.
3. GPS xin khi chọn lọc khoảng cách/định vị; từ chối vẫn tìm và chọn thủ công được.
Loading: có chỉ trạng thái; Empty: trạng thái rỗng riêng; Error tile: bản đồ báo lỗi nhưng danh sách, tìm kiếm và chọn địa điểm vẫn dùng được.
Đúng 15 điểm active; Chợ Hàn chỉ còn dữ liệu lịch sử (đọc được tiến trình cũ, không hiện trên bản đồ/tìm kiếm).

## Flow 4: Chơi quest (DUE và quest v2)
Entry: chi tiết quest `#/quest/:id`.
1. Xem tổng quan → `#/quest/:id/chi-duong` dẫn đường đi bộ (tuyến Valhalla, khoảng cách dọc tuyến theo GPS).
2. Server yêu cầu xác nhận đến nơi trước khi mở/hoàn thành thử thách; đường dẫn trực tiếp chưa đến nơi có lối quay lại rõ ràng.
3. `#/quest/:id/choi`: đọc story → challenge (nhập đáp án / trắc nghiệm) → feedback → checkpoint tiếp → tổng kết XP/xu.
4. Hủy điều hướng hoặc lưu lỗi: input được giữ; chỉ chuyển màn sau pause được chấp nhận; `beforeunload` chỉ là cảnh báo của trình duyệt.
Failure: sai đáp án ở lại, giữ câu trả lời; lỗi mạng không tính là đáp án sai.
Reload: tiếp tục từ trạng thái đã lưu; hoàn thành lặp không cộng xu lần hai.

## Flow 5: Nhiệm vụ legacy theo địa điểm
Entry: `#/nhiem-vu/:destinationId`.
1. Chọn số lượng 5–10 → nhận ngẫu nhiên đúng số đó (không chọn từng nhiệm vụ).
2. Hoàn thành: tự xác nhận / lưu ảnh rồi xác nhận / kiểm tra vị trí (sai số ≤50 m, cách ≤100 m, kết quả ≤60 giây).
3. Điểm đến hoàn thành khi xong ≥ ceil(80% số nhiệm vụ đã chọn).
4. Mỗi nhiệm vụ +10 Green Coins demo đúng một lần (giao dịch cục bộ chống lặp khi bấm nhiều tab).

## Flow 6: Camera và ảnh
Entry: nhiệm vụ ảnh → `#/may-anh/:id/:missionId`.
1. "Mở webcam" → getUserMedia (không thu âm) → xem trực tiếp → "Chụp ảnh" → xem trước → "Lưu ảnh" mới ghi vào album.
2. Fallback: "Chọn ảnh từ thiết bị"; JPG/PNG/WebP ≤10 MB; xử lý còn ≤1600 px cạnh dài, ≤3 MB; HEIC phải tự đổi JPG.
3. Rời trang/tắt camera/chụp xong: dừng camera; từ chối quyền/không webcam/camera bận: thông báo tiếng Việt riêng.
Lưu failure: báo lỗi và không ghi nhận hoàn thành/cộng xu. Mỗi nhiệm vụ giữ 1 ảnh, có thể thay trước khi hoàn thành.
Xác minh ảnh bằng AI: chưa triển khai — người dùng tự xác nhận, không có kết quả AI giả.

## Flow 7: Album, cửa hàng, ví xu
Album `#/album`: ảnh IndexedDB, xem/xóa có xác nhận; album rỗng có hướng dẫn.
Cửa hàng `#/cua-hang`: đổi voucher demo, mỗi loại một lần, ghi sổ giao dịch; thiếu xu/xảy lỗi không báo đổi thành công.
Ví xu: server-authoritative (đối soát dữ liệu cũ, credit/debit không lặp, không trả số 0 giả khi lỗi); quà đã đổi xem ở Tài khoản → Ví xu/Voucher của tôi.
Green Coins/voucher chỉ là demo, không phải tiền thật.

## Flow 8: Sự kiện
Entry: `#/su-kien`.
1. Thẻ sự kiện → chi tiết `#/su-kien/:id`; Cầu Rồng tính lịch phun lửa 21:00 T6/T7/CN.
2. Lưu kế hoạch → nhắc trước 30 phút khi trang/PWA đang hoạt động; sự kiện chỉ có ngày dự kiến không tự gán giờ nhắc.
3. Công cụ sự kiện trình diễn (operator) mặc định tắt; bật bằng biến môi trường `DANA_PRESENTATION_EVENTS=1`, giữ cooldown 5 phút.
Thông báo là nhắc cục bộ; Web Push khi app đóng hoàn toàn chưa có.

## Navigation and accessibility
Bottom nav xuất hiện trên các trang workspace/công khai nhưng **không có trên trang chủ** — đã ghi nhận là điểm cần thống nhất trong TASKS-05.
Nút nổi riêng cho nhiệm vụ đang chơi trên bản đồ.
Chế độ giảm chuyển động được tôn trọng ở slideshow trang chủ; ảnh nền tạm dừng khi tab ẩn.
Kiểm tra bố cục chuẩn: 320/390/768/1024/1440 px, VI/EN, không tràn ngang.

## Open decisions (chưa chốt — không tự triển khai)
- **Palette chính thức**: tông vàng/navy pixel hiện tại hay bảng màu xanh lá v2.2 trong DESIGN_SYSTEM.md (ĐỀ XUẤT chưa duyệt). Chặn mọi công việc dàn lại UI.
- Cách nhận biết lần đầu sau khi xóa dữ liệu/đổi thiết bị (PRD O-01).
- Luật hint/skip/điểm/thưởng lặp lại (O-03), GPS bắt buộc hay hỗ trợ (O-04), ảnh bắt buộc chụp trực tiếp (O-05), quota ảnh (O-06).
- Hosting/backend lưu ảnh miễn phí (O-08).
