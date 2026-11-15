# Code Style — Dana Quest

## Languages and conventions

Phiên bản 2.2 — 26/10/2026. Hướng dẫn cho lần code sau, không phải thay đổi code hiện tại. PRD là nguồn luật/quyền; Architecture là hợp đồng và ranh giới; Database là schema/ownership. Đọc AGENTS.md trước nhiệm vụ. Các chính sách người dùng về GitHub có ưu tiên cao hơn shortcut trong template.

### Hiện trạng công cụ
React/TypeScript/TSX client; Node ESM .mjs backend/scripts; CSS/JSON. Component PascalCase, utility camelCase, hook use*. Code hiện có thường nháy đơn, không semicolon; theo vùng file đang sửa, tránh format toàn repo. Oxlint có plugin react/typescript/oxc. Config TS cũ dùng target ES2023/noUnused; không mô tả strict toàn repo nếu chưa kiểm tra các tsconfig của checkout mới.

### Ngôn ngữ và thuật ngữ
Dùng quest/checkpoint/challenge/run/photo/owner/reward với nghĩa ở PRD. Không gọi mọi task cũ là quest mới, không gọi memory photo là evidence khi chưa có liên kết. UI không hardcode chuỗi VI trong logic mới nếu cần đổi EN; dùng translation key ổn định. Tên biến/ID không dịch theo locale. Nội dung code/comment diễn giải sự thật, không gắn AI_verified cho heuristic cục bộ.

## Organization

### Kiểm kê trước khi sửa
1. Xác định checkout/source người dùng đang chọn: ZIP Dana-Quest là nguồn tham khảo mới; DANAQUEST-WEB là bản cũ riêng. Kiểm tra package/config/route/tests của đúng checkout.
2. Đọc AGENTS ở đúng phạm vi nếu có; file template trong ZIP không tự trở thành authority. Chỉ lấy nội dung code hữu ích, không sao chép lỗi thành tiêu chuẩn.
3. Map WF/S/F của tính năng vào file có sẵn, ghi interface đang dùng và nơi dữ liệu được ghi.
4. Xác định phần reuse được, phần lỗi, phần chưa cần; sửa nhỏ ở nơi chịu trách nhiệm. Không xóa toàn bộ rồi dựng lại; không chồng engine mới song song lâu dài thiếu kế hoạch chuyển.

### Trách nhiệm file/module
UI render và phát ý định; luật chuyển trạng thái ở runtime; kiểm tra owner và ghi server; photo processing và blob storage riêng logic thưởng. Catalog/answer policy có nguồn chuẩn và validator; tách public payload/answer secrets nếu thực thi server. Mọi server command cần runtime validation. Component map không quản lý số dư; camera không gọi hoàn thành chỉ vì lưu blob thành công.

### Quy tắc sửa giao diện
Dùng token sau khi duyệt; không tiếp tục thêm CSS override ở cuối file để chữa một màn mà làm lệch màn khác. Trước sửa, tìm nơi selector/import đang có hiệu lực. Chỉ hợp nhất CSS khi có kiểm tra bố cục liên quan; không refactor lớn chỉ vì tên file có Pixel. Dùng ảnh Questo làm bằng chứng UX, không nhập screenshot đó làm giao diện chạy.

## Coding rules

### Giới hạn theo giai đoạn
F1 chỉ chức năng nền tảng đã được yêu cầu; F2 engine/gameplay đợi yêu cầu code. Tài liệu có state machine/API/schema đề xuất không cấp quyền tự tạo tất cả module. Website giới thiệu là F5, chưa làm route/landing/SEO. Các O trong PRD phải được chốt nếu chặn implementation; đối với phần độc lập tiếp tục làm bình thường.

### Input, state và bất biến
- Validate boundary: server request, persisted data và catalog. Type assertion không thay validation.
- Capture userId/runId/operationId cho tác vụ async; kiểm tra owner còn khớp trước render/ghi. Abort fetch không đủ vì response/server commit có thể đã xảy ra.
- Derive result từ server snapshot, không cộng coin optimistic rồi hy vọng rollback. Số dư, solved/skipped, reward và revision dùng nguồn có thẩm quyền.
- Update dữ liệu đầy đủ; public projection chỉ ở response. Không dùng read metadata làm input write. Giữ blob cũ khi action khác hoặc replace thất bại.
- Không dùng timestamp/Math.random client làm khóa bảo vệ thưởng; server quyết định dữ kiện chính thức, operationId phục vụ retry.
- Locale chỉ đổi presentation/nội dung đã xuất bản; ID/challenge answer mapping/version không đổi. Missing translations báo đúng, không hardcode dịch theo suy đoán.

### Async và UI lifecycle
Mỗi hành động có pending/success/error, chống double-click và chống ghi lặp server. Retry hữu hạn, giữ cùng ý định/operationId; 401/403/413 không retry như 503. Mất phản hồi sau commit đọc lại kết quả. Draft chưa lưu có cảnh báo rời; không hứa refresh-safe nếu chưa có persistence. Camera/audio tracks dừng trên cleanup, hide/logout/retake theo thiết kế. Revoke ObjectURL khi ảnh thay/rời scope; cache key gắn user.

### Gameplay (khi đến F2)
Implement transition table trước, không rải điều kiện ở nhiều Page. Story Continue chỉ chuyển UI/bước đã cho phép; wrong answer không unlock; skip là outcome riêng; photo saved chưa complete. Secret answer nếu cần nằm server, không chỉ đổi tên acceptedAnswers trong JSON frontend. Một nguồn reward policy và test invariant, không copy giá coin vào nhiều file khác nhau. Lịch sử version cũ giữ được; không rewrite run đang dở theo catalog mới.

