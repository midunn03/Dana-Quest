# Rà soát bảo mật ngày 2026-11-02

Phạm vi: bản local `Dana-Quest-nhanh-dung`, Node server và Django backend; không rà hai bản sao publish, không kiểm chứng cấu hình hosting đang chạy. Không push hoặc deploy.

## Đánh giá lại năm mục

| Mục | Trước bản sửa | Sau bản sửa | Bằng chứng và diễn giải |
| --- | --- | --- | --- |
| Database / quyền sở hữu | PASS | PASS | `backend/game/views.py:68` kiểm tra phiên; dòng 75 giới hạn bản ghi theo user. `backend/game/quest_views.py:44` và dòng 69 lọc theo user. `server/auth.mjs:154` trở đi dùng ID từ phiên phía server để chọn dữ liệu. SQLite và JSON không có RLS riêng; API là lớp kiểm soát tương đương. Catalog công khai, review công khai, leaderboard tự nguyện và quyền quản trị là ngoại lệ có chủ đích. |
| File storage | PASS — đính chính FAIL trước | PASS | `backend/game/models.py:60` lưu ảnh nhiệm vụ trong database; `backend/game/views.py:30` lọc ảnh theo user. Node lưu ảnh trong `.data/players` ngoài thư mục web và đọc qua API đã xác thực. `backend/pixels/views.py:16` trả URL ảnh danh mục công khai, do admin quản lý; không phải ảnh người chơi bị lộ. Chưa có tính năng chia sẻ ảnh riêng bằng link, nên không có link chia sẻ riêng cần hết hạn. |
| Login / quyền truy cập server | PASS — đính chính FAIL trước | PASS | `backend/game/views.py:68`, `backend/game/quest_views.py:20`, `server/auth.mjs:154` trở đi kiểm tra phiên trước truy cập riêng tư. Các guard tại `src/App.tsx:65` hỗ trợ giao diện; dữ liệu riêng vẫn do server bảo vệ. Trang dùng hash route, không gửi phần hash lên server. Việc tải shell/mã React công khai tự nó không phải lỗ hổng truy cập dữ liệu; không cần chuyển toàn bộ app sang server rendering để sửa mục này. |
| Secrets | PASS trong mã đã kiểm tra | PASS trong mã đã kiểm tra | `server/places.mjs:19` lấy Google key từ môi trường server; `src/lib/auth.ts:14` chỉ công khai địa chỉ API. `backend/config/settings.py:25` yêu cầu secret production, chỉ cho khóa phát triển khi DEBUG=1. Không tìm thấy credential thật theo các mẫu đã quét trong source, public, tài liệu và `.env.example`; không phải chứng nhận tuyệt đối cho mọi commit lịch sử hoặc secret trên hosting. |
| Rate limits | FAIL có bằng chứng | PASS cho kiến trúc một máy hiện tại | `server/api-rate-limit.mjs:67`, `server/auth.mjs:105`, `backend/accounts/rate_limits.py:37`, `backend/accounts/views.py:156`. Kiểm thử trước sửa chứng minh route không chặn yêu cầu thứ 11, Django vẫn đăng nhập sau năm lần sai và Places gọi upstream ba lần khi cache miss đồng thời. |

## Các lỗi đã sửa

1. **API không có giới hạn chung.** Rủi ro: một client có thể gây quá tải và tiêu tốn quota dịch vụ ngoài. Thêm 120 yêu cầu/phút/IP cho tất cả API, thêm 120/phút cho tài khoản đã xác thực và ngân sách chung 10/phút/IP cho Navigation + Places; gắn middleware vào production, Vite dev và Vite preview. URL HTTP dạng tuyệt đối cũng bị tính cùng ngân sách.
2. **Bộ đếm Node chỉ ở RAM.** Rủi ro: restart hoặc nhiều tiến trình làm mất/chia nhỏ giới hạn đăng nhập và thao tác nhạy cảm. Chuyển sang SQLite trong `.data`, giao dịch nguyên tử, chia sẻ bộ đếm và lượt kiểm tra mật khẩu đang chờ giữa các tiến trình cùng máy; giữ hành vi năm lần sai/15 phút và đặt lại sau đăng nhập đúng.
3. **Django login không có throttle.** Rủi ro: bot có thể thử mật khẩu liên tục qua tên đăng nhập/email và nhiều IP. Thêm bảng `ApiRateBucket`, middleware theo IP/user và giới hạn login năm lượt/15 phút theo ID tài khoản chuẩn hóa; email và username dùng chung ngân sách. Khác Node, Django tính cả lượt đăng nhập thành công trong cửa sổ này.
4. **Places cache không gộp yêu cầu đang chờ.** Rủi ro: nhiều cache miss đồng thời cho cùng địa điểm tạo nhiều lần gọi có phí. Dùng một promise đang chờ cho mỗi địa điểm, xóa khi hoàn tất/thất bại, thêm timeout upstream 10 giây và giữ cache 15 phút.

Quá ngưỡng trả 429 + `Retry-After`; lỗi kho đếm từ chối yêu cầu thay vì cho qua. File counter không chứa mật khẩu/token thô. Migration Django đã áp dụng local; database local trước đó là file rỗng 0 byte, dữ liệu tài khoản Node trong `.data` không chuyển đổi.

## Giới hạn triển khai

- Node cần Node 24 như `render.yaml`. SQLite chỉ chia sẻ được giữa các tiến trình dùng cùng thư mục dữ liệu trên một máy. Multi-host/container hoặc hosting dùng đĩa tạm cần kho đếm dùng chung bền vững, ví dụ Redis; kết quả PASS không áp dụng tự động cho kiến trúc đó.
- Django dùng cùng database để chia sẻ counter giữa worker. Môi trường khác cần áp dụng migration `accounts/0003_apiratebucket` trước khi chạy code mới.
- Không tin `X-Forwarded-For` mặc định. Node chỉ dùng khi `TRUST_PROXY=1` và proxy được cấu hình an toàn; Django yêu cầu ingress tin cậy đặt `REMOTE_ADDR`. Nếu proxy không cung cấp IP đúng, nhiều người có thể dùng chung ngân sách IP.
- Ảnh danh mục là public có chủ đích; nếu sau này có chia sẻ ảnh riêng, phải thêm authorization và link ký có thời hạn. Hiện tại không đưa ảnh nhiệm vụ vào `/media`.

## Kiểm chứng

- Đã quan sát kiểm thử FAIL trước sửa cho rate limit Node, login Django và gộp cache miss Places.
- Kiểm thử mới: counter giữa hai tiến trình, thời hạn, reservation login, header IP giả, lỗi kho đếm, API dạng absolute URL, giới hạn tài khoản qua nhiều IP và alias email/username.
- Django: 44/44 kiểm thử qua; kiểm tra migration không còn thay đổi model chưa ghi nhận.
- `npm run build`: PASS.
- Lint các file JavaScript/TypeScript thuộc bản sửa: PASS. `npm run lint` toàn thư mục còn ba lỗi rules-of-hooks trong `.agents/skills/design-taste-frontend/scripts/assets.mjs` có sẵn, ngoài mã ứng dụng và ngoài phạm vi bản sửa; không thay đổi các skill đó.
- JavaScript: `npx vitest run --maxWorkers=2` PASS, 72 file và 258/258 kiểm thử. Lượt mặc định trước đó có một ca giao diện timeout 5 giây; lượt xác minh cuối không đổi timeout và đã qua toàn bộ.
