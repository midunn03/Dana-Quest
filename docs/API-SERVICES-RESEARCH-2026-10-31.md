# Nghiên cứu dịch vụ nền tảng cho Dana Quest

Ngày đối chiếu: 31/10/2026. Phạm vi: tài khoản, dữ liệu, ảnh, email, push, theo dõi lỗi và chống bot. Đây là đề xuất kiến trúc, chưa tích hợp hoặc mua dịch vụ.

## Kết luận đề xuất

Dự án đã có **Django backend/admin được quyết định giữ lại** theo `docs/REVIEW-FIX-REPORT-2026-10-31.md`; Node JSON vẫn là đường chạy mặc định và độ tương đương tính năng giữa hai backend cần rà tiếp. Vì vậy đề xuất chính là thống nhất nơi quản lý tài khoản và luật chơi quanh kiến trúc đã chọn, dùng **Postgres được quản lý** cho dữ liệu bền vững, **Resend** cho email, **Sentry** cho lỗi và object storage cho ảnh. Có thể dùng Supabase chỉ như nhà cung cấp Postgres/Storage; không mặc định thay toàn bộ auth bằng Supabase Auth. Web Push và Turnstile bổ sung theo nhu cầu.

Theo `docs/ACCOUNT-SYNC.md`, tài khoản hiện ở `.data/accounts.json`, dữ liệu chơi/ảnh trong `.data/players`, phiên trong RAM; có đồng bộ qua cùng backend nhưng chưa có hàng đợi offline. Lưu JSON và ảnh cùng dữ liệu phù hợp thử nghiệm nhỏ; chuyển sang dịch vụ cần di chuyển dữ liệu có kiểm chứng, giữ user ID hoặc bảng ánh xạ, không tạo tài khoản mới làm mất tiến độ.

## Tài khoản và phân quyền

