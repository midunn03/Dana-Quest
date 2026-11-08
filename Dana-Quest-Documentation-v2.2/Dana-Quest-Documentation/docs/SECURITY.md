# Security — Dana Quest

## Assets and trust boundaries

Phiên bản 2.2 — 26/10/2026. Phạm vi game trình duyệt; PRD định nghĩa quyền/workflow, DATABASE định nghĩa owner/quan hệ. Các bảo vệ dưới là yêu cầu kiểm tra/đề xuất mục tiêu, không phải chứng nhận bảo mật hoặc tuân thủ pháp luật. Chưa làm audit toàn bộ ZIP, chưa triển khai, không đọc secret/tài khoản thật.

Tài sản: tài khoản và password hash/salt; cookie/session; hồ sơ/liên hệ; avatar; run/đáp án; ảnh memory/evidence; số dư và redemption demo; secret API nếu có. GPS và ảnh có thể tiết lộ nơi đi/người xuất hiện. Catalog public không có nghĩa ảnh player công khai. Runtime client, file upload, GPS, URL hash, header, localStorage/IndexedDB và API ngoài đều là nguồn không tin cậy.

### Tình huống rủi ro cụ thể
| Rủi ro | Ví dụ | Điều kiện bảo vệ cần có |
| --- | --- | --- |
| Đọc chéo user | B đổi photoId/runId trên URL để đọc A | Xác thực và kiểm tra owner trên mọi GET/content/command |
| Ghi nhầm tài khoản | Tab A còn mở nhưng cookie thành B | Capture owner cho async task, kiểm tra lại trước/sau response, dọn view cũ |
| Hoàn thành giả | Gửi photoAvailable=true hoặc coins=999 | Server suy evidence/outcome/balance từ dữ liệu riêng |
| Lộ đáp án | acceptedAnswers trong payload/JS public | Tách secret đáp án server nếu cần kiểm soát; không hứa chống gian lận trong local-only |
| Mất blob | Đọc metadata rồi ghi snapshot thiếu ảnh | Store dữ liệu đầy đủ, serialize riêng, test round-trip |
| Upload độc hại/quá tải | File JPEG giả, ảnh quá lớn, gửi liên tục | Size/type/decode/quota/rate limit, giới hạn bộ nhớ |
| Truy cập trực tiếp storage | .data hoặc bucket public | Web server deny, private object keys và auth content |
| Lộ dữ liệu qua report/log | URL GPS, token, base64 trong lỗi | Redaction, tối thiểu data, lỗi an toàn |
| Thưởng lặp | Retry sau timeout hoặc nhiều tab đổi cùng lúc | Transaction + operationId + unique business event |

## Authentication and authorization

### Chính sách vai trò
Chỉ guest và player là vai trò ứng dụng hiện ưu tiên. Chưa yêu cầu admin UI, creator marketplace, crew hay operator qua web. Chủ dự án/biên tập/vận hành là trách nhiệm làm việc, không tự cấp role đọc dữ liệu người chơi.

| Thao tác | Guest | Player |
| --- | --- | --- |
| Catalog/chi tiết/reference photos | Đọc published theo O-01 | Đọc published |
| Tạo run/submit/hint/skip | Không | Chỉ run của mình, đúng state/policy |
| Camera memory/evidence riêng | Không ghi server | Chỉ owner; GPS/camera không tự cấp quyền khác |
| Album/content/delete | Không | Chỉ ảnh của mình; photoId đoán được vẫn phải kiểm tra |
| Balance/redeem/history | Không | Chỉ của mình, server tính |
| Hồ sơ/avatar/logout | Không | Chỉ của phiên hiện tại |

Guest bấm start → login gate; client route gate chỉ là UX, server vẫn từ chối command không phiên. Sau logout vẫn browse public nhưng cache riêng không xuất hiện. Login lần đầu là yêu cầu UX đã rõ; O-01 chỉ chốt cách nhận biết. Dấu onboarding local có thể bị sửa/xóa và không được dùng làm cơ chế bảo mật: mọi run/photo/balance/submit vẫn cần phiên và owner server. Không thể bảo đảm một người chưa từng xác thực không đọc catalog public bằng cách khóa UI; nếu muốn catalog cũng là dữ liệu bí mật server thì phải đổi chính sách và chốt riêng.

