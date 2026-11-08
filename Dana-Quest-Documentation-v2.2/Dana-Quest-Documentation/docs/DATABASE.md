# Database — Dana Quest

## Storage model

Phiên bản 2.2 — 26/10/2026. PRD.md định nghĩa vai trò/workflow và quyết định O. File này có hai phần rõ: hệ lưu trữ thấy trong source và schema mục tiêu **ĐỀ XUẤT**. Không có migration được thực thi, không có database/provider production đã chọn. Schema đề xuất có thể triển khai trong storage phù hợp sau khi duyệt; tên bảng không là cam kết phải dùng SQL ngay.

### HIỆN TRẠNG
- Legacy: .data/accounts.json; .data/players/<userId>.json gồm revision/state/photos; phiên RAM; dữ liệu IndexedDB cũ riêng.
- Client quest v2 trong ZIP: QuestProgressState {version:2, legacy:ProgressState, quests:Record<questId,QuestRunProgress>}; run gồm startedAt, completedCheckpointIds, completedAtByCheckpoint, completedAt?. Có migrateQuestState từ v1 bọc legacy.
- Quest v2 có cấu trúc text/single-choice/photo/observation và acceptedAnswers trong bundle client; không tự coi là kiểm tra server an toàn. Một map questId → run không tương đương hỗ trợ nhiều lượt chơi lại.
- File JSON chỉ một tiến trình; queue RAM không là khóa liên tiến trình. Ảnh base64 làm snapshot nặng. Lỗi metadata/write còn trong source ZIP: ARCHITECTURE mô tả; không dùng làm mẫu lưu ảnh mới.

### Phân loại dữ liệu
Public: quest đã xuất bản, cover, reference photos, mô tả/phần nguồn được công bố. Private: hồ sơ, run, đáp án người chơi, memory/evidence photos, reward ledger, redemption, reports. Secret: password hash/salt, token/session, API keys và acceptedAnswers nếu cần giấu đáp án. Draft editorial: nội dung chưa duyệt, chưa public.

## Entities

| Thực thể đề xuất | Công dụng | Owner/phạm vi | Lưu giữ |
| --- | --- | --- | --- |
| users | Danh tính và profile | Một user | Retention/xóa ở O-06 |
| sessions | Phiên xác thực | Một user, secret token hash | Hết hạn/logout/thu hồi; policy cần chốt |
| avatar_catalog / user_avatar | Các lựa chọn và avatar đã xác nhận | Catalog public, cấu hình user private | Không xóa asset đang được dùng mà thiếu fallback |
| destinations | Địa lý nền, active/historical | Dự án | ID bền, giữ lookup lịch sử |
| quests / quest_versions | Định nghĩa hành trình và phiên bản bất biến | Dự án, public khi published | Run cũ cần đọc version cũ |
| content_translations | Nội dung VI/EN | Theo quest/version/entity | Đi kèm version, nguồn, người duyệt |
| checkpoints / challenges | Điểm dừng và thử thách | Quest/version | Hai challenge mục tiêu, không hardcode vào engine |
| challenge_secrets | Đáp án/điều kiện server | Server/editorial | Không public qua API/bundle |
| quest_runs | Lượt chơi của tài khoản | userId | Giữ resume/history theo O-06/07 |
| challenge_results | Kết quả, trợ giúp, evidence | user/run/challenge | Lịch sử bất biến hoặc audit có kiểm soát |
| photos | Metadata ảnh riêng | user, run?, challenge? | Xóa theo yêu cầu/quota; blob tách metadata |
| photo_content | Nội dung binary hoặc storage key | Cùng owner với photos | Không public bucket; policy xóa/backup rõ |
| reward_events | Sổ cấp/trừ Green Coin | user | Không tính từ trạng thái UI; audit theo policy |
| rewards / redemptions | Catalog item và lần đổi | Catalog public / giao dịch owner | Demo; không mặc định đối tác thật |
| operation_records | Chống gửi command lặp | user+operationId | Thời hạn cần duyệt, không vô hạn tự chọn |
| reports | Báo lỗi của người chơi | owner + người được phân công xử lý | Tối thiểu dữ liệu, retention cần chốt |

## Schema

### Quy ước chung đề xuất
ID opaque do server tạo, không dùng tên người hoặc đường dẫn file từ client. Timestamps chính thức do server, chuẩn UTC trong lưu trữ; render VI/EN theo locale. Trường optional phải phân biệt missing/null; null chỉ dùng khi có ý nghĩa. Khóa ngoại/unique phải thực thi trong DB hoặc lớp ghi nguyên tử tương đương. Không chỉ khai báo trong TypeScript. Các kiểu JSON nội dung phải có schema runtime.

