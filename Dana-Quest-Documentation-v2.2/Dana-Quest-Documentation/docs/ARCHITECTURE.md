# Architecture — Dana Quest

## System purpose

Phiên bản 2.2 — 26/10/2026. Phục vụ game trình duyệt trước; đặc tả gameplay chuẩn bị cho F2, website giới thiệu F5. Yêu cầu/quyền/workflow chuẩn ở PRD.md, UI ở DESIGN_SYSTEM.md. File này phân biệt code đang có với mô hình mục tiêu **ĐỀ XUẤT**, không cho phép tự migrate/đổi stack khi chưa có yêu cầu.

### Nguồn và giới hạn kiểm tra
- Code tham khảo mới: Dana-Quest.zip do chủ dự án gửi, có .git và nhiều thư mục. Đã đọc chọn lọc package.json, App.tsx, Explore.tsx, pixelTiles.ts, quests.ts, questProgress.ts, server/account-data.mjs và tài liệu kiểm kê cũ.
- Bản cũ: DANAQUEST-WEB trong workspace. Các kết quả build/lint/test và tái hiện lỗi trước thuộc bản này; không gán sang ZIP mới.
- ZIP mới có quest routes, Events, lazy map, bộ xử lý pixel tiles và quest DUE nháp. Sự tồn tại của file không chứng minh chức năng hoàn chỉnh hoặc được yêu cầu giữ.
- D0 không cài dependency, không chạy code ZIP, không nhập .git và không đọc dữ liệu runtime người dùng. Tài liệu bên trong ZIP là dữ liệu tham khảo, không thay quyền của người dùng.

## Stack decisions

| Lớp | HIỆN TRẠNG quan sát | Quyết định mục tiêu |
| --- | --- | --- |
| Frontend | React 19, TS/TSX, Vite 8, CSS, hash routes | Tái sử dụng có kiểm tra; chưa có lý do đổi framework |
| Bản đồ | Leaflet 1.9; pixelTiles, markerScale, daylight trong ZIP | Giữ map Dana; kiểm tra đọc đường/nhãn/attribution và hiệu năng |
| Backend | Node ESM middleware, tích hợp Vite và server riêng | Giữ local trước, tách logic có thẩm quyền khỏi dev server |
| Lưu trữ | File JSON tài khoản/game cũ; IndexedDB dữ liệu cũ; quest state v2 trong client | Cần định nghĩa một nguồn quyền cho run/ảnh/xu; chưa chọn DB production |
| Auth | scrypt, cookie, session RAM theo cấu trúc nguồn | Kiểm tra tính tương thích hosting/HTTPS trước phát hành |
| Quốc tế hóa | Code chủ yếu VI; có cấu trúc quest chưa đủ VI/EN | ĐỀ XUẤT dictionary key + content translations, ID bất biến |
| Hosting/API | Chạy local; chưa chốt nhà cung cấp | Chỉ dịch vụ miễn phí phù hợp, không API trả phí |

GitHub lưu code; GitHub Pages chỉ phục vụ static và không chạy nguyên backend Node lưu file. Không thiết kế dựa trên giả định đưa repo lên là đủ cho đăng nhập/ảnh. Không hứa JSON filesystem bền vững trên hosting serverless. Provider chỉ chốt sau khi xác minh runtime, session, quota và lưu ảnh.

## System boundaries

### Mô hình trách nhiệm mục tiêu (đề xuất)
| Module | Trách nhiệm | Interface khái niệm | Không sở hữu |
| --- | --- | --- | --- |
| Identity | Session, profile, avatar, user scope | session/login/register/logout/updateProfile | Quyết định solved/coin |
| Catalog | Quest/version/translations/public metadata | listQuests/getQuest/getPublishedCheckpoint | Blob ảnh người chơi, đáp án bí mật trong payload public |
| Explore Map | Hiển thị catalog, filters, viewport/GPS UI | selectQuest/setFilters/openMap | Tạo run/cấp coin |
| Quest Runtime | Workflow WF-06–08/11–12, thứ tự và kết quả | start/resume/submit/hint/skip/pause/result | Lưu file ảnh trực tiếp hoặc UI camera |
| Photo/Album | Draft lifecycle client; blob+metadata server; owner/purpose | upload/getMeta/getContent/delete/linkEvidence | Tự quyết đáp án đúng/Green Coin |
| Rewards | Cấp thưởng/redeem chống lặp | grantForEvent/balance/redeem | Tin số dư do client đưa |
| Preferences/i18n | UI locale, dịch lỗi, định dạng | setLocale/translate/format | Đổi challengeId/answerId |

