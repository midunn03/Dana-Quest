# Testing — Dana Quest

## Goals and scope

Phiên bản 2.2 — 26/10/2026. Mục tiêu: chứng minh mỗi quyền/workflow của PRD có kết quả quan sát được, giữ ảnh/tiến độ, không lộ dữ liệu hoặc cộng/trừ coin lặp. Các test **mục tiêu** dưới chưa tồn tại hết và chưa chạy trên ZIP mới. D0 chỉ xác minh bộ tài liệu, không sửa source hoặc viết test vào app.

Ba nhóm bằng chứng luôn tách: (1) kiểm tra pack tài liệu; (2) test code DANAQUEST-WEB cũ đã chạy trong lượt audit trước; (3) test code ZIP Dana-Quest mới chưa chạy. Không trộn số test hoặc kết quả build giữa ba nhóm.

## Test layers

| Lớp | Chứng minh gì | Không chứng minh gì |
| --- | --- | --- |
| Unit luật thuần | Transition, normalization, reward/idempotency policy | Cookie/owner filesystem hoặc GPS thật |
| Integration API/storage | Session, owner, atomicity, blob round-trip, errors | UI trên điện thoại thực |
| UI component/jsdom | Label, button state, validation, render theo mock | Quyền OS/camera thật, tile/network thật |
| Browser E2E | Login → avatar → Explore → detail → run/album/Shop khi tính năng có | GPS đúng ở địa điểm thật nếu dùng mock |
| Manual thiết bị/thực địa | Camera, GPS, quyền, bàn phím, responsive, tiếng Việt/Anh | Load lớn hoặc mọi browser |
| Deployment smoke | HTTPS/proxy/cookie/private storage/base URL | Sản phẩm sẵn sàng nếu gameplay chưa nghiệm thu |

Test files thấy ở bản cũ: auth-api, account-sync, account-reset, server-actions, rules, storage, flow, auth, photo-ui, camera, routing, walking-route, navigation, player-location, gps-acquisition, avatar, confirm-dialog và các file khác. Inventory ZIP mới phải làm lại trước code. Test tồn tại không nghĩa nhánh bug đã được bảo vệ.

## Acceptance test matrix

Mỗi case cần Given/When/Then, fixture và evidence. Status mặc định **Planned — chưa chạy trên ZIP mới**. Khi thực hiện thay status bằng ngày/commit/môi trường và kết quả thực; không đổi hàng loạt thành Passed vì build thành công.

### Tài khoản, quyền và onboarding
| Case | WF/F | Given / When | Then mong đợi | Lớp |
| --- | --- | --- | --- | --- |
| AUTH-01 | WF-01/F-01 | Mở app chưa biết phiên | Loading không lộ private cache; thành công/401/network tách | UI/E2E |
| AUTH-02 | WF-02 | Đăng ký tên trùng, password sai định dạng, double submit | Error đúng field; không tạo user trùng | API/UI |
| AUTH-03 | WF-02 | Login đúng user, return intent quest hợp lệ | Đi qua avatar nếu thiếu rồi về đúng điểm bắt đầu; không auto complete | E2E |
| AUTH-04 | WF-02 | Return intent URL ngoài/script/quest không tồn tại | Từ chối/đi về màn an toàn | API/UI |
| AUTH-05 | WF-03/F-02 | Đổi avatar preview rồi hủy/lưu lỗi/lưu thành công | Hủy giữ cũ; lỗi giữ lựa chọn; thành công bền theo account | UI/API |
| AUTH-06 | WF-01/11 | Logout khi đang có dữ liệu riêng | Guest vẫn browse theo policy; không ảnh/run/coin của user cũ | E2E |
| AUTH-07 | WF-11 | Phiên hết lúc upload rồi login user khác | Không attach draft A vào B; không hiển thị preview A | API/E2E |
| AUTH-08 | WF-01 | First-open và sau logout | Lần đầu tới login/register; sau auth thành công rồi logout xem Explore/detail; start luôn cần phiên. Cách nhận biết theo O-01 | UI/E2E |

