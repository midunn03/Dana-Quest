# Kế hoạch nhập chức năng thu-dinhhuong vào Dana-Quest-nhanh-dung

Ngày: 02/11/2026. Trạng thái: CHỈ LẬP KẾ HOẠCH — chưa sửa mã, checkout, merge, cài dependency hoặc migrate dữ liệu.

## Mục tiêu và quyết định của chủ dự án

Đưa các chức năng của thu-dinhhuong vào ứng dụng hiện tại. Khi trùng chức năng, lấy hành vi và dữ liệu của nhánh nguồn làm chuẩn thay thế bản đang thử trong ứng dụng; không duy trì hai bộ chỉ đường, hai catalog sự kiện hoặc hai hệ cộng thưởng song song. Tích hợp phải bảo toàn dữ liệu người dùng và các lớp bảo mật hiện có.

Nguồn cố định: repo midunn03/Dana-Quest, commit 1e80c9d4583900f3c1b743d6d7a7c71b7d65c1de, nhánh thu-dinhhuong. Main trên GitHub tại lần rà là 37c6ded0c9fe44c77e9f09fb8220fc8be3ed4ea5. Không tự chạy theo một commit mới hơn khi đang thực hiện kế hoạch; nếu nguồn đổi cần đánh giá phần chênh lệch.

Đích là TOÀN BỘ working tree hiện tại của Dana-Quest-nhanh-dung, bao gồm file chưa commit và chưa theo dõi, không phải riêng commit HEAD. Không nhập vào thư mục publish.

## Kết quả rà lại

43 tệp nhánh nguồn khác main. Sau chuẩn hóa CRLF/LF, đối chiếu với working tree hiện tại: 24 tệp bị cả hai phía sửa; 16 tệp chỉ có thay đổi từ nguồn; 2 tệp CSS bị xóa ở đích nhưng nguồn sửa; 1 tệp sự kiện bị xóa ở nguồn nhưng đích sửa. Phép ghép văn bản trước đó báo 21 tệp conflict nội dung; con số đó không thay cho kiểm tra lại snapshot ngay trước khi thực hiện.

- Django local hiện đã trả managed/places/items qua /api/pixel/places và metadata sự kiện placeLat/placeLng/radiusM/notifyBefore/featured/sourceUrl. Frontend của nguồn khớp hợp đồng này hơn parser content cũ.
- Runtime Node local hiện có apiRateLimit và xử lý đường dẫn tĩnh an toàn hơn main gốc. Không được ghi đè server/index.mjs bằng bản nguồn làm mất các lớp này.
- QuestNavigationPage hiện render DueStartPage. Chỉ thay NavigationPage sẽ bỏ sót đường dẫn quest v2.
- EventProvider, EventSave, EventNotice và shared/event-policy hiện gắn với catalog cũ và /event-state theo tài khoản. Nhánh nguồn thay bằng eventStore/feed và eventNotifier. Phải chuyển các consumer trước khi xóa src/data/events.ts.
- Địa điểm Cầu Rồng trong nguồn có mô tả thử nghiệm và đường dẫn /media ảnh riêng. Lấy dữ liệu nguồn làm ưu tiên nhưng không coi ảnh đó đã được tải về; không chép DB/media thật giữa các môi trường một cách ngầm định.
- Green transit của nguồn có 13 trạm khai báo tĩnh, nút +5, dấu đã nhận trong localStorage. Chưa có xác minh thuê xe, đi xe buýt hoặc giao dịch thưởng qua server.
- Mô phỏng dùng tọa độ giả và có thể đặt arrived trên UI. Cần giữ chức năng demo nhưng không dùng kết quả đó làm bằng chứng hoàn thành/nhận thưởng thật.

## Quy tắc tích hợp