### Session hiện có và điều cần xác minh
Code hệ hiện có dùng scrypt/salt, token ngẫu nhiên và cookie HttpOnly/SameSite=Strict/Path=/api/auth; Max-Age 7 ngày, session RAM nên restart mất phiên. Đây là hiện trạng, không hứa session bền. Nếu thêm /api/v1 cần xem lại cookie Path, nếu không phiên có thể không gửi tới endpoint mới. Password không đặt trong URL, log hoặc localStorage.

Nếu TLS kết thúc tại reverse proxy, req.socket.encrypted có thể false: origin check và Secure cookie trong code cần thiết kế trusted origin/proxy rõ, không tin tùy ý X-Forwarded-* từ Internet. Chỉ cấu hình proxy biết trước; HTTPS trên browser được kiểm chứng bằng test đăng nhập/deep link/upload thực. Không tắt origin check chỉ để chạy được.

Registration/login có rate limit RAM theo remoteAddress trong code; dưới proxy nhiều người có thể chung IP nếu không cấu hình đúng. Ngưỡng/khóa/giới hạn theo tài khoản cần review trước public; không coi bộ đếm RAM là chống abuse đa máy. Chưa có reset mật khẩu, email verification hoặc OAuth được xác nhận; không tạo nút hoạt động giả.

## Secrets and configuration

Chỉ ghi tên cấu hình: API_HOST, API_PORT, VALHALLA_URL, VITE_AUTH_API_URL, GOOGLE_MAPS_API_KEY nếu còn integration. VITE_* lộ trong bundle, chỉ chứa config public. Không bắt buộc bật Google Places hoặc mua API; catalog biên tập có nguồn là phương án phù hợp ngân sách. Secret giữ ngoài Git; .env.example chỉ giá trị mẫu không thật. ZIP có .git không phải quyền push hoặc công bố lịch sử. Không đưa .data/ảnh thật vào ZIP bàn giao/GitHub. Chính sách rotation/provider chưa chốt.

## Input and output handling

### Request/response
Validate method/content-type/schema/length/enum. Owner từ session, không body. Chỉ nhận command được allowlist, expectedRevision và operationId hợp lệ. Quest/run/challenge IDs đúng cùng version; không nhảy checkpoint, không submit sau closed hoặc dùng evidence_deleted. Public catalog loại secret đáp án và thông tin user. Lỗi server không lộ stack/đường dẫn nội bộ/provider key; UI dịch bằng errorCode ổn định. React render text an toàn; nếu nội dung rich text được thêm phải sanitize theo allowlist, không render HTML từ report/raw source.

### Ảnh và quyền camera
- PH-01 memory: riêng tư, không bắt buộc để chơi theo đề xuất; PH-02 evidence: riêng tư và chỉ submit sau lưu; PH-03 reference: asset public/editorial, không phải ảnh của player.
- Gọi camera sau click, dùng video không microphone; dừng tracks khi rời/ẩn tab/logout và khi chuyển camera; browser quyền do người dùng chọn, không vẽ popup hệ điều hành giả.
- Camera/upload không xác minh người chụp, thời gian thực, vị trí hoặc địa danh. Browser capture và quality heuristic không là AI. Không promise chống ảnh giả/GPS giả.
- Client xử lý ảnh để nhẹ và loại metadata không cần; server độc lập validate size, MIME/signature/decode phù hợp phương án. Giới hạn pixel/bộ nhớ cũng cần xem để tránh file nhỏ nhưng giải nén cực lớn.
- Không tin filename, extension hay content-type tự khai; storage key do server tạo. Ảnh content trả đúng MIME với nosniff và cache riêng theo thiết kế.
- Mất quyền/thiết bị bận có fallback được duyệt; không tự nâng quyền. Album quota O-06 rõ trước ghi; báo lỗi chưa lưu, không xóa ảnh cũ nếu save ảnh mới thất bại.
- Cache blob/ObjectURL phải scope owner; logout/đổi user revoke URL và hủy request cũ. URL ký nếu dùng có TTL/owner control, không gắn vào public catalog.