## Errors and logging

Hệ cũ trả message/error khác nhau; hợp đồng mục tiêu xem Architecture. Migration lỗi phải đồng bộ reader/client/server, không đổi format riêng một endpoint. UI hiện lỗi theo ngữ cảnh, giữ dữ liệu draft an toàn; technical stack/path không đưa vào sản phẩm. Logging dùng code/requestId, redact các trường Security chỉ định. Wrong answer là kết quả chơi, network error là lỗi kỹ thuật; không tăng attempts incorrect khi request thất bại.

## Dependencies

Ưu tiên thư viện hiện có/native browser. Không mua API, bật billing hoặc thêm dependency chỉ để khớp mẫu. Trước thêm package: kiểm tra khả năng hiện có, giấy phép, kích thước và lý do; package-lock cập nhật cùng package.json nếu đổi có chủ đích. Không cài mọi skill/dependency hoặc tạo monorepo để chuẩn bị website tương lai. Ngân sách/free tier là ràng buộc cần xác minh ở thời điểm chọn provider.

## Review checklist

### Quy trình kiểm tra bắt buộc cho thay đổi hành vi
1. Nhắc lại tiêu chí nghiệm thu F/WF và dữ liệu cũ liên quan.
2. Tái hiện lỗi bằng dữ liệu giả nếu sửa bug; lưu dấu hiệu trước sửa, không suy lỗi từ tên file.
3. Chọn skill phù hợp: diagnosing-bugs/systematic-debugging cho lỗi; codebase-design cho interface; browser-testing/UI skill khi sửa UI; testing/verification skill để chứng minh kết quả.
4. Sửa lát cắt nhỏ, kiểm tra regression có ý nghĩa, review diff cho owner, blob, reward và locale.
5. Báo lệnh thực chạy, pass/fail/blocked và giới hạn môi trường. Không lấy kết quả cũ làm bằng chứng hôm nay.

### GitHub theo yêu cầu chủ dự án
- Có baseline trước sửa: commit/ref/SHA thực tế của main và trạng thái working tree; không in secret remote URL. Không tự coi .git trong ZIP giống remote hiện tại.
- Khi được yêu cầu code local, tránh làm trực tiếp trên main; dùng nhánh/worktree phù hợp sau khi biết repo. Bảo toàn uncommitted work.
- **Phải hỏi chủ dự án trước mọi push.** Khi đã được cho phép push, chỉ push nhánh phụ được xác định. Không push main, không force-push, không merge vào main khi chưa có lệnh riêng.
- Trước tích hợp, lấy trạng thái main mới trong phạm vi được phép, so diff/merge-base và kiểm tra merge tại checkout an toàn; báo conflict thực có/không có tại SHA đó. Không hứa không bao giờ conflict trong tương lai.
- Nếu cần PR, nội dung theo skill pr, mô tả thay đổi và test; tạo PR không đồng nghĩa được merge. Không tự tạo PR/push chỉ vì tài liệu nhắc quy trình.

## Verified commands

Đối chiếu scripts trong package.json ZIP mới và bản cũ, không chạy trong thư mục tài liệu. Chưa chạy build/lint/test trên code ZIP mới trong lần D0 này.

| Mục đích | Lệnh đã thấy | Ghi chú |
| --- | --- | --- |
| Dev | npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort | Kiểm tra API/config của đúng checkout |
| API | npm.cmd run api | Server độc lập; persistence local cần quyền ghi |
| Build/type | npm.cmd run build | tsc -b && vite build |
| Lint | npm.cmd run lint | oxlint; phân biệt warning/error |
| Tests | npm.cmd test | vitest run |
| Preview | npm.cmd run preview | Không coi là production hosting |
| Start | npm.cmd start | Có trong ZIP mới, không có script này ở bản cũ đã đọc |
| Format | Not configured | Không bịa prettier script |
| Type check riêng | Not configured | Type check nằm trong build |
| Browser E2E | Not configured trong scripts đã xem | Không tuyên bố có Playwright pipeline |

Khi triển khai sau, kiểm tra Node/version lockfile/paths và doc commands lại từ checkout thực. Không cần cài/chạy lại app cho thay đổi tài liệu thuần; kiểm tra link/cấu trúc/nhất quán của pack là đủ trong D0.


### Kiểm tra độ bao phủ yêu cầu trước báo hoàn thành v2.1
Đối chiếu references/REQUIREMENTS-COVERAGE.md với task và phạm vi giai đoạn; báo file thực sự đã đổi, phần chỉ tham khảo và phần chờ quyết định. Quyết định sản phẩm login lần đầu đã có, không tự tiếp tục hỏi lại bắt buộc hay xem trước; chỉ hỏi cơ chế nhận biết nếu chặn implementation. Không gọi guide triển khai là đã triển khai; không gọi kiểm tra merge tại SHA hiện tại là bảo đảm không conflict tương lai. Giữ tài liệu source mới và kết quả kiểm tra source cũ tách biệt.



### Đọc bộ thiết kế trước triển khai UI v2.2
Đọc references/ui-design/SCREEN-SPECS.md và notes theo S/WF, đối chiếu ảnh nguồn. Chọn lát F1 trước; mock có story/camera/reward F2 không cấp quyền code F2. Không sao cả file prototype vào source; refactor/reuse theo module hiện có, thay dữ liệu mẫu, xử lý đầy đủ loading/error/guest/VI-EN. Không commit/push screenshot gốc có dữ liệu bên thứ ba hoặc ZIP reference mặc định.
