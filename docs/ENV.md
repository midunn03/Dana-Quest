# Environment Setup — Dana Quest

> Biến liệt kê dưới đây được **đối chiếu trực tiếp với source** (`server/index.mjs`, `server/auth.mjs`,
> `server/navigation.mjs`, `server/places.mjs`, `vite.config.ts`) ngày 28/10/2026. Không biến bắt buộc nào
> phải đặt trước khi chạy Node local. Django có yêu cầu riêng bên dưới (cập nhật 31/10/2026).

## Required variables

Node local không có biến bắt buộc. Django production bắt buộc `DJANGO_SECRET_KEY`. Các biến Node tùy chọn:

`API_PORT`
- Purpose: cổng của server API chạy độc lập (`npm run api`).
- Mặc định: `3001`.
- Secret: không.

`API_HOST`
- Purpose: địa chỉ bind của server API độc lập.
- Mặc định: `127.0.0.1`.
- Secret: không.

`TRUST_PROXY`
- Mặc định `0`; chỉ đúng `1` mới dùng IP từ `X-Forwarded-For`. Khi tắt luôn dùng socket, bỏ qua header client tự gửi.
- Khi bật: dùng IP trái nhất của chuỗi hợp lệ (tối đa 16 địa chỉ IP, 1024 ký tự); header sai quay về socket. Chuẩn hóa IPv6/IPv4-mapped để không tạo nhiều hạn mức cho một IP.
- Chỉ bật khi proxy tin cậy **ghi đè/xóa header X-Forwarded-For đầu vào**, và client không thể truy cập origin bỏ qua proxy. Không tự bật trên Render chỉ vì có proxy; kiểm chứng chuỗi header thực tế trước. Xem [hướng dẫn proxy Express](https://expressjs.com/en/guide/behind-proxies/).
- Giữ hạn mức IP 15 lần/phút. Thêm tối đa 5 lần sai liên tiếp/tài khoản trong cửa sổ 15 phút, dùng chung username/email và mọi IP; đăng nhập đúng xóa số lần sai. Yêu cầu đang xử lý cũng giữ chỗ để chống vượt hạn mức đồng thời. Hạn mức còn trong RAM và mất khi khởi động lại.
- Các nhóm IP/account/sensitive/codes dùng chung trường `expires`, được dọn khi có yêu cầu xác thực tiếp theo.

## Django: cấu hình an toàn và kiểm tra biệt lập

Quyết định31/10/2026: **giữ Django để quản lý thông tin bằng admin**. Cấu hình dev hiện vẫn hybrid: Node xử lý `/api/auth`, Vite proxy `/api/pixel`, `/api/events`, `/media` tới Django8000. Việc thêm route Django không tự chuyển backend xác thực, không di chuyển tài khoản/phiên/tiến độ từ Node và không đổi proxy đang chạy.

- `DJANGO_DEBUG`: mặc định tắt; chỉ chuỗi `1` bật. Local có thể đặt `DJANGO_DEBUG=1` để dùng khóa phát triển. Không dùng giá trị này khi deploy.
- `DJANGO_SECRET_KEY`: bắt buộc khi debug tắt; thiếu/rỗng hoặc bằng khóa phát triển thì tiến trình báo lỗi rõ ràng. Cấp secret riêng qua môi trường triển khai, không ghi vào repo hay biến `VITE_*`.
- `DJANGO_ALLOWED_HOSTS`: danh sách host phân cách dấu phẩy, mặc định `127.0.0.1,localhost`.
- `DJANGO_CSRF_TRUSTED_ORIGINS`: danh sách origin đầy đủ scheme/port phân cách dấu phẩy; mặc định localhost và127.0.0.1 ở5173 và5174. Deploy cần danh sách HTTPS cụ thể.
- Cơ sở cấu hình: [Django deployment checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/).
- API riêng `/game`, `/profile`, `/profile/avatar`, `/logout` yêu cầu `X-Dana-User` trùng tài khoản cookie; tab cũ nhận409. `/session` cho phép thiếu header để tìm chủ phiên ban đầu; nếu gửi header sai vẫn bị từ chối.
- Kiểm tra: `python backend/manage.py test accounts game --settings=config.test_settings`. Module này chỉ dùng SQLite trong bộ nhớ và MEDIA_ROOT trong TEMP; không dùng database/ảnh thật. Xem [Django test database](https://docs.djangoproject.com/en/5.2/topics/testing/overview/#the-test-database).
- Migration nguồn `game/0002_gamestatebackup.py` thêm bản sao tiến độ trước reset. Chỉ đã chạy trong DB test; **chưa migrate database thật**. Trước khi triển khai backend Django, chủ dự án cần sao lưu và duyệt áp dụng migration riêng. Nếu chưa có bảng sao lưu, reset từ chối503 và giữ dữ liệu cũ.
- Reset áp dụng snapshot state/ảnh hỏng; sao lưu JSON/revision/ảnh trong cùng transaction, giữ nguyên bytes và timestamp ảnh. Cơ chế cách ly ở mục bổ sung bên dưới. Trạng thái hỏng bị chặn422 ở mọi thao tác game khác. Luật chấm/thưởng không đổi.

### Bổ sung Django được giữ lại —31/10/2026

- Migration nguồn mới: `game/0003_gamestatebackup_photos_questactivationcode_and_more.py`, `game/0004_gamephoto_quarantined.py`. Thêm snapshot ảnh trong backup, tiến độ quest v2, mã kích hoạt băm, hạn mức thử mã và cờ cách ly ảnh lỗi. **Chưa áp dụng lên database thật**. Các trang/model mới cần schema được chủ dự án triển khai sau khi sao lưu/duyệt; không coi source migration là đã deploy.
- Reset kiểm tra cả state và ảnh. Sao lưu toàn bộ JSON/revision/ảnh trước thay đổi. Nếu chỉ ảnh lỗi, giữ tiến độ/timestamp vẫn hợp lệ; ảnh lỗi hoặc vượt40 ảnh được cách ly khỏi album/kiểm chứng nhiệm vụ, giữ nguyên bytes/timestamp trong DB và backup. Album hợp lệ vẫn đọc được sau reset; lặp reset trên snapshot khỏe bị400.
- Admin địa điểm/sự kiện vẫn dùng quyền staff/model và CSRF, không ép form admin gửi X-Dana-User. Trang xem tiến độ quest/backup/mã mới là chỉ đọc, tránh sửa thẳng qua guard gameplay. Không thêm giao diện phát mã hoặc migration dữ liệu mã cũ trong nhóm này.
- `/api/pixel/places`, `/api/events/feed` vẫn công khai, chỉ GET; không yêu cầu đăng nhập/header. Nếu phiên đã đăng nhập và gửi header owner sai thì409 trước xử lý, kể cả POST; POST đúng owner vẫn405, không có API ghi công khai. Nội dung tiếp tục được sửa qua admin.
- Django thêm `GET/POST /api/auth/quest-runs`, `GET /api/auth/quest-codes`, `POST /api/auth/quest-codes/redeem`. Mọi endpoint riêng này yêu cầu header owner đúng; trả409 `Tài khoản đã thay đổi. Hãy tải lại trang.` theo quest-runs Node. Ngoại lệ bảo mật có chủ đích: Node quest-codes hiện chưa bắt buộc header; Django bắt buộc để đáp ứng yêu cầu chống tab cũ. Các payload/status/message luồng bình thường đã đối chiếu Node HTTP bằng dữ liệu giả.
- Thử mã giới hạn10/phút/tài khoản, lưu DB. Mã lưu SHA-256, cùng chuẩn DQ24ký tự hex, chuẩn hóa khoảng trắng/dấu gạch, hết hạn/thu hồi/mã đã dùng và retry cùng owner theo Node. Mã từng dùng nhưng chủ bị xóa không được kích hoạt lại.
- Quest v2 giữ tự xác nhận đến điểm bắt đầu (visual), không thêm GPS. Server tự chấm; bỏ qua photoAvailable client. Các giá trị thưởng/catalog và API kết quả không đổi. Chưa bổ sung Django wallet/account-features/community parity hoặc phát thưởng thật.
- SQLite bỏ qua select_for_update; conditional claim chặn đổi chủ mã, lỗi tranh chấp DB trả503 JSON sau rollback để client thử lại. Không tuyên bố đã kiểm thử tải nhiều người dùng.
- Chạy test: `python backend/manage.py test accounts game pixels events --settings=config.test_settings`. Test contract cần Node có trong PATH (hoặc `DANA_TEST_NODE` trỏ tới executable), tạo HTTP server và file giả trong TEMP rồi dọn; không dùng `.data/` hoặc database/media thật. Test đối chiếu grader qua toàn bộ catalog không thay thế xác minh nội dung16quest ngoài thực địa(O-09).

`DANA_PRESENTATION_EVENTS`
- Purpose: bật công cụ sự kiện trình diễn (operator) cho tài khoản báo cáo. Chỉ đặt đúng `1` để bật.
- Mặc định: tắt (không đặt). Giữ cooldown 5 phút của công cụ, không tắt cooldown để ép thông báo liên tiếp.
- Secret: không.

`VALHALLA_URL`
- Purpose: dịch vụ tính tuyến đi bộ (`/api/navigation/route` sẽ gọi `new URL('route', VALHALLA_URL)`).
- Mặc định: `https://valhalla1.openstreetmap.de/`.
- Secret: không, nhưng là dependency ngoài — lỗi mạng nhà cung cấp phải được UI xử lý, không phải lỗi người dùng.

`GOOGLE_MAPS_API_KEY`
- Purpose: dùng trong `server/places.mjs` cho thông tin tham quan. Tùy chọn; dự án ưu tiên catalog biên tập có nguồn, không mua API.
- Secret: **có** (nếu có). Chỉ chạy phía server, không bao giờ expose vào bundle trình duyệt.

`GITHUB_ACTIONS`
- Purpose: CI của GitHub tự đặt. Khi đúng chuỗi truthy, `vite.config.ts` đổi `base` thành `/Dana-Quest/`.
- Secret: không.

`VITE_AUTH_API_URL`
- Purpose: **KHÔNG dùng nữa.** Dịch vụ tài khoản đã tích hợp vào Vite tại `/api/auth`. Nếu từng đặt biến này (kể cả rỗng), hãy bỏ đi rồi khởi động lại Vite.
- Secret: không.

## Local setup
1. `npm.cmd install`.
2. Dev app: `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort` — API tài khoản tự gắn tại `/api/auth`, không cần chạy server thứ hai.
3. API độc lập (khi cần): `npm.cmd run api` (mặc định `127.0.0.1:3001`); reverse proxy `/api/*` về tiến trình này nếu tách origin.
4. Khởi động lại app sau khi đổi biến môi trường.
5. Kiểm tra: mở `http://127.0.0.1:5173/#/dang-ky`, đăng ký được tài khoản là API tài khoản hoạt động.

Không cần file `.env` cho local mặc định. Tạo `.env.example` (đã có trong repo) chỉ để tham chiếu tên biến, giá trị placeholder.

## Data storage (không phải biến môi trường nhưng gắn với môi trường chạy)
- `.data/accounts.json` — tài khoản; `.data/players/` — tiến độ/ảnh theo tài khoản; `.data/` đã bị `.gitignore` chặn và Vite chặn phục vụ qua HTTP.
- Mật khẩu băm scrypt với salt riêng; phiên là session RAM — **restart server làm mất phiên** (tài khoản vẫn còn).
- File JSON chỉ bền khi filesystem bền; khi triển khai (Render free) cần kho dữ liệu bền vững thay filesystem tạm.

## Example file: .env.example
```
# Chỉ là placeholder — local mặc định không cần đặt biến nào
API_PORT=3001
API_HOST=127.0.0.1
# DANA_PRESENTATION_EVENTS=1
# VALHALLA_URL=https://valhalla1.openstreetmap.de/
# GOOGLE_MAPS_API_KEY=<your-key-if-ever-needed>
```

## Git exclusions (đã có trong `.gitignore`, giữ nguyên)
```
.env
.env.*
!.env.example
*.pem / *.key / *.pfx / *.p12
.data/
```

## Preview and production
- `npm run build && npm start` phục vụ cả `dist` và API cùng domain; `render.yaml` là cấu hình mẫu Render.
- Set biến trong cấu hình hosting; không dùng dữ liệu production cho test local.
- Production cần HTTPS (định vị, camera, cookie), backend chạy liên tục và kho dữ liệu bền.
- Không commit `.data`, ảnh người dùng thật, hoặc secret; nếu secret lộ, rotate ngay.

## Validation and secret handling
- Chỉ `VITE_*` được nhúng vào bundle frontend — tuyệt đối không đặt secret vào biến `VITE_*`.
- Log ghi tên biến, không ghi giá trị secret; lỗi server không lộ stack/đường dẫn nội bộ cho người dùng.
- Commit `.env.example` với placeholder, không bao giờ giá trị thật.

## Giới hạn API (2026-11-02)
- Node yêu cầu Node 24 như `render.yaml`; bộ đếm SQLite nằm tại `.data/rate-limits.sqlite3`, không phục vụ qua HTTP và không commit.
- Tất cả API: 120 yêu cầu/phút/IP; API tài khoản còn có 120 yêu cầu/phút/tài khoản đã xác thực. Navigation và Places dùng chung ngân sách 10 yêu cầu/phút/IP.
- Node login: tối đa 5 lần sai hoặc đang kiểm tra trong 15 phút/tài khoản; đăng nhập đúng đặt lại số lần sai. Ngân sách đăng ký/login theo IP vẫn là 15/phút. Các bộ đếm này được lưu trên đĩa.
- Django: 120 yêu cầu/phút/IP và tài khoản; login/register 15/phút/IP; login 5 lượt/15 phút/tài khoản, dùng chung cho tên đăng nhập và email.
- Quá ngưỡng trả HTTP 429 và `Retry-After`. Kho đếm không khả dụng thì yêu cầu bị từ chối, không được bỏ qua giới hạn.
- Django cần chạy `python backend/manage.py migrate --noinput` với cấu hình môi trường hợp lệ khi triển khai phiên bản này. Migration local đã được áp dụng trong lần rà soát.
- Node chia sẻ bộ đếm giữa các tiến trình dùng cùng thư mục `.data` trên một máy. Khi chạy nhiều máy/container hoặc filesystem tạm, phải chuyển sang kho đếm dùng chung, bền vững (ví dụ Redis); không chia sẻ SQLite qua filesystem mạng.
- Không bật `TRUST_PROXY=1` nếu proxy chưa ghi đè header chuyển tiếp và origin còn truy cập trực tiếp được. Django bỏ qua `X-Forwarded-For`; ingress tin cậy cần đặt `REMOTE_ADDR` đúng.
- Ảnh danh mục trong `/media/` là nội dung công khai do quản trị viên tải lên. Ảnh nhiệm vụ được lưu riêng theo tài khoản và lấy qua API kiểm tra phiên; hiện không có tính năng chia sẻ ảnh nhiệm vụ bằng link.