### Catalog, map, ngôn ngữ
| Case | WF/F | Given / When | Then mong đợi | Lớp |
| --- | --- | --- | --- | --- |
| MAP-01 | WF-04/F-03 | Search/filter rồi đổi List↔Map | Cùng questIds, giữ filter; ghim/thẻ/detail trùng quest | UI/browser |
| MAP-02 | WF-04 | Tile không tải được nhưng catalog có | Có lỗi tile, list/card vẫn dùng; không catalog rỗng giả | Browser |
| MAP-03 | WF-04 | GPS denied/timeout/inaccurate | Có hướng phục hồi, tìm thủ công; không chặn public detail | UI/device |
| MAP-04 | WF-04 | Map pixel/daylight/zoom đổi | Pin/label/đường đọc được, attribution không che, không leak listeners | Browser/device |
| CAT-01 | F-11 | Catalog mục tiêu 16 nhưng mới ít quest published | Chỉ nội dung ready được chơi; không fake đủ số | Unit/API |
| CAT-02 | WF-05 | Guest bấm Start/Player có run dở | Login gate/Resume đúng; không tạo run khi guest | UI/API |
| LNG-01 | WF-13/F-05 | Đổi VI↔EN ở form/map/story/challenge | Không text lẫn thiếu key, không đổi ID/run/đáp án đang lưu | UI/E2E |
| LNG-02 | WF-13 | Quest thiếu EN | Nêu ngôn ngữ thực, không dịch giả hoặc mất state | Unit/UI |
| LNG-03 | WF-13 | Tên dài, dấu Việt, số/date, 200% text | Font đủ glyph, nút không cắt, không tràn ngang | Manual |

### Runtime và trợ giúp — F2
| Case | WF/F | Given / When | Then mong đợi | Lớp |
| --- | --- | --- | --- | --- |
| RUN-01 | WF-06/F-06 | Start đồng thời hai tab cùng quest | Một run hợp policy O-07, không duplicate reward | API |
| RUN-02 | WF-07 | Tải lại ở briefing/story/challenge/result | Đúng bước đã lưu, không mất solved hoặc cộng lặp | E2E |
| RUN-03 | WF-07 | Bấm Continue story hoặc mở ảnh clue | Không completed/reward event | Unit/UI |
| RUN-04 | WF-07 | Submit checkpoint 2 trước checkpoint 1 | Server reject transition, state không đổi | API |
| RUN-05 | WF-07 | Đáp án rỗng/sai/đúng/mạng lỗi | Rỗng chặn; sai cho sửa; đúng commit; mạng lỗi không tính sai | Unit/API/UI |
| RUN-06 | WF-07 | Normalize case/Unicode/dấu theo policy | Chỉ biến thể được duyệt được nhận; VI/EN không đổi optionId | Unit |
| RUN-07 | WF-08/F-08 | Mở hint rồi cancel/use/retry | Cancel không tiêu; use lưu một lần, penalty đúng policy | Unit/API |
| RUN-08 | WF-08 | Reveal/skip rồi đọc story sau | Kết quả skipped/revealed khác solved; thưởng theo luật duyệt | Unit/E2E |
| RUN-09 | WF-11 | Pause/đóng tab/logout/resume | Không xóa run; owner đúng; draft chưa lưu không được gọi saved | E2E |
| RUN-10 | WF-12 | Mở result nhiều lần/replay/multi-tab | Không cấp coin lần hai, quality đúng solved/skipped | API/E2E |
| RUN-11 | WF-07 | Quest version mới khi run cũ đang dở | Run tiếp tục version cũ hoặc migration được duyệt, không đổi đáp án âm thầm | API |
| RUN-12 | WF-14 | Demo trong lớp khác vị trí thật | Mode rõ/test data riêng nếu được duyệt; không bypass production ngầm | Manual/API |

