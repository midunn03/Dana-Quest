# Đề xuất API và dịch vụ cho Dana Quest

Ngày rà soát: 31/10/2026. Phạm vi: source tại `Dana-Quest-nhanh-dung`, đối chiếu tài liệu chính thức của nhà cung cấp. Đây là báo cáo lựa chọn và thứ tự triển khai; chưa tích hợp, đăng ký dịch vụ, nhập khóa API, chuyển dữ liệu hoặc kiểm thử dịch vụ bằng tài khoản thật. Không kết luận dịch vụ nào có chất lượng tốt nhất tại Đà Nẵng khi chưa đo thực tế.

## Kết luận đề xuất

Giữ React và Django admin theo quyết định đã ghi trong `docs/TASKS.md`. Hướng ưu tiên là dùng Django làm backend nghiệp vụ thống nhất theo từng bước, PostgreSQL được quản lý để giữ dữ liệu, kho đối tượng riêng tư để giữ ảnh; bổ sung dịch vụ chuyên biệt cho email, thông báo, bản đồ và AI. Đây là đề xuất mới về kiến trúc runtime, không phải khẳng định việc hợp nhất backend đã được phê duyệt hoặc thực hiện.

Không thay toàn bộ bằng Firebase/Supabase Auth chỉ để có thêm đăng nhập Google. Có thể dùng PostgreSQL của Supabase mà vẫn giữ Django Auth; Supabase Database và Supabase Auth là hai phần khác nhau. Nếu muốn giao toàn bộ xác thực cho nhà cung cấp, phải thiết kế lại cách ánh xạ tài khoản người chơi với quyền Django admin và dữ liệu hiện có.

API giải quyết tốt những phần cần dữ liệu bên ngoài, mô hình AI, gửi thư hoặc hạ tầng vận hành. Luật quest, cộng xu, chống nhận thưởng lặp, phân quyền và trạng thái tiến độ vẫn cần backend được thiết kế và kiểm thử đúng.

## Những gì đã thấy trong dự án

| Phần | Bằng chứng trong source / tài liệu dự án | Hệ quả |
|---|---|---|
| Frontend | `package.json`: React, TypeScript, Leaflet | Không cần đổi giao diện để dùng dịch vụ mới |
| Runtime hiện tại | `vite.config.ts`: middleware Node phục vụ auth/game, proxy Django cho pixel/events | Có hai backend, cần xác định chủ sở hữu từng dữ liệu trước khi chuyển |
| Tài khoản Node | `server/auth.mjs`, `docs/ACCOUNT-SYNC.md`: tài khoản JSON, phiên RAM | Restart mất phiên; filesystem và nhiều tiến trình cần được xử lý |
| Django | `backend/config/settings.py`, `docs/REVIEW-FIX-REPORT-2026-10-31.md`: auth/admin/game đã có, SQLite, parity chưa đủ wallet/account/community | Không thể đổi proxy toàn bộ sang Django ngay rồi coi là xong |
| Ảnh | `server/account-data.mjs`, `docs/ACCOUNT-SYNC.md`: ảnh cùng dữ liệu tài khoản, giới hạn thử nghiệm | Tách byte ảnh khỏi JSON, giữ metadata và quyền sở hữu trong DB |
| Địa điểm | `server/places.mjs`: đã có Google Places Text Search, tùy khóa server | Đã có code tích hợp; chưa chứng minh đã bật trong môi trường chạy |
| Dẫn đường | `server/navigation.mjs`: Valhalla demo công khai | Cần nguồn vận hành phù hợp và đo tuyến thực tế |
| Bản đồ | `src/QuestPreviewMap.tsx`: tile.openstreetmap.org; Leaflet/pixel tile code đã có | Không coi tile cộng đồng là dịch vụ có cam kết vận hành |
| Sự kiện | `docs/EVENTS-IMPLEMENTATION.md`: catalog có nguồn, claim chống trùng, chưa có Web Push nền | Nâng nguồn lịch và kênh gửi là hai công việc riêng |
| Ảnh minh chứng | `src/lib/localImageCheck.ts`: kích thước, sáng/tối, độ chi tiết | Chưa nhận diện địa danh, không phải AI xác minh |
| Cộng đồng | `server/quest-community.mjs`: yêu thích, theo dõi, đánh giá lưu JSON | Chuyển DB và kiểm tra điều kiện ở server; UI chưa đủ làm bằng chứng |
| Xu và mã | `server/wallet.mjs`, `server/activation-store.mjs`: ledger/mã nội bộ; mã không phải thanh toán | Giữ luật riêng, dùng transaction và ràng buộc duy nhất |

