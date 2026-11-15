# G3 — Xác nhận đến điểm bắt đầu, chờ O-04

Ngày31/10/2026. **CHỈ ĐỀ XUẤT — không thêm GPS, không đổi camera/quyền định vị.** DUE hiện tự xác nhận đã đến có chủ đích cho demo.

## Hiện trạng

Quest v2 gửi `confirm-arrival`, lưu `arrivalConfirmedAt` bằng thời gian server và `arrivalMethod:'visual'`; Node `server/quest-runs.mjs` và Django `backend/game/quest_rules.py` giữ hành vi này. Retry không thay mốc xác nhận. Không được mô tả đây là bằng chứng GPS hoặc vị trí đã được server xác minh.

Legacy có kiểm tra riêng ở `src/lib/location.ts`, `server/game-logic.mjs`, `backend/game/rules.py`:

- Tọa độ hữu hạn, latitude/longitude trong miền hợp lệ; accuracy>0.
- Mẫu không đến từ tương lai, tuổi≤60000ms, accuracy≤50m.
- **Khoảng cách tâm + accuracy≤100m**, không chỉ khoảng cách tâm≤100m. Đây là quy tắc bảo thủ đang có, phải ghi rõ khi cân nhắc áp dụng cho v2.

## Phương án chờ chủ dự án chọn

| Phương án | Đề xuất hành vi | Giới hạn |
| --- | --- | --- |
|A — giữ visual demo | Giữ cách hiện tại, hướng dẫn nhận diện điểm bắt đầu; xác nhận không tự phát thưởng checkpoint | Không chứng minh người dùng có mặt; không suy ra chống gian lận GPS |
|B — GPS v2 theo luật legacy | UI xin quyền khi người dùng chủ động xác nhận; server nhận mẫu và tự tính khoảng cách theo target catalog, accuracy≤50m, tuổi≤60s, distance+accuracy≤100m | GPS từ browser vẫn có thể giả mạo; HTTPS/quyền thiết bị và điều kiện ngoài trời cần kiểm tra thực |

Ví dụ: cách điểm70m nhưng accuracy40m bị từ chối theo luật legacy vì110m>100m; accuracy50m và khoảng cách50m đạt. Nếu chủ dự án muốn chỉ distance≤100m thì đó là thay đổi luật khác, không được tự gọi là giữ nguyên legacy.

## Nếu B được duyệt ở đợt sau

1. Target lấy theo quest/checkpoint server quản lý, không tin tọa độ mục tiêu hoặc cờ `arrived` do client gửi. Giữ IDs và visual method của lịch sử; không đổi hồi tố thành GPS.
2. Phân biệt quyền bị từ chối, timeout, độ chính xác thấp, mẫu cũ và ngoài phạm vi; cho thử lại. Không gửi form tự động hay theo dõi vị trí nền.
3. Không tự fallback sang visual trong chế độ yêu cầu GPS. Chính sách hỗ trợ không có định vị/tiếp cận cần được duyệt; lỗi tile OSM không được quyết định người chơi đã đến hay chưa, vẫn giữ danh sách địa điểm dự phòng.
4. Retry/concurrent request không đổi timestamp đã được chấp nhận; account owner vẫn được kiểm tra trước ghi. Không chuyển tab cookie B sang tiến độ A.
5. Minimize lưu tọa độ thô; chỉ lưu metadata cần cho cơ chế đã chốt, đề xuất thời gian lưu/quyền xóa riêng trước triển khai. Không thêm log vị trí hoặc Web Push trong bước này.

## Test nghiệm thu đề xuất

Các biên50m/100m/60000ms và ngay ngoài biên; accuracy0/âm/NaN, future timestamp, lon/lat sai miền, target client bị sửa, retry/paused/chưa login/stale owner. So sánh JS/Node/Python cùng tọa độ giả và tolerance tính khoảng cách; không dùng GPS thật trong unit test.

Thiết bị thực: permission deny/allow, GPS nhiễu, timeout, mạng yếu, HTTPS và Safari/iOS. Chưa chạy những kiểm tra này. Camera không thuộc thay đổi xác nhận đến nơi.

## CẦN CHỐT — O-04

Giữ A cho demo hay bật B, và có cho phép cơ chế hỗ trợ riêng khi không định vị được không? **Hiện chưa có quyết định O-04; runtime tiếp tục visual, không bị chặn để chờ đề xuất này.** Nội dung/tọa độ/đáp án16quest vẫn chưa xác minh thực địa(O-09).
