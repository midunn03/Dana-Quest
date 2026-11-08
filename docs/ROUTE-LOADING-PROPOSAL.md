# G4 — Đề xuất tải theo route sau khi giao diện ổn định

Ngày31/10/2026. **CHỈ ĐỀ XUẤT.** Không đổi lazy import, route, guards hoặc cấu hình build trong nhóm G. Chỉ triển khai tối ưu sau nhóm F ổn định và được duyệt.

## Mốc đo và hiện trạng

Build được xác minh cuối nhóm Django: main JS **445.04kB,136.97kB gzip** theo số Vite in ra. Mốc440kB/130kB trong yêu cầu là tham chiếu cũ, không phải kết quả đo mới. Cảnh báo500kB áp cho chunk theo cấu hình build; không đổi ngưỡng để làm mất cảnh báo. Main chunk không đại diện toàn bộ JS tải theo route.

`src/App.tsx` đã lazy10 màn: DestinationDetails, AlbumPage, QuestDetailsPage, QuestPlayPage, CreatorPage, EventsPage, EventDetailsPage, Explore, NavigationPage, QuestNavigationPage. Không làm lại việc tách các màn này rồi báo là tiết kiệm mới. QuestDetailsPage còn lazy QuestPreviewMap; QuestPlayPage lazy DueMap.

Các import trực tiếp còn có ShopPage, AccountPage, AvatarPage, CameraPage, DestinationPage, CelebrationPage, BookingPage, InformationPage, OnboardingPage và DiscoveryPage. Chưa thể kết luận đóng góp của từng màn chỉ từ số dòng; dependency dùng chung có thể vẫn ở chunk chính.

**Admin Django nằm ở `/admin/`, server-rendered, không có React admin route trong App.** `AdminGallery.tsx` là gallery hiển thị ảnh nội dung từ admin, không phải trang quản trị. Không tách nó như một route admin giả.

## Ưu tiên đề xuất

1. Đo import graph sau F, chọn ShopPage/Album đã có lazy/Camera/Avatar hoặc trang thông tin ít dùng dựa trên đóng góp thật. Album chỉ kiểm tra chất lượng tải hiện tại, không báo lại là candidate chưa lazy. Giữ Home/auth/navigation cốt lõi nhỏ nhưng sẵn dùng.
2. Tách lần lượt một màn import trực tiếp có đóng góp đáng kể; giữ nguyên hash matcher, props, route guards, focus, scroll restoration, trạng thái quest và owner lifecycle.
3. CSS vẫn thuộc màn/component như nhóm F; kiểm tra flash nội dung chưa có style khi tải chunk. Không dùng lazy để che xung đột CSS chưa giải quyết.
4. Provider Auth/Locale/Event và navigation guards không đổi lifecycle chỉ để giảm số kB. Không preload tất cả route ngay sau Home vì sẽ triệt lợi ích tải ban đầu.
5. Xử lý tải chậm/lỗi chunk bằng trạng thái có thể tiếp cận và retry hữu hạn; không tự chuyển Home, bỏ quest, reset progress hay lặp reload. UI mới cho lỗi tải cần duyệt riêng nếu vượt restyle.

## Phép đo trước/sau khi triển khai

| Phép đo | Cách so sánh |
| --- | --- |
| Build main và tổng chunks | Cùng lockfile/Node/build config; lưu raw+gzip trước/sau. Không chỉ so tên file/hash |
| Tải lạnh Home/Discovery | Cache tắt, cùng mạng/viewport/locale; tổng JS+CSS request ban đầu, thời gian hiển thị/nút dùng được |
| Vào Shop/Account/Quest | Bytes bổ sung và độ trễ lần đầu/lần hai; không đánh đổi initial-load nhỏ lấy waterfall quá chậm |
| Deep link và import thất bại |390/1440px VI/EN, mạng chậm/offline; không mất session/phase/progress/navigation guard |
| Test/build/lint | Full suite vẫn xanh; không tăng cảnh báo lint, không sửa expectations/500kB threshold để pass |

Không đặt trước con số tiết kiệm chưa đo. Nếu dependency chung giữ main gần như cũ hoặc UX xấu hơn, bỏ lát tách đó và ghi kết quả. Giảm source line count không được tính là giảm network payload.

## Phạm vi không thuộc đề xuất này

Không đổi font, tối ưu ảnh nguồn, Web Push, nền OSM, camera/GPS hoặc catalog secret. Việc đáp án vẫn có trong chunk không được giải quyết bằng lazy loading; A4 là gate riêng trước thưởng thật/xếp hạng/phát hành công khai.

## CẦN CHỐT

Sau khi F ổn định: duyệt danh sách candidate từ đo thực tế và yêu cầu trải nghiệm tải lỗi. Hiện chưa triển khai hay có số đo sau lazy-load. GPS/camera thiết bị thật, Safari/iOS, tải nhiều người dùng, HTTPS/proxy và nội dung16quest(O-09) chưa được xác minh.