1. Chức năng trùng lấy nhánh nguồn; phần sửa bảo mật, owner guard, dữ liệu riêng, logo, token pixel và VI/EN local là lớp tương thích phải áp lên chức năng mới. Không phục hồi UI cũ toàn trang chỉ vì file nguồn chứa nó.
2. Không đổi hệ quản trị hoặc chuyển toàn bộ auth/DB. Giữ Django admin và kiến trúc hybrid hiện tại trong đợt nhập này; chỉ bổ sung adapter cần thiết.
3. Không ghi vào .data, db.sqlite3, backend/media trong kiểm thử; dùng dữ liệu giả và thư mục tạm. Dữ liệu cũ được giữ khi thay catalog/chức năng.
4. Không chạy git merge -X theirs, checkout --theirs cả cây hoặc chép đè 43 tệp. Xử lý theo từng nhóm chức năng, tích hợp các import và kiểu dữ liệu phụ thuộc.
5. Không push/merge main/deploy trong kế hoạch này. Không bật billing hoặc thêm API mới ngoài phạm vi nhánh nguồn.
6. Các điểm cần quyết định sản phẩm (demo được làm gì, thưởng xanh có quy đổi không, mục đã lưu cũ chuyển thế nào) được trình bày ở cuối, không tự biến thành luật đã duyệt.

## Thứ tự thực hiện khi được yêu cầu sửa mã

### Bước 0 — Chụp trạng thái và làm baseline

Đầu vào: working tree đích và commit nguồn cố định.

- Kiểm kê tracked/untracked, nhánh, HEAD và diff; chụp bản sao toàn thư mục trước thay đổi lớn, gồm các tệp chưa commit. Bản sao chứa dữ liệu riêng phải lưu ở vị trí riêng tư, không add Git/upload.
- Làm bản tích hợp thử trong thư mục riêng với snapshot local đầy đủ; không chỉ tạo worktree từ HEAD vì sẽ thiếu các sửa local.
- Chạy baseline build, lint, web tests và Django tests theo lệnh bên dưới bằng dữ liệu thử. Ghi lỗi/cảnh báo có sẵn để so sánh.
- Lập danh sách chính xác tệp ghi/sửa/xóa cho từng bước; kiểm tra local không tiếp tục bị sửa đồng thời trước khi áp kết quả.

Đạt khi: khôi phục được snapshot, biết baseline thực và không dùng tài khoản/DB thật để test.

### Bước 1 — Hợp đồng địa điểm và proxy Django

Tệp chính: server/index.mjs, server/navigation.mjs; src/data/destinations.ts, src/lib/placeContent.ts, src/lib/useLiveVisitInfo.ts; thêm src/PlaceArt.tsx, src/CrowdChart.tsx. Đối chiếu backend/pixels/views.py và backend/events/views.py.

- Lấy parser managed/places/items, danh sách động và cơ chế refresh của nguồn; một store địa điểm dùng chung map/list/detail/navigation.
- Nhận ảnh, crowd 18 mức cho 6–23 giờ và thông tin tham quan từ admin. Dữ liệu crowd là biên tập, không gắn nhãn realtime.
- Proxy /api/pixel, /api/events, /media tới Django trong server production Node; giữ rate-limit, kiểm tra đường dẫn và các API hiện hữu. Django không chạy phải trả lỗi API có nghĩa, không trả HTML index làm JSON thành công.
- Lấy hỗ trợ dlat/dlng trong vùng nguồn giới hạn; không thay kiểm tra tọa độ hợp lệ hoặc bỏ kiểm soát tần suất. Tọa độ đích do client gửi chỉ dùng dẫn đường, không tự quyết định hoàn thành quest.
- Phân biệt managed:false (fallback mẫu), managed:true với places:[] (không tự hồi sinh địa điểm admin đã tắt), lỗi mạng (giữ dữ liệu tải thành công gần nhất, báo lỗi phù hợp).
- Giữ ID cũ và lookup lịch sử để tiến độ vẫn đọc được. Địa điểm động mới cần server kiểm tra có trong catalog hợp lệ trước khi nhận gameplay; API dẫn đường hỗ trợ không đồng nghĩa đã hỗ trợ thưởng cho mọi ID mới.

Đạt khi: địa điểm admin xuất hiện ở các màn liên quan, list/map thống nhất, ảnh thiếu có fallback, mất Django không phá login và không báo có dữ liệu giả.

### Bước 2 — Thay giao diện địa điểm và bản đồ Explore

Tệp chính: src/Explore.tsx, src/Explore.css, src/DestinationDetails.tsx, src/DestinationSheet.tsx, src/DestinationPage.tsx, src/AdminGallery.tsx, src/data/missions.ts, src/lib/progress.ts; nơi hiển thị địa điểm trong Album/Celebration.