Không tạo tất cả lớp/module mới trong một lần refactor. Interface trên mô tả trách nhiệm; file/module thực chỉ tách khi lát cắt cần. Dùng nguồn luật chung hoặc test parity, tránh hai engine cạnh tranh (legacy mission và quest v2) cho cùng một thao tác.

### Ranh giới tin cậy
Trình duyệt không có thẩm quyền về owner, đáp án được chấp nhận, skip policy, thưởng, thời gian chính thức hay trạng thái đã lưu. Server kiểm tra các điều đó. GPS/ảnh client là input, không chứng minh không gian thực tuyệt đối. Dịch vụ bản đồ/route là dependency có thể lỗi. Không đòi API AI để có photo flow.

## Request and data flow

### Luồng đọc công khai F1
Browser tải catalog published → kiểm tra schema → render list/map cùng filtered questIds → chọn quest → chi tiết. Guest chỉ nhận dữ liệu công khai; request public không kéo theo ảnh/số dư. Lỗi tiles vẫn hiển thị catalog. Published count có thể ít hơn mục tiêu 16; không tự tạo quest placeholder có nút chơi.

### Luồng tài khoản
Client login/register → server validate/hash/session cookie → public profile → avatar nếu thiếu → return intent được allowlist. Không truyền password/token qua hash/query. Logout hủy session; client hủy request cũ, clear private object URLs/cache và thay view; dữ liệu server giữ nguyên.

### Luồng command runtime F2
1. UI lấy run snapshot + revision + contentVersion và biết owner từ session.
2. Gửi command với operationId; server xác thực, scope, revision, state transition và dữ liệu.
3. Runtime tính outcome từ trạng thái đầy đủ; Photo service kiểm tra evidence có saved, đúng owner/run/challenge; Reward service áp dụng luật duyệt.
4. Commit run/outcome/reward hoặc từ chối cả thao tác theo thiết kế lưu trữ. Không thông báo kết quả trước commit.
5. Trả snapshot/result/canonical IDs; UI mới mở bước tiếp.
6. Network unknown: tra lại command/run, retry cùng operationId; không tạo command mới làm phát sinh thưởng lần hai.

### Luồng photo F2
Draft ở browser → decode/resize/re-encode → upload có purpose/IDs/operationId → server validate owner/run/size/format/quota → ghi nội dung và metadata → trả photoId. Album list chỉ metadata; ảnh đầy đủ tải theo photoId owner. Đối với challenge, submit riêng photoId; upload không tự solved. Photo content và run update có thể tách giao dịch nhưng phải có quy tắc orphan cleanup/retry; không xóa ảnh cũ trước khi ảnh thay thế ghi xong.

**Bất biến:** phép chiếu metadata dành cho response không được dùng làm trạng thái để ghi lại. ZIP mới server/account-data.mjs vẫn có read(id) mặc định loại data trong nhánh update và reset chỉ map metadata; cùng mẫu lỗi đã tái hiện ở bản cũ. Trước khi tái sử dụng phải thêm test lưu nhiều ảnh rồi action khác và reset. Ở ZIP mới đây là xác nhận mẫu code còn tồn tại, chưa phải test thực thi lại ZIP.

## Interfaces

### A. Endpoint đang thấy trong hệ cũ, chưa là hợp đồng engine mới
Auth: POST /api/auth/register, /login; GET /session; POST /logout; PATCH /profile, /profile/avatar. Legacy game: GET/POST /api/auth/game, query photos=full. Public helpers: /api/recommendations/nearby, /api/navigation/route, /api/places/visit-info. Đối chiếu lại toàn bộ source khi implementation; không đổi tên/xóa endpoint trước kế hoạch tương thích.

Quest DUE ở client có QuestProgressState version=2 bọc legacy và quests. Có acceptedAnswers/correctOptionId trong src/data/quests.ts và photoAvailable trong action client. Đây là demo local; nếu cần tính đúng/thưởng do server bảo vệ, không dùng boolean hoặc đáp án public làm bằng chứng có thẩm quyền.