README có đoạn lịch sử về IndexedDB; báo cáo này ưu tiên module runtime và tài liệu đồng bộ mới hơn. Không mở dữ liệu tài khoản, DB, ảnh thật hoặc tệp secret.

## Lựa chọn theo từng chức năng

| Chức năng | Lựa chọn ưu tiên | Cách dùng và điều kiện |
|---|---|---|
| Đăng ký, đăng nhập, phiên | Django Auth + django-allauth | Giữ username hiện tại nếu cần; thêm Google, xác minh email và luồng khôi phục. allauth là thư viện, không phải dịch vụ API bên ngoài. Hoàn thiện giới hạn thử đăng nhập và liên kết tài khoản, không tự gộp chỉ theo email chưa xác minh. [Django Auth](https://docs.djangoproject.com/en/5.2/topics/auth/), [allauth](https://docs.allauth.org/en/latest/) |
| Xác thực được quản lý thay thế | Supabase Auth hoặc Firebase Authentication | Chỉ chọn nếu muốn chuyển trách nhiệm quản lý tài khoản sang dịch vụ; phải có kế hoạch chuyển người dùng, phiên và quyền admin. Không lắp cả hai. [Supabase Auth](https://supabase.com/docs/guides/auth), [Firebase](https://firebase.google.com/docs/auth) |
| Gửi thư xác minh / quên mật khẩu / hỗ trợ | Resend | Backend tạo token và nội dung phù hợp, Resend chuyển thư. Cần domain gửi đã xác minh và theo dõi lỗi giao thư; không tự gửi thư trong đợt nghiên cứu. Nguồn chi tiết trong báo cáo dịch vụ đi kèm. |
| Tiến độ, hồ sơ, xu, voucher, mã, đánh giá | PostgreSQL được quản lý, có thể dùng Supabase Database | Một nguồn dữ liệu chuẩn; transaction cho hoàn thành/nhận thưởng/đổi quà, khóa duy nhất chống xử lý lặp. Nếu Django kết nối bằng role đặc quyền thì vẫn phải kiểm tra quyền ở backend, không giả định RLS tự bảo vệ mọi truy vấn. [Transaction Django](https://docs.djangoproject.com/en/5.2/topics/db/transactions/) |
| Album, ảnh minh chứng, avatar tải lên | Supabase Storage, bucket riêng tư | Django xác thực chủ ảnh; phát URL ký có hạn hoặc proxy đọc sau kiểm tra quyền. Nếu chỉ dùng Django Auth, cần lớp tích hợp server vì JWT/session không tự là token Supabase. Metadata trong DB, byte ảnh trong kho ảnh; xử lý upload mồ côi/xóa ảnh phải thiết kế riêng. |
| Quản trị địa điểm, quest và lịch | Django admin hiện có | Bổ sung bản nháp/đã duyệt, nguồn, thời điểm kiểm tra, lịch đổi/hủy và version quest. Không cần thêm CMS mới khi chưa có nhu cầu biên tập đặc biệt. Admin là công cụ nội bộ. [Django admin](https://docs.djangoproject.com/en/5.2/ref/contrib/admin/) |
| Nền bản đồ | MapTiler + Leaflet | Ứng viên thay tile công khai khi mở rộng, giữ giao diện bản đồ. Kiểm tra gói, ghi công và quyền xử lý giao diện pixel. Dịch vụ tile OSM công khai không có SLA, cấm tải hàng loạt để offline. [MapTiler/Leaflet](https://docs.maptiler.com/leaflet/), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) |
| Tuyến đi bộ, khoảng cách, rẽ | Giữ Valhalla; đổi sang máy chủ tự vận hành/nhà cung cấp phù hợp | So sánh cùng tuyến với openrouteservice trước khi quyết định. Máy chủ tự chạy cần CPU/RAM, dữ liệu và cập nhật; không tự nhiên miễn phí hoặc tốt hơn. [Valhalla](https://valhalla.github.io/valhalla/), [ORS](https://giscience.github.io/openrouteservice/api-reference/) |
| Giờ mở cửa, địa chỉ | Catalog được biên tập; Google Places là nguồn bổ sung tùy chọn | Hiện đã có adapter Google. Nên ánh xạ Place ID được xác nhận thay vì tin kết quả tìm kiếm đầu tiên. Kiểm tra quy định cache, attribution và hiển thị trên bản đồ trước khi bật; không tự ghép dữ liệu Google lên bản đồ OSM. [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies) |
| GPS và xác nhận có mặt | Geolocation API trình duyệt + luật server | Không cần mua API vị trí IP. Đổi dịch vụ tuyến đường không làm GPS điện thoại chính xác hơn. Xin quyền, kiểm tra tuổi tọa độ/sai số và có cách xử lý trường hợp GPS kém; chưa hứa chống giả vị trí. Giữ riêng chính sách DUE tự xác nhận bằng mắt, không áp GPS đại trà. [Geolocation](https://www.w3.org/TR/geolocation/) |
| Tìm kiếm địa điểm / gần tôi | Catalog hiện tại; PostgreSQL search, PostGIS khi cần | Với khoảng 15 điểm, tìm kiếm cục bộ đã đủ đơn giản. Khi dữ liệu tăng mới dùng chỉ mục địa lý và tìm kiếm có xử lý tiếng Việt. Không cần dịch vụ tìm kiếm thương mại ngay. [PostGIS trên Supabase](https://supabase.com/docs/guides/database/extensions/postgis) |
| Thời tiết trước khi đi quest | Open-Meteo | Dự báo theo điểm đến, mưa/nhiệt độ/UV, giờ cập nhật và cache ngắn phía server. Chức năng phụ, thời tiết lỗi không chặn quest. Free API dành cho phi thương mại theo điều kiện của họ; thương mại chọn gói phù hợp. [Docs](https://open-meteo.com/en/docs), [Terms](https://open-meteo.com/en/terms) |
| Lịch sự kiện | Django admin + nguồn ban tổ chức/địa phương | Không có cơ sở chọn một API toàn cầu để bảo đảm bao phủ và đúng lịch Đà Nẵng. Cần nguồn có quyền dùng, người duyệt, cập nhật hủy/đổi giờ; không suy ra lịch sự kiện chỉ từ AI. API đối tác chỉ thêm khi có dữ liệu mẫu và quyền truy cập được xác minh. |
| Nhắc sự kiện khi không mở trang | FCM Web Push + bộ lập lịch server | Push là kênh gửi; backend vẫn phải tạo job theo từng lần tổ chức, chống trùng, hủy job khi đổi/hủy lịch và bỏ token hết hạn. Kiểm thử Android/iOS/PWA; không hứa mọi máy nhận đúng giờ tuyệt đối. Chi tiết nguồn trong báo cáo dịch vụ đi kèm. |
| Chatbot hướng dẫn / gợi ý quest | Gemini API, thử một mô hình trước | Chỉ đưa dữ liệu quest đã duyệt vào ngữ cảnh; truy vấn địa điểm/tiến độ bằng hàm backend có quyền rõ. Giới hạn mức hint và không đưa đáp án bí mật vào context nếu không cần. AI không được tự cộng xu, đổi thưởng hoặc sửa tiến độ. [Gemini](https://ai.google.dev/gemini-api/docs) |
| Nhận xét ảnh minh chứng | Gemini image understanding ở vai trò hỗ trợ | Thử trên bộ ảnh thật được phép dùng: đúng/sai địa danh, ảnh tối, ảnh màn hình, trường hợp khó. Phải có trạng thái không chắc và xem xét thủ công. Không coi việc mô hình nhận ra cảnh vật là bằng chứng người chơi có mặt. [Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding) |
| Thuyết minh bằng giọng nói | Google Cloud Text-to-Speech | Tạo audio từ kịch bản VI/EN đã duyệt trước khi phát hành rồi lưu file để phát, giảm gọi API mỗi lượt nghe. Nghe thử phát âm tên địa danh. Chưa cần đàm thoại giọng nói trực tiếp. [Voices](https://cloud.google.com/text-to-speech/docs/list-voices-and-types) |
| Dịch VI/EN | Giữ bản dịch đã biên tập; Cloud Translation hỗ trợ soạn nháp | Dịch lúc biên tập, kiểm tra tên địa danh, manh mối và đáp án trước khi xuất bản. Không gọi dịch máy mỗi lần mở màn hoặc tự dịch đáp án làm đổi luật chấm. [Cloud Translation](https://cloud.google.com/translate/docs/overview) |
| Xu, bảng xếp hạng, mã kích hoạt | Backend riêng + PostgreSQL | Không cần API gamification khác. Ghi sổ thưởng, operation ID, transaction, quyền xem, opt-in leaderboard; kiểm tra điều kiện review/claim ở server. Điểm do client hoặc chatbot gửi không là nguồn chuẩn. |
| Báo lỗi / yêu cầu hỗ trợ | API ticket nội bộ + Django admin, Resend gửi xác nhận | Cần lưu ticket thật và trả mã tiếp nhận; tải file về máy không đồng nghĩa dự án đã nhận. Hạn chế dữ liệu cá nhân trong tệp đính kèm. Chưa cần thuê nền tảng hỗ trợ riêng khi quy mô nhỏ. |
| Theo dõi lỗi thực tế | Sentry cho React và backend | Ghi lỗi và request thất bại để biết nguyên nhân trên thiết bị thật; loại token, mật khẩu, nội dung ảnh và vị trí chính xác khỏi dữ liệu gửi đi. Không bật replay toàn bộ mặc định. |
| Chống đăng ký spam | Cloudflare Turnstile + rate limit backend | Xác minh token phía server; chỉ áp ở điểm dễ bị lạm dụng. CAPTCHA không thay thế rate limit hoặc quyền tài khoản. |
| Thanh toán thật nếu bán quest | Chưa chọn cổng trong đợt này | Hiện mã và xu là nội bộ/demo. Khi chốt bán hàng, xác định pháp nhân, quốc gia, tiền tệ và hoàn tiền rồi đánh giá nhà cung cấp có hợp đồng phù hợp. Webhook xác minh ở server, chống trùng và đối soát; không tự coi mã kích hoạt là giao dịch thanh toán. |
| Cài PWA, camera, chia sẻ, chế độ mất mạng | API trình duyệt và code hiện có | Không cần thuê API để có nút chụp/chia sẻ/cài app. Mất mạng cần trạng thái rõ; chỉ báo đã lưu khi server xác nhận. Nếu muốn tải bản đồ offline phải chọn nguồn có quyền offline, không tải hàng loạt tile OSM công khai. |

## Điểm cần sửa trước khi bổ sung nhiều dịch vụ

1. Chốt backend chủ dữ liệu theo từng phần. Đề xuất Django chủ dữ liệu nghiệp vụ, Node còn là adapter tạm trong giai đoạn chuyển; không để hai kho cùng ghi một tài khoản/xu.
2. Chuyển JSON/SQLite runtime thử nghiệm sang DB bền vững theo kế hoạch có sao lưu và rollback, giữ ID chủ sở hữu, quest run, mã đã nhận và ledger. Chuyển mật khẩu cần đánh giá định dạng băm; không giả định import tự động.
3. Tách ảnh khỏi JSON, giữ quyền riêng tư và kiểm tra chủ sở hữu ở server.
4. Giải quyết đáp án còn xuất hiện trong client theo `docs/QUEST-ANSWER-EXPOSURE.md`. Thêm API AI không làm đáp án bí mật nếu bundle đã chứa nó.
5. Hoàn thiện giám sát, sao lưu và diễn tập khôi phục. Đổi từ file sang cloud không tự chứng minh đã có bản sao khôi phục được.

## Thứ tự triển khai đề xuất

**Đợt 1 — nền tảng vận hành:** thống nhất ownership/backend, PostgreSQL, ảnh riêng tư, đăng nhập/khôi phục/email, Sentry. Bằng chứng đạt: cùng tài khoản trên hai thiết bị, restart không mất dữ liệu, hai lần gửi không nhận thưởng đôi, người A không đọc ảnh người B, khôi phục được bản sao lưu.

**Đợt 2 — trải nghiệm khám phá:** tile phù hợp vận hành, định tuyến được đo ngoài thực địa, nội dung và giờ mở cửa có nguồn, quản trị lịch và Web Push. Bằng chứng đạt: kiểm tra cầu/vỉa hè/cổng vào, GPS kém, đổi/hủy sự kiện, Android và iPhone PWA thật; API lỗi vẫn có trạng thái hữu ích.

**Đợt 3 — AI:** chatbot dựa nội dung duyệt, tiếp đến thuyết minh; nhận xét ảnh chỉ sau đánh giá. Bằng chứng đạt: bộ câu hỏi tiếng Việt/Anh, câu không biết, câu tìm cách lấy đáp án, nội dung sai nguồn, giới hạn chi phí, ảnh thiếu rõ ràng và dịch vụ AI bị lỗi.

## Chi phí, giới hạn và điều còn chưa biết

- Chưa biết số người dùng hoạt động, lượt tải bản đồ, số ảnh, thời gian giữ ảnh, lượt chat và ngân sách; chưa thể đưa tổng chi phí đáng tin. Không coi free tier là cam kết miễn phí lâu dài.
- Lập ngân sách theo: backend/DB/backup + GB ảnh lưu và tải + phiên bản đồ/lượt tính tuyến + email + token AI/ảnh AI + log/monitoring. Một lần GPS cập nhật không nhất thiết gọi lại API tuyến; chỉ tính lại khi cần.
- Quota và cảnh báo chi tiêu phải được cấu hình riêng; cảnh báo ngân sách không mặc nhiên là trần chặn cứng. Có giới hạn lượt dùng tại backend cho AI/dịch vụ tính phí.
- Gemini có khác biệt về xử lý dữ liệu giữa free và paid theo trang giá. Trước khi gửi ảnh người chơi hoặc nội dung riêng tư phải chọn điều kiện dịch vụ phù hợp; thử nghiệm dùng dữ liệu đã được phép. [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Google Places có ràng buộc cache/attribution/map. Code cache hiện tại cần được rà theo trường dữ liệu và điều khoản trước khi bật công khai; báo cáo này không kết luận tuân thủ chỉ từ một đoạn code.
- Giữ Django admin đã được ghi trong dự án; không có lý do thay CMS chỉ vì có dịch vụ mới.
- Không thể bảo đảm chất lượng tuyến đi bộ địa phương, tỷ lệ nhận đúng ảnh, giờ mở cửa hoặc push trên điện thoại chỉ bằng đọc tài liệu. Cần thử nghiệm có tiêu chí trước khi chốt nhà cung cấp.

Nguồn bổ sung cho auth/storage/email/push/monitoring/Turnstile nằm trong `API-SERVICES-RESEARCH-2026-10-31.md` cùng thư mục.