- Lấy PlaceArt, crowd chart và nội dung admin của nguồn làm chuẩn; chuyển các consumer tĩnh sang store động.
- Bỏ pixel hóa nền tile ở Explore theo nguồn; giữ artwork/marker nhân vật pixel và attribution. Chỉ xóa pixelTiles.ts sau khi kiểm tra hết import.
- Không khôi phục MapCompact.css/MobileLayout.css đã được local loại bỏ: đưa các thay đổi layout cần thiết của nguồn vào stylesheet đang sở hữu màn tương ứng, không tạo hai hệ CSS.
- Đưa nội dung/nhiệm vụ có fallback khi trường admin thiếu; giữ dữ liệu tiến độ của địa điểm đã bị xóa. Không làm validation phía server yếu hơn chỉ để client đọc được dữ liệu.
- Lấy bản ghi địa điểm từ nguồn; ghi rõ nội dung Cầu Rồng còn là dữ liệu thử để chủ dự án duyệt, không tự viết lại thành nội dung chính thức. Ảnh /media thiếu không lấy ảnh từ DB thật một cách tự động.

Đạt khi: địa điểm thêm/sửa/tắt trong admin phản ánh đúng UI, lịch sử vẫn đọc được, VI/EN không mất, không lỗi import hay stylesheet.

### Bước 3 — Thay bộ dẫn đường và nối vào mọi đường vào

Tệp chính: src/NavigationPage.tsx/.css, src/JourneyTrack.tsx, src/lib/routeStages.ts, src/lib/routing.ts, src/lib/useWalkingRoute.ts, src/lib/location.ts, src/LocationCheck.tsx; tích hợp src/QuestNavigationPage.tsx và src/DueStartPage.tsx, điều chỉnh route trong App chỉ ở phần cần thiết.

- Lấy chỉ dẫn rẽ, hướng di chuyển, ETA, follow/recenter, overview, sheet và chia tối đa 4 chặng của nguồn.
- Lấy reroute với khoảng tối thiểu 8 giây, ngưỡng lệch min(60,max(35,accuracy×1.5)) và retry 5/10/20/30 giây của nguồn; kiểm tra phù hợp dịch vụ Valhalla hiện dùng, không gọi lại mỗi GPS tick.
- Giữ tuyến cũ mờ khi tính lại, không phát chỉ dẫn rẽ cũ lúc đã lệch; đường chấm quay về chỉ là gợi ý tới tuyến, không tự nhận là đường đi an toàn.
- Reset toàn bộ route đầu, chặng, baseline, heading và retry khi đổi điểm đến; loại GPS cũ/không đủ chính xác. Tiến độ đi đường không thay tiến độ giải đố.
- Cho đường tới điểm bắt đầu quest v2 sử dụng cùng bộ dẫn đường mới; DueStartPage tiếp tục sở hữu briefing/ảnh nhận diện/xác nhận bắt đầu theo chính sách đã duyệt. Không lặng lẽ đổi luật đến nơi của mọi quest thành GPS bắt buộc.
- Dịch nhãn mới sang VI/EN và dùng token hiện hành thay các màu/font hardcode xung đột, giữ chức năng nguồn.

Đạt khi: cả đường địa điểm và đường tới quest mở được dẫn đường mới, lệch tuyến/tính lại/đổi điểm hoạt động, không mở checkpoint hay thưởng chỉ nhờ thanh đường đi đạt 100%.

### Bước 4 — Mô phỏng và nhắc đứng lâu

Tệp chính: NavigationPage; phần state/helper mô phỏng có thể tách riêng nếu cần tránh một component quá lớn; tests mô phỏng mới.

- Giữ đầy đủ bật/tắt, pause và tốc độ demo của nguồn; nhãn DEMO luôn nhìn thấy. Dùng tọa độ giả trong lớp hiển thị demo riêng, không gửi làm sample thực cho API hoàn thành, wallet hoặc claim.
- Dừng demo quay về vị trí thật; thoát màn thì dọn timer, rung và marker. Tránh vòng tính lại tuyến làm reset đường mô phỏng.
- Giữ lời nhắc đứng lâu khoảng 16 giây và khoảng kiểm tra 4 giây như nguồn, có để sau/tắt. Tạm ngừng khi app ẩn, arrived, demo, GPS lỗi hoặc không có mẫu mới; tránh coi người chờ qua đường là cố tình trì hoãn.
- Rung là tùy chọn theo hỗ trợ thiết bị; reduced-motion không mất nút, trạng thái và cảnh báo.