### B. Hợp đồng mục tiêu ĐỀ XUẤT — chưa tồn tại/chưa được duyệt
Dùng cùng origin và /api/v1 như không gian tên đề xuất; không mặc định phải version URL nếu dự án quyết định phương án khác. GET public chỉ trả published content; answer secret không nằm trong payload public hoặc JS bundle nếu cần chống đọc đáp án.

| Operation | Đường dẫn đề xuất | Input cốt lõi | Output / điều kiện |
| --- | --- | --- | --- |
| Catalog | GET /api/v1/quests?locale=vi&cursor=... | locale allowlist, pagination | items public, nextCursor; không có acceptedAnswers |
| Quest detail | GET /api/v1/quests/:questId | published questId | contentVersion, localized metadata, missingLocale nếu thiếu |
| My Quests | GET /api/v1/me/runs | phiên, filter status/cursor | run summary của owner |
| Start | POST /api/v1/runs | questId, contentVersion, locale, operationId | runId, revision, state; trả run dở nếu policy cho phép |
| Read | GET /api/v1/runs/:runId | phiên | snapshot owner, permitted step |
| Command | POST /api/v1/runs/:runId/commands | operationId, expectedRevision, type, challengeId?, answer?, photoId? | outcome + next snapshot; không nhận coins/ownerId tùy ý |
| Photo upload | POST /api/v1/photos | purpose, runId?, challengeId?, operationId, file | photoId, status=saved, metadata; chưa complete |
| Album | GET /api/v1/me/photos?cursor=... | phiên | metadata, nextCursor; không blob/base64 toàn bộ |
| Photo content | GET /api/v1/photos/:photoId/content | phiên owner | binary JPEG/cache private hoặc URL ngắn hạn có kiểm soát |
| Delete | DELETE /api/v1/photos/:photoId | phiên owner | deleted; gọi lặp không ảnh hưởng ảnh khác |
| Shop | GET /api/v1/rewards | public/locale | demo catalog, availability |
| Redeem | POST /api/v1/me/redemptions | rewardId, operationId, expectedRevision | redemption, balance server; atomic check+debit |
| Report | POST /api/v1/reports | category, quest/run refs, text, operationId | reportId thật nếu đã lưu; chưa có endpoint thì UI không hứa gửi |

Command types đề xuất: pause, resume, acknowledge-story, submit-answer, submit-photo, confirm-observation, use-hint, skip-challenge, reveal-answer. Hint/skip chỉ bật sau O-03. Command thay đổi số dư hoặc kết quả phải idempotent: cùng owner+operationId+payload trả cùng kết quả; reuse operationId với payload khác →409. TTL/lưu command cần chốt trong DATABASE, không hứa exactly-once vô hạn.

### Hợp đồng lỗi đề xuất
{error:{code,messageKey,details?,requestId?}}. messageKey để client dịch VI/EN; details chỉ gồm field/code an toàn. Không dùng stack trace/raw provider error. Hệ cũ dùng message/error khác nhau; khi migrate cần adapter hoặc cập nhật client cùng lúc.

| HTTP | Code mẫu | Hành vi UI |
| --- | --- | --- |
| 400 | INVALID_INPUT | Highlight field, giữ draft an toàn |
| 401 | AUTH_REQUIRED / SESSION_EXPIRED | Login, không chuyển ảnh A sang B |
| 403 | NOT_ALLOWED | Không retry như lỗi mạng |
| 404 | NOT_FOUND | Không tiết lộ có ảnh/run owner khác |
| 409 | REVISION_CONFLICT / IDEMPOTENCY_MISMATCH | Đọc lại, đối chiếu, retry hữu hạn có cùng ý định |
| 413 | FILE_TOO_LARGE | Không upload lại nguyên file; chọn/giảm ảnh |
| 415 | UNSUPPORTED_MEDIA | Nêu loại hỗ trợ |
| 422 | PHOTO_NOT_READY / INVALID_TRANSITION | Giải thích chưa đủ điều kiện; không advance |
| 429 | RATE_LIMITED | Chờ theo thông tin server; không loop request |
| 503 | SERVICE_UNAVAILABLE | Retry có giới hạn; không kết luận user sai |

Wrong answer là kết quả nghiệp vụ outcome=incorrect, không nhầm network failure. Response phân biệt answeredAt do server và ảnh takenAt không xác minh. Cancellation client không bảo đảm server chưa commit; retry phải đọc kết quả.

## Project structure