### users và identity
users: id UUID/string PK; username:string required với unique usernameNormalized; usernameNormalized chuẩn hóa theo chính sách auth; email:string|null, emailNormalized:string|null unique nếu có; phoneE164:string|null unique nếu có; passwordHash:string required server-only; passwordSalt:string required nếu dùng scrypt hiện tại; avatarId FK|null; locale enum vi/en default vi; createdAt/updatedAt timestamp required. Không thêm role admin chỉ để quản lý source. Tên đăng nhập registration 2–100, password 6–128 là ràng buộc thấy trong hệ cũ, chưa là chính sách bảo mật cuối; profile update cũng phải áp cùng giới hạn nếu giữ.

sessions: id PK hoặc tokenHash unique; userId FK required; createdAt/expiresAt required; revokedAt nullable. Token gốc không lưu plaintext, không trả trong response JSON nếu dùng cookie. Provider/session backend chưa chọn. avatar_catalog: id PK, labelKey, imageKey, published bool. user_avatar nếu custom parts được duyệt: userId PK/FK, baseId và lựa chọn được allowlist; không nhận CSS/URL tùy ý.

### destinations và quest content
Destination: id string PK giữ ID cũ; name, position lat/lng có range; category/tags; active boolean; sourceUrls; coordinateSource; verifiedAt nullable; referenceAccuracyNote; historical ID giữ được. Position overview không đồng nghĩa cổng/checkpoint.
Quest: id PK, destinationId FK nullable cho trường hợp chưa mapping; slug unique nếu dùng route; publicationStatus draft/review/published/archived; currentPublishedVersion nullable; isDemo bool default false. QuestVersion: (questId,version) PK, startPoint/referencePhotoId, orderedCheckpointIds, contentStatusByLocale, safety content, source records, createdAt/approvedAt nullable. Version published bất biến; sửa tạo version mới, không làm run đang dở lệch câu hỏi.

Checkpoint: (questId,version,checkpointId) unique; orderIndex integer unique trong quest/version; position optional với source/verifiedAt; referencePhotoId nullable; storyBefore/storyAfter/instruction translation keys. Challenge: id trong questVersion required; checkpointId FK; type text/single_choice/photo/observation; prompt key; answerPolicyId; hintPolicyId nullable; rewardPolicyVersion; required boolean. Không tạo challenge cho mỗi đoạn story. Mỗi quest catalog mục tiêu có hai challenge, nhưng validator/runtime dùng số thật trong definition để không vỡ khi nội dung đổi.

ChallengeSecret: challengeId+contentVersion FK, acceptedAnswers hoặc correctOptionId server-only; normalizationPolicy enum/config allowlist; hint content; reveal content. Single-choice public options có optionId ổn định, localized label; correctOptionId không public. Không hash đáp án ngắn trong bundle rồi gọi là bí mật an toàn.

Translations: entityType/entityId/contentVersion/locale/fieldKey unique; value:string; status draft/review/published; source/approvedAt optional. UI dictionary có thể ở source, nội dung quest theo version. Missing EN phải báo thiếu, không dùng chuỗi EN giả. Thay locale không đổi các FK/ID hay đáp án người chơi đã lưu.

### quest_runs
id PK; userId FK required; questId+contentVersion FK required; locale vi/en; status briefing/locating/active/paused/completed/abandoned; currentCheckpointId nullable theo giai đoạn; currentStepKind nullable; revision integer>=0; startedAt required khi tạo run; pausedAt/completedAt/abandonedAt nullable với constraint trạng thái; updatedAt required; demo bool default false; completionQuality solved_all/with_skips nullable; policyVersion required.

Unique đề xuất: tối đa một run chưa kết thúc theo userId+questId (O-07), thực thi tại thao tác start. completed không tự cho tạo run mới nếu replay chưa được duyệt. Demo run tách thưởng thật. Một tài khoản mở hai tab cùng run dùng revision/operationId, không dùng tabId làm owner.

### challenge_results và attempts
ChallengeResult: (runId,challengeId) unique; owner suy từ run; status available/solved/skipped; submittedAt/completedAt nullable; usedHintIds:string[] unique; answerRevealed bool default false; evidencePhotoId FK|null; verificationMethod none/answer_rule/self_confirmation/photo_self_review; rewardEventId FK|null. Không có AI_verified khi không có dịch vụ. Submitted answer và attempts nếu lưu phải có giới hạn, mục đích và retention, không ghi mọi phím gõ. Network failure không tạo attempt incorrect. Hủy hint không thay usedHintIds.