### Vị trí và điều hướng
GPS hỗ trợ nhận diện/đến nơi theo O-04; ảnh địa điểm + tự xác nhận không được trình bày là GPS verified. Ngưỡng legacy 100m/50m/60s chỉ là hiện trạng; không tự gán cho quest mới. Reject mẫu ngoài range, tương lai, cũ hoặc accuracy không hợp lệ theo policy được duyệt. Provider route nhận tọa độ phải được mô tả trước dùng. Demo bypass chỉ trong mode/test data riêng và không được tạo reward thật.

## Privacy

### Mục đích và tối thiểu hóa
Profile để đăng nhập/đại diện; avatar pixel không cần ảnh mặt. Run để resume/history. Ảnh để kỷ niệm/minh chứng theo purpose đã hiển thị. GPS chỉ khi người dùng dùng tính năng liên quan; không theo dõi nền ngoài luồng cần thiết. Report không mặc định đính kèm ảnh/GPS/log.

### Riêng tư và chia sẻ
Ảnh riêng mặc định. Hộp chia sẻ/marketing và bonus trong ảnh Questo chỉ là tham khảo; Dana không có public feed/marketing consent/reward đó trong phạm vi hiện tại. Không gộp đồng ý lưu ảnh với công khai ảnh. Nếu thêm share tương lai: đồng ý riêng, mục đích rõ, rút lại được, scope từng ảnh, moderation/retention riêng và không hồi tố công khai ảnh cũ.

### Xóa và lưu giữ
Owner xóa ảnh có xác nhận; ảnh không còn truy cập được trong album/content sau commit. Coin đã nhận không bị thu hồi nếu theo đề xuất PRD, nhưng kết quả giữ tombstone cần thiết. Xóa account/export/retention/backup purge thuộc O-06, phải chốt trước public. Không hứa xóa tức thì khỏi mọi backup nếu chưa có chính sách. Dữ liệu hỏng chỉ reset sau giải thích hậu quả và bản sao an toàn; không nói giữ ảnh nếu chỉ giữ metadata.

### Logs và analytics
Không log password/hash/salt/token/cookie/API key/base64 ảnh/liên hệ/GPS chính xác/raw answer nếu không cần. Query lat/lng có thể bị reverse proxy lưu; cấu hình redact hoặc đổi thiết kế có chủ đích khi triển khai. Dùng requestId/code để chẩn đoán; analytics chỉ event tối thiểu và có policy phù hợp. Không dùng ảnh thật hoặc thông tin tài khoản trong test snapshot/public screenshot.

## Dependencies and deployment

Local trước. Trước public: rà dependency bằng công cụ thích hợp, HTTPS, session/proxy, private storage, giới hạn request/upload, CORS/origin và security headers phù hợp. CSP phải cho phép đúng map/image nguồn cần dùng, không cài rule rộng hoặc chặn attribution. Đánh giá quota free tier và lỗi khi cạn quota; không tự thêm credit card/bật billing. Chưa chọn provider nên chưa có cấu hình deploy hoàn chỉnh. Website F5 tương lai mới đánh giá cross-subdomain auth; hiện ưu tiên cùng origin game/API.

## Verification

TESTING.md có SEC cases gắn actor/hành động/kết quả. Ưu tiên owner isolation, dữ liệu ảnh bền, chống lặp, cookie/proxy, secret answer exclusion và photo lifecycle. Chưa đo load lớn, audit pháp lý, camera/GPS điện thoại thật hoặc pentest toàn ZIP. Rủi ro còn: self-confirm có thể sai; thiết bị có thể giả GPS; demo local không thể bảo vệ đáp án/thưởng như server; free services không có bảo đảm vô hạn. Chủ dự án quyết định phạm vi phát hành sau khi các điều kiện thực được kiểm tra.




### ZIP reference và prototype v2.2
Gói gốc có screenshot với profile/tên bên thứ ba; giữ để review nội bộ, không tự public GitHub/marketing hoặc nhúng nguyên ZIP vào static deployment. Prototype không gửi password/form/report, không request camera/GPS/microphone; người dùng không nhập tài khoản thật. Hộp/sheet mock chỉ là thiết kế, chưa chứng minh focus trap/authorization hoặc xử lý upload production. Khi tích hợp app phải làm đầy đủ Security/Testing, không dùng placeholder UI làm bảo vệ.