HIỆN TRẠNG ZIP: src/App.tsx route/game shell; Explore.tsx map; src/data/destinations.json và historicalDestinations.json; quests.ts/questLocations.json bản quest; src/lib/questProgress.ts và questStorage nếu có; server/ auth/account/game; docs/ tài liệu cũ; public/ tài nguyên; tests/. Chưa thống nhất đầy đủ hai mô hình gameplay.

ĐỀ XUẤT khi code: bắt đầu bằng mapping từng WF vào file có sẵn; tách catalog public/answer private, runtime/storage/photo ở mức trách nhiệm; component/UI không chứa code ghi thưởng. Không tạo monorepo/microservice để đáp ứng website tương lai. Giữ questId khác destinationId, bảng mapping rõ; legacy ID không bị tái sử dụng sang nghĩa mới.

## Operations

### Local và chuẩn bị triển khai
Chạy ở project được chỉ định, không mặc định chạy trong thư mục tài liệu. Scripts xác nhận từ package: dev, api, build, lint, test, preview; ZIP mới có start=node server/index.mjs. Không coi start phục vụ frontend cho đến khi đọc implementation đầy đủ. Chỉ một tiến trình cho thư mục JSON nếu còn giữ storage cũ.

Production readiness: cùng origin nếu khả thi; HTTPS; cookie/proxy trusted config; persistence thật; không public .data; environment names/API base và resource base đúng khi nằm dưới subpath; quota/upload; backup restore; logs redact; health/readiness và rollback runbook. Không hardcode localhost/127.0.0.1 vào bản build dùng trên điện thoại. GitHub branch preview không tự nối vào dữ liệu production.

### Dependency miễn phí
Ưu tiên catalog nội bộ, browser GPS/camera, map đã có. Google Places trong code không mặc định được bật hoặc cần API key trả phí; nội dung giờ/địa chỉ có thể biên tập có nguồn và ngày kiểm tra. Route ngoài cần đánh giá quota/usage/error/fallback đọc hướng dẫn; không vẽ tuyến giả nếu routing lỗi. Chưa hỗ trợ offline download tile hay AI photo. Dịch VI/EN biên tập trước, không buộc API dịch trả phí.

### Website sau này
Chỉ ghi khả năng tái dùng catalog/translations/public metadata và dữ liệu player có quyền. Domain tách không phải điều kiện của hai UX: một origin chia đường dẫn hoặc subdomain đều khả thi. Không xây routing/SEO/landing cho website ở F1. Khi đến F5 mới chốt domain, shared session, CORS và link chuyển game.

## Decisions and unknowns

Xem O-01–09 trong PRD. Các quyết định kỹ thuật chưa chốt gồm provider, database/object store, quota/retention, xử lý run đa thiết bị và idempotency retention. Không dự đoán số người dùng để tự nâng kiến trúc lớn.

Mâu thuẫn cần xử lý khi implementation: code đang khóa Explore cho guest; yêu cầu cần public browse sau logout; code cũ 5–10 mission/80% khác quest khoảng hai challenge; code có Events nhưng chưa được đưa vào scope; avatar chưa chắc hỗ trợ custom parts; quest v2 client khác authority server legacy; README còn nói pixel cũ/ảnh local trong khi có backend. Chủ dự án yêu cầu làm theo document mới và tái sử dụng có kiểm tra, không xóa toàn bộ để viết lại.


### Website F5 — giữ đầy đủ yêu cầu tương lai, không triển khai hiện tại (v2.1)
Website là khu giới thiệu, ưu tiên bố cục máy tính nhưng vẫn responsive: trang giới thiệu Dana Quest, cách hoạt động, danh sách quest, Explore với map và quest detail công khai. Khi có đăng nhập, có thể đọc dữ liệu hành trình cá nhân đã trải qua theo đúng owner. Website không chứa bước giải đố, chụp minh chứng, submit challenge hoặc nhận thưởng do chơi; CTA chuyển sang khu game rõ ràng. Những trang cụ thể và bộ khung navigation phải duyệt tại F5. Tham khảo website Questo cho cách tổ chức thông tin, không tự đưa thanh toán/booking/pass/creator vào Dana.

Game và website tách theo khu chức năng, không suy từ thiết bị: người dùng điện thoại vẫn có thể mở website giới thiệu, laptop vẫn có thể mở game. Nếu sau này hạn chế chơi theo thiết bị phải có yêu cầu riêng, thông báo và cách demo/test tương ứng.