**Django auth + django-allauth** là hướng ưu tiên đánh giá nếu Django tiếp tục làm backend chính: Django đã có tài khoản, quyền và phiên cookie; allauth bổ sung luồng tài khoản, email, nhà cung cấp Google và headless API cho frontend riêng. Đây là thư viện tích hợp trong backend, không phải dịch vụ bên ngoài tự vận hành thay dự án. Cần thống nhất tài khoản player/admin và kiểm thử liên kết danh tính để tránh hai nguồn tài khoản. Nguồn: [Django auth](https://docs.djangoproject.com/en/5.2/topics/auth/), [django-allauth](https://docs.allauth.org/en/latest/).


**Supabase Auth**, phương án thay thế nếu chủ động quyết định chuyển auth sang dịch vụ quản lý, cung cấp mật khẩu, OTP/magic link và đăng nhập xã hội; token tích hợp với Postgres RLS. Đề xuất dùng email/mật khẩu và Google trước; xác định rõ cách giữ trải nghiệm tên đăng nhập hiện tại vì không phải thay SDK là giữ nguyên mọi hành vi. Nguồn: [Auth](https://supabase.com/docs/guides/auth).

**Firebase Authentication** là phương án thay thế hợp lệ, có SDK web và nhiều phương thức đăng nhập. Nó không tự chuyển tiến độ game sang database và không tự thay toàn bộ backend. Chọn nếu đội phát triển muốn hệ sinh thái Firebase; không dùng đồng thời hai hệ quản lý danh tính nếu không có lý do rõ. Nguồn: [Firebase Auth](https://firebase.google.com/docs/auth), [Web setup](https://firebase.google.com/docs/auth/web/start).

**RLS** cần kiểm soát người dùng đọc/sửa đúng dữ liệu của mình. Không đưa khóa service-role vào trình duyệt. Dù có RLS, client không được tự đặt số xu hoặc đánh dấu hoàn thành: giữ kiểm tra đáp án, điều kiện checkpoint, cộng thưởng và đổi voucher trên server; dùng giao dịch, ràng buộc duy nhất và operation ID để chống ghi lặp. Đây là yêu cầu triển khai của Dana Quest. Nguồn tính năng: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database functions](https://supabase.com/docs/guides/database/functions).

## Ảnh và album

**Supabase Storage** hợp khi đã dùng Auth/Postgres; nếu giữ Django auth thì backend phải chủ động kiểm tra quyền và cấp quyền truy cập object, không mặc định có JWT/RLS người dùng Supabase: lưu file riêng, database giữ metadata và quan hệ owner/run/checkpoint; policy Storage dùng RLS. Đề xuất bucket riêng tư, kiểm tra quyền lúc tải lên/xem/xóa, không biến album riêng thành URL công khai. SDK không tự kiểm tra ảnh có đúng nhiệm vụ hoặc người chơi có đến địa điểm thật. Nguồn: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## Email xác minh, đặt lại mật khẩu và OTP

**Resend** dùng gửi email qua API/SMTP; kết nối với Django/allauth hoặc Supabase Auth đã chọn, giữ token đặt lại mật khẩu do hệ auth tạo thay vì tự phát minh luồng token. Supabase nói rõ SMTP mặc định phục vụ thử nghiệm, không phù hợp production. Resend cần tên miền sở hữu và xác minh DNS; phải cấu hình domain gửi, xử lý bounce và giới hạn gửi. Chưa có domain phù hợp thì đây là bước chuẩn bị trước khi phát hành. Nguồn: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Resend domains](https://resend.com/docs/dashboard/domains/introduction), [Node API](https://resend.com/docs/send-with-nodejs).

## Thông báo sự kiện khi không mở app

**FCM Web** nhận push trên trình duyệt hỗ trợ Push API, cần HTTPS, service worker, quyền thông báo và token đăng ký. Backend vẫn phải có lịch gửi bền vững, xử lý đổi/hủy lịch sự kiện, token hết hạn và tránh gửi hai lần. FCM không tự sửa bộ đếm giờ chạy trong trang thành lịch nhắc trên server. Nguồn: [FCM web client](https://firebase.google.com/docs/cloud-messaging/js/client).

Trên iOS/iPadOS, Web Push hỗ trợ cho web app thêm vào Home Screen từ phiên bản 16.4; xin quyền sau thao tác người dùng. Cần kiểm thử điện thoại thật; không hứa mọi trình duyệt đều nhận hay thông báo luôn đến đúng phút. Nguồn: [WebKit Web Push](https://webkit.org/blog/13878/), [Apple guide](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).

## Theo dõi lỗi và chống bot

**Sentry React SDK** phù hợp thu thập lỗi React trong ứng dụng. Đề xuất gắn bản phát hành, ngữ cảnh route/chức năng và dấu vết lỗi backend; lọc dữ liệu nhạy cảm, không gửi mật khẩu, ảnh riêng hoặc GPS chính xác vào log. Sentry giúp phát hiện lỗi sau triển khai, không tự sửa lỗi. Nguồn chính chủ: [SDK React](https://github.com/getsentry/sentry-javascript/tree/develop/packages/react).

**Cloudflare Turnstile** có thể bổ sung chống đăng ký/reset/chatbot tự động. Bắt buộc backend gọi Siteverify; widget client đơn lẻ không đủ. Token có hạn 5 phút và dùng một lần. Vẫn cần rate limit theo hành động/tài khoản; Turnstile không chứng minh người chơi đã đến địa điểm và không thay xác thực. Nguồn: [Server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Chi phí và điều kiện chốt dịch vụ

Không dùng nhãn “free” để cam kết production miễn phí. Ước tính theo người dùng hoạt động, database, số ảnh/dung lượng, băng thông, email, lượt AI và dữ liệu quan sát lỗi. Supabase có quota và gói Free có thể pause do không hoạt động; backup/phục hồi phải chọn theo gói. Resend có hạn mức gửi theo gói. Kiểm tra lại trước mua tại [Supabase pricing](https://supabase.com/pricing), [Resend pricing](https://resend.com/pricing), [Firebase pricing](https://firebase.google.com/pricing), [Sentry pricing](https://sentry.io/pricing/), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/).

Thứ tự thực hiện: (1) schema/database và cách di chuyển tài khoản/tiến độ, (2) Auth và quyền truy cập, (3) tách ảnh sang Storage, (4) email tài khoản và quan sát lỗi, (5) push và chống lạm dụng theo lưu lượng. Sau mỗi bước kiểm chứng quyền giữa hai tài khoản, retry không cộng thưởng lặp, lỗi mạng không báo lưu giả, và khôi phục dữ liệu từ backup.