### Chụp hình và album — trọng tâm
| Case | WF/PH | Given / When | Then mong đợi | Lớp |
| --- | --- | --- | --- | --- |
| PH-01 | WF-09/PH-01 | Mời ảnh kỷ niệm → Để sau | Đi tiếp đúng story; không fail challenge, không mất điểm/coin theo đề xuất | UI/E2E |
| PH-02 | WF-09/PH-03 | Xem ảnh địa điểm/clue rồi phóng to | Không xin camera, không tạo ảnh player | UI/browser |
| PH-03 | WF-09 | Chưa click chụp | Không gọi getUserMedia/microphone | UI/browser |
| PH-04 | WF-09 | Cho phép/từ chối/không camera/camera bận | Trạng thái riêng, retry/file theo O-05; không gọi đã lưu | Device |
| PH-05 | WF-09 | Live capture/retake/cancel | Draft mới đúng; hủy giữ saved cũ; track dừng đúng lifecycle | Browser/device |
| PH-06 | WF-09 | Chọn JPEG/PNG/WebP/HEIC/sai MIME/quá size | Chấp nhận/convert hoặc reject đúng giới hạn; không crash | Unit/API/device |
| PH-07 | WF-09 | Ảnh tối/sáng/nhỏ/ít chi tiết/không decode | Quality heuristic đúng; override có label self-review; không AI label | Unit/UI |
| PH-08 | WF-09 | Ảnh camera và file cùng điều kiện | Áp chung validation/save/purpose; không một đường bỏ qua giới hạn | Integration |
| PH-09 | WF-09 | Draft chưa bấm Lưu | Album không có ảnh; PH-02 chưa thể complete | UI/API |
| PH-10 | WF-09/PH-02 | Lưu ảnh evidence thành công | Có photoId owner/run/challenge; vẫn chưa solved trước command submit | API/E2E |
| PH-11 | WF-09/PH-02 | Gửi photoId của A/run khác/challenge khác/deleted | Server từ chối, không reward | API |
| PH-12 | WF-09 | Mất mạng/413/429/lưu đĩa lỗi | Báo chưa lưu; giữ draft trong phạm vi được hỗ trợ; không auto complete | API/UI |
| PH-13 | WF-09 | Timeout sau server đã lưu, retry cùng operationId | Một photo, cùng kết quả; không trùng album | API |
| PH-14 | WF-09 | Thay ảnh cũ nhưng ghi ảnh mới thất bại | Ảnh cũ còn và truy xuất được | Integration |
| PH-15 | WF-09 | Rời trang/tab ẩn/logout lúc camera mở | Video tracks dừng, request/preview private cleanup | Browser/device |
| PH-16 | WF-10 | Ảnh A có metadata, chuyển user B | Không thấy/download/delete blob A; cache/ObjectURL cũ bị thu hồi | API/browser |
| PH-17 | WF-10 | Lưu ảnh → complete task khác → full fetch | Bytes/hash ảnh giữ nguyên; bắt lỗi metadata-overwrite | Integration ưu tiên P0 |
| PH-18 | WF-10 | Lưu ảnh 1 → ảnh 2 → xóa ảnh 2 | Ảnh 1 còn đủ bytes, không chỉ metadata | Integration ưu tiên P0 |
| PH-19 | WF-10/11 | Reset corrupt progress còn ảnh hợp lệ | Giữ blob hợp lệ đúng lời UI; nếu không phục hồi được phải báo thật | Integration ưu tiên P0 |
| PH-20 | WF-10 | Delete ảnh rồi mở lại/refresh | Content không còn truy xuất; state/coin theo policy, ảnh khác còn | API/E2E |
| PH-21 | WF-10 | Album list nhiều ảnh, mở một | List chỉ metadata; không tải toàn blob mỗi lần vào mission | Browser/network |
| PH-22 | WF-10 | Ảnh chụp timestamp khác server createdAt | Label thời gian chính xác, không gọi server time là ngày chụp xác thực | UI |
| PH-23 | WF-09/10 | Không đồng ý share | Ảnh luôn private; không có public feed/marketing auto-share | API/E2E |
| PH-24 | WF-09 | Reload với draft chưa có persistence | Không gọi ảnh đã lưu; không hứa khôi phục draft chưa commit | Browser |