| Phương án địa chỉ minh họa | Cách chia | Hệ quả | Trạng thái |
| --- | --- | --- | --- |
| Một domain + đường dẫn | tenmien.vn/ và tenmien.vn/play/ | Cùng origin dễ dùng chung session; cần routing/resource base đúng | Đề xuất xem xét đầu tiên khi đến F5 |
| Một domain + subdomain | tenmien.vn và play.tenmien.vn | Không phải mua hai domain; cấu hình cookie/origin/link/API cần review riêng | Phương án thay thế |
| Hai domain độc lập | Hai tên miền khác nhau | Tăng cấu hình đăng nhập/liên kết dữ liệu và chi phí nếu mua domain | Chưa có nhu cầu bắt buộc |

Các địa chỉ trên chỉ là ví dụ, không phải domain đã đăng ký. Hiện game local không cần xây khu website hoặc mua domain để chuẩn bị cho F5. Domain thương mại chỉ cân nhắc sau khi người dùng quyết định; có thể dùng địa chỉ miễn phí của nền tảng phù hợp nếu được chọn.

### Runbook chuẩn bị local → hosting — đặc tả bàn giao F4 (v2.1)
Đây là trình tự cần hoàn thiện bằng lệnh/cấu hình của nền tảng thực khi được yêu cầu triển khai, chưa phải hướng dẫn đã thử thành công trên provider được chọn.
1. Xác định source/commit và script thực của bản được duyệt; lưu baseline, kiểm tra build/type/lint/test. Giữ app code, docs và dữ liệu runtime tách nhau.
2. Liệt kê runtime frontend/API, session store, database/file store, image store và provider map/route. Chỉ chọn gói miễn phí đủ điều kiện; kiểm tra quota, sleep/restart, kích thước upload, persistence, yêu cầu thẻ và cách ứng xử khi hết hạn mức. Không tự bật billing.
3. Chạy local đầy đủ với config mẫu không secret. Ghi thứ tự khởi động/frontend/API/port, lỗi thường gặp và vị trí lưu dữ liệu. Hướng dẫn điện thoại dùng cùng backend; 127.0.0.1 trên điện thoại là chính điện thoại, không phải máy phát triển.
4. Chọn địa chỉ miễn phí hoặc domain sau khi user quyết định. Chốt resource base nếu dưới subpath, public app URL, API base, route/deep-link fallback, allowed origin, cookie Path/Secure/SameSite và cấu hình proxy tin cậy.
5. Không đưa .data/.env/private photos/.git vào static output. Không coi upload dist lên static host là đã có backend. Cài kho dữ liệu bền/riêng và backup/restore theo schema thực; file tạm serverless không thay persistent store.
6. Chuẩn bị nhánh phụ cho phát hành; xin phép trước push. Kiểm tra khả năng tích hợp với main tại SHA đã biết và báo conflict. Không tự push/merge main hoặc nối branch preview với dữ liệu thật.
7. Deploy môi trường thử khi có yêu cầu; cung cấp health/status phù hợp, logs đã redact và cấu hình camera/GPS HTTPS. Chạy smoke đăng nhập/avatar/Explore/detail/ảnh/run/Shop trong phạm vi các chức năng đã có.
8. Test reload/deep link/refresh trên điện thoại và máy tính; restart backend rồi đọc dữ liệu; thử thiếu mạng, thiếu quota, tile/route lỗi. Chỉ kết luận từng chức năng sau bằng chứng trên môi trường đó.
9. Bàn giao URL, nơi chỉnh config không secret, cách xem lỗi/backup/restore, cách dừng và rollback phiên bản + dữ liệu. Nêu phần chưa triển khai; không suy rằng domain đổi là đủ nếu API/storage còn thiếu.
10. Đối chiếu lại quota/điều khoản chính thức ở thời điểm triển khai. Provider chưa chốt nên chưa có lệnh DNS/deploy cụ thể, không bịa lệnh hoặc hứa miễn phí vô hạn.


### Prototype UI tách biệt — v2.2
references/ui-design/index.html là artifact review offline, không thuộc src/app runtime, không dependency/package/backend. Không copy thẳng 33 màn HTML vào App; trước implementation map S/WF thành component/module hiện có và giữ auth/owner/runtime authority. Sơ đồ map trong mockup không thay Leaflet/pixelTiles/markerScale của người dùng. Source archive trong references không deploy như public static asset hoặc publish lên repo mặc định. Link/ảnh/notes dùng relative paths để pack giải nén dùng được.