ĐỀ XUẤT tách event history nhỏ khi cần audit, không mặc định event sourcing toàn app. Dữ liệu kết quả phải phân biệt skipped với solved, kể cả màn story sau skip có nội dung giống trả lời đúng.

### photos và photo_content
Photo metadata: id PK; ownerId FK required; purpose enum memory/evidence; runId FK required với evidence và ảnh gắn run; challengeId FK required khi evidence, nullable khi memory; status saved/deleted; contentKey required khi saved; mime=image/jpeg; byteSize>0; width/height>0; createdAt server timestamp; clientTakenAt nullable và không xác minh; source camera/file; qualityStatus unchecked/pass/review/fail; userOverride bool; deletedAt nullable; operationId; replacedByPhotoId nullable. ReferencePhoto là asset catalog riêng, không lưu vào bảng ảnh player như owner=system cùng quyền public.

Blob: nội dung JPEG đầy đủ, key do server chọn. Không đưa đường dẫn máy chủ, base64 hoặc signed URL dài hạn vào log/public list. Response list chỉ metadata, response content riêng kiểm tra owner. URL ngắn hạn nếu dùng vẫn là dữ liệu riêng, không nhúng vào catalog.

Quy tắc đề xuất: một evidence đang được liên kết trên mỗi run/challenge; memory có quota riêng cần chốt. Khi replace: ghi blob mới và metadata xong → chuyển liên kết → xóa blob cũ theo policy; thất bại giữ ảnh cũ. Khi delete: trạng thái/khả năng truy xuất và nội dung nhất quán; kết quả challenge có thể giữ tombstone/photoDeletedAt để không làm mất audit. Không giữ ảnh đã báo xóa ở album của owner khác.

### reward_events, rewards và redemptions
RewardEvent: id PK; userId FK; sourceType challenge/quest/redemption/adjustment_demo; sourceId; policyVersion; amount integer có dấu; createdAt server; demo bool; unique(userId,sourceType,sourceId,policyVersion) hoặc khóa nghiệp vụ tương đương chống thưởng lặp. Balance = tổng event hợp lệ theo scope demo/real, không tin balance client. Quy mô nhỏ có thể dùng giao dịch state nếu bảo đảm cùng bất biến, chưa bắt buộc thêm bảng nếu chưa cần.
RewardCatalog: rewardId PK, title/description translation, cost integer>=0, active, demo=true trong phạm vi hiện tại; limits xác định rõ. Redemption: id PK, userId FK, rewardId FK, costSnapshot, status committed/cancelled theo policy, operationId unique theo user, createdAt. Kiểm tra đủ xu và trừ trong cùng giao dịch. Giá reward đổi sau này không hồi tố số xu đã chi; legacy từng tính theo catalog hiện tại cần rà khi chuyển.

### operation_records và reports
OperationRecord: (userId,operationId) PK; payloadFingerprint; operationType; resourceId; status committed; responseSummary; createdAt/expiresAt theo retention được duyệt. Retry cùng payload trả cùng kết quả, payload khác →409. Không lưu blob hoặc password trong fingerprint payload logs; fingerprint không phải mục tiêu bảo mật thay auth.
Report: id PK; reporterId FK nếu signed-in; category directions/challenge/translation/app/other; questId/runId/challengeId optional được kiểm tra; text bounded; attachmentPhotoId optional owner-supplied; status received/triaged/resolved; createdAt. Không có dashboard admin bắt buộc; chưa có backend report thì không ghi nhận giả.

## Relationships

Một user có nhiều session/run/photo/rewardEvent/redemption. Run gắn một phiên bản quest bất biến và nhiều kết quả/ảnh. Challenge ở một phiên bản có kết quả khác nhau trên mỗi run. Evidence photo phải cùng user/run/challenge với kết quả. Quest có thể ánh xạ một destination; không dùng một-to-một vĩnh viễn vì tương lai có nhiều nội dung tại cùng nơi. Archive destination/quest không cascade xóa lịch sử player. Xóa tài khoản cần quy trình rõ cho blobs, reports, backups và sổ demo; chưa tự áp cascade production.

## Access rules

