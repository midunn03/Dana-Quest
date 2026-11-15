# G1 — Đề xuất một nguồn luật chuẩn

Ngày31/10/2026. **CHỈ ĐỀ XUẤT — chưa triển khai.** Django được giữ để quản trị; dev hiện vẫn hybrid Node auth + Django catalog/admin. Tài liệu này không chọn chuyển toàn bộ hệ thống sang một backend.

## Kiểm kê từ source hiện tại

| Luật | Client | Node | Django |
| --- | --- | --- | --- |
| Legacy chọn ngẫu nhiên5–10 nhiệm vụ, không trùng | `src/lib/progress.ts`, `src/data/missions.ts` | `server/game-logic.mjs` | `backend/game/rules.py` |
| Hoàn thành địa điểm khi đủ ceil(n×0.8), n≥5 | `src/lib/rules.ts`; dùng cho trạng thái/thông báo | Engine xác thực từng nhiệm vụ, không dùng80% làm điều kiện phát mỗi10xu | Tương tự: engine tính xu từng nhiệm vụ; không tự suy ra có gate80% |
| +10xu mỗi nhiệm vụ legacy duy nhất | `src/data/rewards.ts`, `src/lib/progress.ts` | game-logic và nguồn legacy trong `server/wallet.mjs` | `backend/game/rules.py` |
| Voucher và giá | `src/data/rewards.ts` | game-logic và wallet chứa bảng giá riêng | `backend/game/rules.py` |
| GPS legacy | `src/lib/location.ts` | game-logic | game/rules |
| Grading/upgrade quest v2 | questProgress gọi `shared/quest-challenges.mjs` | quest-runs gọi cùng shared module, đọc catalog gốc | `backend/game/quest_rules.py` diễn giải tương đương; test đối chiếu HTTP/grader |
| XP/xu v2 | questProgress cộng reward theo checkpoint | wallet lấy coins theo catalog, nguồn có ID; leaderboard trong auth tính XP | Quest API lưu completion; chưa có wallet/leaderboard tương đương đầy đủ |

Giá hiện có: postcard30,drink50,souvenir80,local-food70,transport100,admission150,outdoor-activity140. ID và giá phải được giữ khi trích luật, không chỉnh theo tên hiển thị hay locale.

**Không đồng nhất hóa sai hợp đồng:** legacy redeem trùng báo lỗi; Node wallet redeem lại trả ví hiện tại để idempotent. Dùng chung dữ liệu/điều kiện không có nghĩa đổi response của hai endpoint. V2 yêu cầu hoàn thành đúng thứ tự toàn bộ checkpoint, không áp ngưỡng80% của legacy.

## Hướng đề xuất

1. Tạo đặc tả dữ liệu không phụ thuộc ngôn ngữ tại `shared/game-policy.json` trong một đợt được duyệt sau: version, mission IDs/kinds, assignment min/max, completion numerator4/denominator5,10coins/mission, reward costs và giới hạn GPS hiện hành. Đây là **đường dẫn đề xuất**, chưa có file runtime mới.
2. JS có helper thuần cho các phép tính; TS chỉ import/re-export types/helper theo ranh giới module. Node đọc cùng nguồn, giữ trách nhiệm xác thực và ghi dữ liệu ở server.
3. Python đọc cùng JSON, có adapter nhỏ cho tính toán/validation, dùng chung vector kiểm thử. Python không import trực tiếp `.mjs`; không mở Node subprocess trên mỗi request. Bộ oracle Node hiện tại chỉ chạy trong test.
4. Secret grading không đưa vào policy công khai: đáp án text, correctOptionId(s), correctOrder và mappings bí mật vẫn thuộc A4/server. `shared/quest-challenges.mjs` hiện có grader; việc trích luật không được vô tình tăng phần secret đưa sang client.
5. Quyền owner, DB transaction, lưu ảnh, lựa chọn nguồn tiến độ và phát thưởng là ranh giới tin cậy riêng. Hàm thuần trả điều kiện/kết quả tính toán; browser không tự chứng nhận tiền thưởng cho server.

## Lát triển khai và bằng chứng cần có

- Lát1: trích constants, không đổi API/storage/catalog. So sánh giá trị mọi consumer trước/sau; không xóa luật cũ khi chưa có đối chiếu.
- Lát2: trích phép tính thuần, chuyển từng consumer; snapshots/response hiện có không đổi. Loại bản sao cũ sau khi tìm toàn bộ import/test và xác nhận không còn dùng.
- Lát3: CI chạy JS/Python trên cùng vector JSON. Tách rõ expected business result và expected HTTP error của mỗi endpoint, không ép tất cả mã lỗi giống nhau.

| Vector nghiệm thu | Kết quả cần chứng minh |
| --- | --- |
| n=5,6,7,8,9,10 | cần4,5,6,7,8,8; dưới ngưỡng chưa complete; n<5 không complete |
| count4/11/lẻ/boolean | từ chối; count5/10 chọn đủ số mission ID khác nhau |
| Complete cùng nhiệm vụ hai lần, retry/race/reload | một nguồn thưởng10xu, không tăng lần hai |
|3 nhiệm vụ hợp lệ + postcard | earned30,spent30,balance0; không phụ thuộc đạt80% |
| Reward constructor/toString/ID lạ, thiếu tiền, voucher trùng | giữ guard/prototype protection và response riêng của API |
| Từng loại challenge, VI/EN, input sai kiểu | giữ đáp án/ID và kết quả chấm; server không tin photoAvailable client |
| Legacy/v2 cùng tồn tại | không cộng bản legacy nhúng lần nữa; giữ receipt và provenance |

Tham chiếu kiểm tra sẵn có: `tests/rules.test.ts`, `tests/server-actions.test.ts`, `tests/wallet.test.ts`, `tests/wallet-api.test.ts`, `tests/quest-runs.test.ts`, `backend/game/test_rules.py`, `backend/game/test_quest_contract.py`. Đây là đề xuất mở rộng, chưa thêm/sửa test trong nhóm G.

## CẦN CHỐT

Duyệt cách dùng JSON chuẩn + JS/Python adapters và vị trí quản trị các giá trị luật trước triển khai. Admin tiếp tục quản lý thông tin địa điểm/sự kiện; không tự mở quyền sửa đáp án/thưởng trong admin. Việc giữ Django không đồng nghĩa đã duyệt chuyển ví Node sang Django.