Đạt khi: demo xem được toàn bộ tuyến nhưng không tạo bằng chứng đến nơi/hoàn thành/coin thật; không còn timer chạy sau khi rời màn.

### Bước 5 — Thay nguồn và cơ chế sự kiện cũ

Tệp nguồn: src/lib/eventStore.ts, src/lib/eventNotifier.ts, src/lib/events.ts, src/lib/eventReminders.ts, src/EventsPage.tsx, src/EventDetailsPage.tsx. Tệp local phải xử lý phụ thuộc: App.tsx, EventProvider.tsx, EventSave.tsx, EventNotice.tsx, EventDemo.tsx, src/lib/eventContext.ts, accountFeatures.ts, server/account-features.mjs và shared/event-policy.mjs.

- Nguồn sự kiện chính là /api/events/feed Django, làm mới mỗi phút như nguồn; bỏ catalog cityEvents chạy song song sau khi chuyển toàn bộ consumer.
- Cơ chế phát thông báo chính là featured/nearby + notifyBefore của nguồn. Chỉ có một nơi phát; không giữ bộ claim/invite cũ chạy cùng notifier mới.
- Bổ sung loading/empty/error và kiểm tra GPS mới/đủ chất lượng trước thông báo theo vị trí. Đây vẫn là thông báo khi ứng dụng hoạt động, không thêm FCM/Web Push trong lần nhập nhánh.
- Dấu đã thông báo phải theo tài khoản và lần tổ chức; tôn trọng tắt thông báo, tránh rò lựa chọn giữa người dùng chung máy. Chống lặp nhiều tab/thiết bị cần server nhận claim theo eventId/start, không chỉ localStorage chung như nguồn.
- Nút lưu/tham gia còn dùng thì chuyển sang ID sự kiện Django; không giữ catalog cũ làm nguồn hoạt động. Lựa chọn sự kiện cũ giữ dạng lịch sử hoặc chuyển qua bảng ánh xạ đã xác nhận, không tự gán event ID số mới theo tên.
- Các endpoint cũ có thể giữ adapter đọc dữ liệu trong giai đoạn chuyển; không còn tác vụ phát thông báo cũ chạy nền. Chỉ xóa src/data/events.ts khi không còn runtime import; shared helper chỉ xóa khi hết consumer thực.

Đạt khi: map/list/detail lấy cùng lịch Django, không báo đôi, tắt thông báo có tác dụng, đổi tài khoản không nhận trạng thái người trước; dữ liệu đã lưu cũ không bị xóa.

### Bước 6 — Di chuyển xanh

Tệp chính: src/data/greenTransit.ts, src/lib/ecoTransit.ts, NavigationPage; nếu được duyệt thưởng thật thì bổ sung endpoint xác thực và nguồn ledger trong server/wallet.mjs cùng tests.

- Lấy 13 trạm và giao diện marker/banner từ nguồn. Ghi dữ liệu tĩnh, kiểm tra tọa độ/nguồn ngoài thực địa trước phát hành; không gọi là tồn xe/lịch xe realtime.
- Giữ chức năng trải nghiệm nhận thưởng demo để thử, nhưng nhãn nút không được tự nhận đã thuê xe. Xem gói này là mô phỏng nếu chưa có bằng chứng từ nhà cung cấp hoặc cơ chế xác minh được duyệt.
- Không nhập localStorage dana_claimed_eco_transit vào ví thật hoặc chuyển tự động sang tài khoản. Nếu cần giữ thì tách lịch sử demo, không quy đổi.
- Nếu chủ dự án muốn thưởng thật +5, phải chốt hành động được thưởng và bằng chứng. Server tự tra trạm/mức thưởng, xác thực người dùng, chống lặp và trả ví sau commit; client không tự tăng balance qua CustomEvent. Đứng gần trạm không chứng minh đã đi xe buýt/thuê xe.

Đạt khi: phần hiển thị nguồn đầy đủ; demo tách khỏi ví thật. Thưởng quy đổi chỉ nghiệm thu sau khi có luật xác minh và test server riêng.

