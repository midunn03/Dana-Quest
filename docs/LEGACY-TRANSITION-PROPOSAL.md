# G2 — Lộ trình thay legacy theo từng lát

Ngày31/10/2026. **CHỈ ĐỀ XUẤT.** Không xóa route/component, không chuyển tiến độ hoặc viết lại storage trong nhóm G.

## Hiện trạng cần giữ đúng

- Legacy v1: chọn5–10 nhiệm vụ, đánh dấu địa điểm hoàn thành ở≥80%,10xu mỗi nhiệm vụ. Device lưu IndexedDB `dana-quest-local` version1, stores `state`/`photos`, state key `main` (`src/lib/storage.ts`). Account gửi `/api/auth/game`.
- Quest v2 đã có `QuestProgressState {version:2,legacy,quests}`. `newQuestState`/`migrateQuestState` trong `src/lib/questProgress.ts` bọc v1 thành `legacy`; **không** biến nhiệm vụ tự xác nhận thành checkpoint giải đố đã được chứng minh.
- Device v2 dùng localStorage `dana-quest-progress-v2`; account v2 dùng `/quest-runs` qua `useQuestProgress`. Hai nguồn browser có thể chứa bản cũ khác nhau; không chọn bản mới hơn chỉ bằng timestamp rồi ghi đè.
- `shared/quest-challenges.mjs` và adapter Django đã có nâng catalog DUE cũ2checkpoint lên catalogVersion2: giữ `previousCompletionAt`, bỏ trạng thái kết thúc cũ để mở các phần mới. Không chạy lại hoặc thay logic upgrade đang có trong bước đề xuất này.
- Node wallet đã phân biệt nguồn `legacy:<destination>:<mission>` và `quest:<quest>:<checkpoint>`, coi legacy nhúng là bản lịch sử, chặn nguồn không khớp bằng reconciliation. Không xây ví thứ hai hay coi mọi bản v1 là nguồn xu mới.

## Lộ trình đề xuất

| Lát | Việc làm sau khi được duyệt | Điều kiện qua lát |
| --- | --- | --- |
|0 — khảo sát/mapping | Kiểm kê schema và route bằng fixture giả, lập bảng địa điểm→quest và mission→checkpoint do người viết nội dung duyệt | Không mặc định ánh xạ1:1; IDs lịch sử/không còn catalog được giữ trong archive |
|1 — chuyển trong bộ nhớ | Hàm thuần nhận bản v1, bản v2 có thể đã tồn tại, mapping đã version và trả candidate + conflicts + provenance | Không ghi storage, không tự đánh dấu đến nơi/giải đúng/tạo reward |
|2 — shadow preview | Xem trước candidate cạnh bản gốc; snapshot/hash phiên bản nguồn và liệt kê record không thể chuyển | Không sửa khóa/API hiện tại; vị trí shadow storage và schema mới phải được duyệt riêng |
|3 — ghi có kiểm soát | Sau sao lưu được xác nhận: transaction hoặc atomic swap với source-revision check, migration marker và biên bản đối chiếu | Source thay đổi thì hủy/retry, không ghi đè bản đang được tab khác chơi; chạy lại là no-op |
|4 — v2 là luồng bắt đầu mới | Dẫn người chơi mới vào truyện; giữ route legacy để đọc/tiếp tục các lượt cũ theo chính sách được duyệt | Desktop/mobile tương đương; guard rời quest/tiếp tục/chưa login giữ nguyên |
|5 — ngừng bắt đầu legacy | Chỉ sau quyết định riêng của chủ dự án, dữ liệu cũ vẫn xem/export và có đường phục hồi | Không xóa component/route trước khi có thay thế và kiểm tra toàn bộ deep links |

Khung v2 hiện có được dùng làm nền; không phát minh version3 hay đổi keys chỉ vì đang lập lộ trình. Marker/provenance mới ưu tiên metadata do server sở hữu; schema chính xác và nơi lưu cần chốt ở đợt implementation.

## Quy tắc chuyển và chống cộng thưởng lặp

1. Giữ nguyên nguồn gốc owner, mission ID, checkpoint ID, completion timestamps, receipt và ảnh. Ảnh là dữ liệu riêng; không copy base64 sang localStorage hay chuyển quyền giữa tài khoản.
2. Mission legacy hoàn thành không tự chứng minh đáp án checkpoint mới. Mặc định trình bày như lịch sử đã chơi, cho bắt đầu câu chuyện mới; chỉ mapping có bằng chứng tương đương và được duyệt mới có thể gợi ý tiến độ.
3. Nếu completion mới đại diện đúng công việc cũ, liên kết tới **nguồn credit legacy đã tồn tại**, không phát thêm credit có ID quest mới cho cùng bằng chứng. Nếu là thử thách mới thực sự, chính sách thưởng cần được chủ dự án chốt trước.
4. Bản `quests.legacy` nhúng không cộng thêm lên `/game`. Hai bản bất đồng hoặc thiếu bằng chứng thì giữ cả hai, đánh dấu cần đối chiếu; không cộng tổng hoặc xóa âm thầm.
5. Receipt/debit cũ không biến mất khi chuyển hay rollback. Nếu nguồn từng credit bị thiếu/đổi giá, ví tiếp tục reconciliation thay vì reset số dư.
6. Local completion có thể bị sửa từ browser. Không import nó thành xu/XP/xếp hạng authoritative chỉ vì đã chuyển schema. Giữ local v2 hay bỏ là quyết định A4 riêng.

## Test và rollback đề xuất

- Fixtures: v1 chưa chơi/đang chơi/đủ80%/đã đổi voucher; ảnh có/không; missing optional timestamp; địa điểm lịch sử; JSON hỏng; v2 đã tồn tại; DUE đã nâng catalog; owner đổi giữa yêu cầu.
- Chuyển hai lần/reload/retry/concurrent tab phải có cùng kết quả, cùng số credit/receipt. Ví sau chuyển giữ số dư đã kiểm chứng; không tăng vì bản nhúng trùng.
- Ghi lỗi/quota hết/DB bận/nguồn đổi revision: không thay bản gốc, không có nửa migration; ảnh và receipt nguyên vẹn.
- Rollback phục hồi snapshot nguồn và marker của **cùng migration**, giữ log thưởng/receipt phát sinh sau đó để đối chiếu. Không restore mù toàn ví cũ làm mất debit mới hoặc cho đổi quà lại.
- Kiểm tra mọi deep link legacy và guard quest, mobile/desktop; giữ tests hiện tại xanh. Không sửa expectations để hợp thức hóa mất tiến độ.

## CẦN CHỐT

Chính sách tiếp tục các lượt legacy đã bắt đầu, ánh xạ nội dung, xử lý local/offline và thưởng khi trải nghiệm tương đương. Chưa có quyết định loại bỏ legacy; chưa có phép di chuyển dữ liệu thật. Quyết định giữ Django cho admin không tự chọn hệ thống ví/persistence cuối cùng.