| Dữ liệu | Guest | Owner player | Player khác | Editor/operator |
| --- | --- | --- | --- | --- |
| Published catalog/reference image | Đọc | Đọc | Đọc | Sửa qua source/review được giao |
| Quest draft/secret answers | Không | Không qua public API | Không | Chỉ người có quyền editorial cụ thể |
| Profile riêng/session | Không | Đọc/sửa phần cho phép | Không | Không có UI truy cập mặc định |
| Run/results | Không | Đọc, gửi command hợp lệ | Không | Không tự sửa kết quả |
| Memory/evidence content | Không | Đọc/tạo/xóa trong policy | Không | Không đọc mặc định |
| Balance/redemption | Không | Đọc, yêu cầu đổi | Không | Không có chỉnh xu production được yêu cầu |

Server lấy user từ phiên; mọi FK client đưa phải kiểm tra cùng owner, không chỉ valid ID. X-Dana-User cũ là check tab consistency, không thay session authorization. Đường dẫn/bucket riêng không thay quyền kiểm tra endpoint.

## Queries and indexes

Đề xuất query: catalog published+locale+area; My Quests theo userId,status,updatedAt; album theo ownerId,status,createdAt+id cursor; run lookup userId+runId; unique outcome run/challenge; reward event theo user+source; operation theo user+operationId. Nếu dùng SQL, tạo index theo query đã đo; JSON hiện tại chưa có index. Không trả tất cả blob mỗi lần load run/ảnh nhiệm vụ; pagination metadata và fetch ảnh khi cần.

## Migrations and seed data

1. Kiểm kê bản ZIP, commit mốc, schema/storage thực và tất cả route đang ghi; không chỉ đọc tài liệu audit cũ.
2. Sao lưu dữ liệu và thử restore trong sandbox dữ liệu giả trước. Xác định quyền sở hữu IndexedDB cũ; không tự nhận user đăng nhập đầu tiên là chủ.
3. Giữ legacy IDs/version=1; lưu read-compatible đến khi migration mới có test. Quest v2 client trong ZIP không chứng minh đã migrate tài khoản server.
4. Mapping destination→quest và legacy mission→challenge chỉ áp khi có tương đương được duyệt; không tự chuyển 80% thành hoàn tất quest hai câu.
5. Import khô, so số record/hash blob, kiểm tra owner/balance/history; migration idempotent và có rollback dữ liệu, không chỉ revert code.
6. Seed dùng tài khoản/ảnh giả, không secret hoặc ảnh cá nhân. DUE draft có nguồn cần xác minh; 15 quest còn lại không đánh dấu published vì đủ số.
7. Backup phải gồm account/run và blob nhất quán; .corrupt file không thay backup. Retention/xóa backup chưa chốt O-06.

## Data validation

Runtime validate enum/ID/string/range và toàn bộ quan hệ. Các giới hạn ảnh tạm: đầu vào 10 MiB, output JPEG 3 MiB/1600 px; quota 40 ảnh/account là legacy, **không tự coi đủ cho 16 quest cộng memory/replay**. Chốt O-06 rồi align UI/server/tests. Ảnh có prefix JPEG không chứng minh decode hợp lệ; server cần kiểm tra file thực trong phương án được chọn. Mẫu GPS nếu dùng kiểm tra phải finite/range/time/accuracy đúng policy; không lưu tọa độ chính xác lâu dài nếu không có mục đích đã duyệt.

Cấm transition nhảy thứ tự, chấm ảnh chưa saved, evidence của user/run khác, reward lặp, số dư âm, xóa data khi chỉ serialize response. Độ chi tiết schema là đề xuất để review; chưa đồng nghĩa bất kỳ entity/bảng nào đã được tạo.


### Onboarding cục bộ — bổ sung v2.1
Yêu cầu sản phẩm: login lần đầu, browse Explore/detail sau logout. ĐỀ XUẤT key riêng dana-quest-onboarding-v1 với giá trị hoàn tất sau xác thực thành công; tên key là đề xuất chưa triển khai. Không lưu username/userId/password/token/GPS/ảnh trong cờ. Logout dọn private cache nhưng giữ dấu onboarding nếu theo phương án duyệt. Xóa dữ liệu browser làm mất dấu; không nhập dấu này thành account record hay dùng xác nhận quyền owner. Cần chốt deep link/reset/cross-device ở O-01 trước code. Locale preference có thể lưu local độc lập, không biến đổi ID/run hoặc dùng để suy user identity.



### Asset thiết kế và dữ liệu mẫu v2.2
Ảnh trong references/ui-design/assets là tài nguyên catalog trích để review, không photo record của player. Số 1/2, 2/2, 120/30/50 xu và quest title mẫu không seed vào account/database hoặc ghi ledger. Prototype không có storage/session. Thay asset demo/nhân vật sketch bằng asset được duyệt và metadata nguồn trước phát hành.