### Bước 7 — Dọn trùng, kiểm thử và bàn giao

- Xóa code cũ chỉ sau khi không còn import và có chức năng thay thế đã chạy. Không đổi tên ID/khóa lưu hoặc tự xóa dữ liệu riêng trong bước dọn.
- Test thay đổi hành vi viết theo chuẩn nguồn mới, đồng thời giữ regressions bảo mật/tài khoản/lưu ảnh/ledger. Không xóa test bảo vệ chỉ để build xanh; test cho hành vi bị thay thế phải ghi rõ lý do.
- Cập nhật ROUTING, EVENTS, USER-FLOWS, ENV, CHANGELOG và DOC-INDEX theo kết quả thật; chỉ một mô tả hiện hành cho mỗi chức năng.
- Bàn giao diff nhóm chức năng, kết quả test, ảnh browser, giới hạn thiết bị/dữ liệu chưa thử. Chỉ áp về dự án chính sau khi bản tích hợp riêng đạt kiểm tra và được yêu cầu thực hiện theo phạm vi này.

## Ma trận kiểm chứng

| Nhóm | Trường hợp bắt buộc |
| --- | --- |
| Dữ liệu admin | managed:false; managed:true rỗng; thêm/sửa/tắt; ID cũ còn tiến độ; URL ảnh thiếu; crowd sai dạng |
| API/proxy | Django tắt/timeout; media không tồn tại; JSON sai; path xấu; rate limit hiện hữu còn tác dụng |
| Dẫn đường | GPS cũ/kém; lệch tuyến; cải thiện accuracy; đổi điểm; API lỗi và retry; rời màn đang fetch; tuyến ngắn; không có tuyến |
| Quest v2 | đường tới điểm đầu; briefing/ảnh; xác nhận thật khác demo; chưa đến không nhận hoàn thành giả |
| Sự kiện | featured/nearby; ngoài bán kính; GPS stale; đổi giờ/hủy; nhiều tab; đổi tài khoản; tắt nhắc; đã lưu cũ |
| Thưởng xanh | demo không cộng ví; gửi lặp; đổi tài khoản; không gửi số xu tự do; chưa có bằng chứng không báo thuê xe thành công |
| Hồi quy | login/avatar/logout; ảnh riêng; quest legacy/v2; ví/đổi thưởng; dữ liệu hỏng không bị ghi đè |
| Browser | 390/768/1440, VI/EN; bàn phím/focus; sheet drag; reduced-motion; Android/iPhone GPS ngoài thực địa khi có thiết bị |

Lệnh baseline/final: npm.cmd run build; npm.cmd test -- --maxWorkers=2; npm.cmd run lint. Django: python backend/manage.py test accounts game pixels events --settings=config.test_settings, dùng Python thực có sẵn (không Microsoft Store stub) và guard dữ liệu thử theo quy trình dự án. Không đổi test settings để trỏ DB thật. Lỗi môi trường phải được báo riêng, không coi test chưa chạy là đã pass.

## Những phần cần chủ dự án duyệt trong kế hoạch

- Đề xuất mặc định: nhập chức năng demo nhưng tách hoàn toàn khỏi hoàn thành và tiền thưởng thật.
- Đề xuất mặc định: giữ lịch sử đã lưu sự kiện cũ, chuyển UI hoạt động sang nguồn Django và không tự ánh xạ ID cũ sang mới nếu thiếu đối chiếu.
- Đề xuất mặc định: nhập dữ liệu trạm xanh và giao diện nguồn, +5 chỉ là demo cho đến khi có luật xác minh được duyệt. Muốn thưởng thực cần chốt loại bằng chứng và một kế hoạch ledger bổ sung.

Các điểm này không cản việc lập kế hoạch; cần được xác nhận trước khi thực hiện các phần phụ thuộc. Toàn bộ chức năng khác lấy nhánh nguồn làm chuẩn theo yêu cầu mới nhất, giữ dữ liệu/bảo mật/VI-EN hiện hành.

## Trạng thái sau lượt này

Chỉ thêm file kế hoạch này. Chưa nhập bất kỳ source nhánh nào vào ứng dụng, chưa chạy migration, chưa thử build/test nhánh trên dữ liệu hiện có, chưa đổi Git branch/HEAD và chưa push.