### Quyền và dữ liệu — Security
| Case | Mô phỏng | Kết quả cần có |
| --- | --- | --- |
| SEC-01 | Request run/photo/balance không cookie | 401, không dữ liệu riêng |
| SEC-02 | Cookie B + resource A, kể cả content URL | 403/404 theo contract, không byte/metadata A |
| SEC-03 | Body userId=người khác/coins=999/photoAvailable=true | Ignore/reject; owner/result từ server |
| SEC-04 | Origin không allowlist, cookie qua HTTPS proxy | Reject nguồn sai; nguồn đúng hoạt động; Secure/Path phù hợp endpoint |
| SEC-05 | Public catalog/JS output khi yêu cầu answer secret | Không acceptedAnswers/correctOptionId/private user data |
| SEC-06 | URL .data/.env/path traversal/storage object đoán ID | Không public file/secret |
| SEC-07 | Filename độc hại/MIME giả/ảnh decode quá lớn | Reject an toàn, không ghi ngoài kho, không crash/đầy RAM |
| SEC-08 | Logs lỗi upload/auth/route/report | Không token/password/base64/GPS chính xác/liên hệ |
| SEC-09 | Nhiều request auth/upload/route; nhiều user sau proxy | Rate limit hợp lý, không vô tình khóa tất cả người dùng bởi IP proxy |

### Green Coin, Shop và tính bền
REW-01: double submit complete/redeem → một event; REW-02: hai redemption cạnh tranh cùng balance → không âm; REW-03: response timeout → retry cùng ID không trừ lần hai; REW-04: catalog cost đổi → costSnapshot lịch sử không đổi; REW-05: demo run không tăng balance thật; REW-06: PH-01/chỉ xem story không thưởng; REW-07: skip/reveal có luật riêng được duyệt; REW-08: xóa ảnh không tự thay đổi coin nếu theo policy. Layer API/unit; chưa chạy trên ZIP mới.

DATA-01: restart giữ account/run/photo, session theo chính sách đã chốt. DATA-02: corrupt JSON báo đúng, backup an toàn, reset không xóa dữ liệu lành. DATA-03: migrate v1→v2 dry-run và lần hai không duplicate. DATA-04: legacy Chợ Hàn/historical đọc được, không xuất hiện ở active, hành động mới theo policy explicit. DATA-05: backup/restore gồm blobs và metadata, so bytes/hash. DATA-06: archive quest không xóa run; DATA-07: thiếu locale/reference image/contentVersion không crash; DATA-08: client/server parity hoặc một nguồn luật. Chưa chạy trên ZIP mới.

### UI và thiết bị thật
UI-01: 360/390/430/1280 px, xoay ngang/200% chữ, no overflow; UI-02: Tab/Shift+Tab/Escape focus trap/restore; UI-03: người dùng không kéo được vẫn mở/đóng sheet bằng nút; UI-04: screen reader labels/status/error VI/EN; UI-05: reduced-motion, no flash; UI-06: camera iOS Safari/Android Chrome/laptop browser mục tiêu; UI-07: GPS thực tại DUE, ảnh nhận diện/lối đi đúng; UI-08: mạng chậm/map offline, sticky CTA không che bàn phím. Các browser là mục tiêu thử đề xuất, chưa cam kết hỗ trợ đã đạt.

## Fixtures and environments

Tài khoản synthetic A/B, session expired và avatar absent/present; published/draft quest; quest hai challenge text+photo và fixture skip/hint; ảnh hợp lệ/sai/tối/nhỏ/quá lớn; GPS mock fresh/stale/inaccurate/future/out-of-range. Không dùng ảnh/tài khoản thật, không đọc .data production. API test dùng thư mục tạm trong sandbox cho phép, cleanup đúng path đã kiểm tra. Network helper mock route/Places/tiles cho test xác định; thêm smoke thực tách riêng. Hạn chế filesystem/network môi trường phải ghi rõ, không sửa expectation để biến fail thành pass.

## Verified commands

CODE_STYLE.md là nguồn lệnh. Đã thấy npm.cmd test, npm.cmd run build, npm.cmd run lint trong package; ZIP mới có npm.cmd start. Chưa có script E2E riêng được xác nhận. Các test mục tiêu phải viết khi triển khai tính năng, không bịa tên lệnh/pipeline đang tồn tại. Đối với D0 kiểm tra đủ 8 file, headings template, cross-links, ảnh nguồn đi kèm, nhãn ĐỀ XUẤT/CẦN CHỐT và tính nhất quán; không cần chạy app cho doc-only.

## Release criteria

### F1
Guest browse/login gate theo O-01; profile/avatar; Explore list/map/quest detail; VI/EN; không lộ private data; không fake gameplay/Shop giao dịch. Build/type/lint và tests liên quan thực đạt; review UI browser. Không bắt F1 đạt các game mechanics F2 chưa yêu cầu.

### F2/F3
DUE hai challenge chơi hết/resume/ảnh/reward; PH-17–19 ưu tiên xử lý; các O tương ứng chốt; đủ catalog nội dung đã duyệt thay vì placeholder. Regressions về owner/blob/idempotency phải pass và có device check. Hoàn tất run có skip cần hiển thị đúng policy.

### F4
HTTPS/proxy/cookie/data persistence/backup restore/private assets/quotas/free tier và smoke trên thiết bị thật. Push chỉ sau xin phép, nhánh phụ; kiểm tra tích hợp main tại SHA cụ thể. Website F5 chưa phải điều kiện F1/F2. Không gộp tỷ lệ test pass với chứng nhận production.

## Results

### Bằng chứng lịch sử của bản DANAQUEST-WEB cũ (lượt audit trước)
Build thành công, có cảnh báo JS chunk >500 kB; lint không lỗi chặn, 4 warning; Vitest báo 53 test pass, 1 fail và 17 failed suites do các lỗi file tạm/kết nối bị hạn chế (tổng 18 file fail/4 pass). Không được diễn giải tất cả failed suites là lỗi game. Test synthetic trực tiếp trong workspace tái hiện ảnh có data sau upload nhưng mất data sau complete nhiệm vụ read. Đây là lỗi tái hiện có bằng chứng trên bản cũ.

### Bản ZIP Dana-Quest mới
Đọc chọn lọc thấy mẫu read-metadata/update và reset-photo metadata còn trong server/account-data.mjs; chưa thực thi ZIP hoặc full suite, không tái sử dụng kết quả cũ như pass/fail ZIP. Đã nhận ra code có quest DUE draft, pixel map và routes khác; cần inventory mới trước implementation.

### D0 tài liệu v2
Đã xem ảnh reference theo index và biên soạn requirements/workflow/schema/API/test plan. Kết quả kiểm tra file/link/đóng gói ghi trong lời bàn giao sau khi thực hiện. Chưa có gameplay mới, browser E2E, camera/GPS thật, migration, deployment hoặc GitHub push nào trong lần chỉnh tài liệu này.

Mẫu ghi test sau: ngày + source/commit + environment + command/case + expected/actual + pass/fail/blocked + artifact đã redacted + giới hạn. Một test pass không phủ định lỗi nằm ở đường đi chưa được test.


### Ca bổ sung đối chiếu yêu cầu gốc v2.1 — chưa chạy
- AUTH-09: browser chưa có dấu onboarding mở deep link Explore/detail → login; return intent nội bộ được bảo toàn; không tự thêm nút xem trước.
- AUTH-10: đăng nhập thành công → logout → refresh → Explore/detail vẫn đọc được theo dấu onboarding được duyệt; Album/run/coin không lộ.
- AUTH-11: xóa dữ liệu browser/đổi thiết bị → hành vi lần đầu theo chính sách O-01; cờ giả không cấp quyền server.
- SCOPE-01: F1/F2 không tạo landing/website giới thiệu; yêu cầu F5 vẫn được giữ để phát triển sau.
- DEPLOY-01: khi đến F4, kiểm tra subpath/resource base/API/cookie/HTTPS/storage/backup theo runbook Architecture; không dùng kết quả local thay smoke trên hosting.
- TRACE-01: trước bàn giao tài liệu, đối chiếu đủ 14 dòng trong REQUIREMENTS-COVERAGE; quyết định đã bị cập nhật không còn xuất hiện như yêu cầu đang mở.



### UI prototype v2.2 — phạm vi kiểm tra
Đã mở bản thiết kế bằng browser: chuyển list→map, chọn mẫu avatar, gallery có 33 frame, 22 img elements và không ảnh lỗi tại lúc kiểm tra; mọi data-go target có màn tương ứng. Đã chụp bốn màn Explore/map/avatar/story để xem hình. Đây là test artifact, không test app ZIP hoặc backend/camera/GPS thật. Nguyên ZIP Questo copy vào references và so SHA-256 trùng nguồn. Chưa audit tất cả dialog focus trap, responsive 360/390/430, full VI/EN hoặc mọi màn trên điện thoại thật; các mục đó giữ là tiêu chí app phải kiểm tra sau.
