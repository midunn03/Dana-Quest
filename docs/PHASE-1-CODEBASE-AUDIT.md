# Dana Quest — Phần 1: Kiểm kê dự án trước khi thay đổi

Ngày kiểm kê: 21/10/2026

## 1. Mục tiêu và phạm vi

Phần này tạo đường cơ sở kỹ thuật trước khi đưa workflow và gameplay mới vào Dana Quest. Chưa thay đổi giao diện, route, dữ liệu người chơi hay hành vi đang chạy.

Nguyên tắc cho các phần sau:

- Không xóa logic cũ trước khi có logic thay thế và đường chuyển dữ liệu.
- Giữ ID địa điểm hiện có để không làm mất tiến trình và ảnh đã lưu.
- Mỗi khái niệm chỉ có một nguồn dữ liệu chính; tránh giữ hai luồng gameplay chạy song song lâu dài.
- Thay đổi theo lát cắt nhỏ, có thể kiểm tra và đưa lên GitHub độc lập.

## 2. Sơ đồ chức năng hiện tại

### Luồng chính

`Chào mừng → Đăng nhập/Đăng ký → Chọn nhân vật → Bản đồ → Địa điểm → Chỉ đường/Nhiệm vụ → Hoàn thành → Album/Cửa hàng`

### Route

Ứng dụng dùng hash route trong `src/App.tsx`.

| Route | Chức năng hiện tại |
| --- | --- |
| `#/` | Chào mừng |
| `#/dang-nhap`, `#/dang-ky` | Xác thực |
| `#/kham-pha`, `#/explore`, `#/map` | Bản đồ khám phá |
| `#/dia-diem/:destinationId` | Chi tiết địa điểm |
| `#/chi-duong/:destinationId` | Dẫn đường đi bộ |
| `#/nhiem-vu/:destinationId` | Danh sách nhiệm vụ của địa điểm |
| `#/may-anh/:destinationId/:missionId` | Nhiệm vụ chụp ảnh |
| `#/hoan-thanh/:destinationId/:missionId` | Kết quả hoàn thành |
| `#/album` | Album ảnh |
| `#/cua-hang` | Cửa hàng phần thưởng |
| `#/tai-khoan` | Tài khoản |
| `#/chon-nhan-vat`, `#/nhan-vat` | Nhân vật |

Các trang không công khai được chặn bởi trạng thái đăng nhập. Thanh điều hướng dưới hiện gồm Bản đồ, Thư viện, Phần thưởng và Tài khoản; nhiệm vụ đang chơi có nút nổi riêng.

### Dữ liệu và lưu trữ

- Địa điểm: `src/data/destinations.json`; dữ liệu tương thích cũ ở `historicalDestinations.json`.
- Nhiệm vụ: `src/data/missions.ts` tạo động 10 nhiệm vụ mẫu cho mỗi địa điểm; mỗi lượt chọn ngẫu nhiên 5–10 nhiệm vụ.
- Tiến trình: `ProgressState` phiên bản 1 trong `src/lib/progress.ts`; hoàn thành địa điểm khi đạt tối thiểu 80% nhiệm vụ.
- Phần thưởng: mỗi nhiệm vụ hiện cộng 10 xu; đổi quà được ghi vào cùng trạng thái tiến trình.
- Khách chưa đăng nhập: IndexedDB `dana-quest-local`, gồm trạng thái và ảnh.
- Người dùng đăng nhập: đồng bộ dữ liệu tài khoản qua API cùng domain.
- Ảnh cũ dùng khóa theo `destinationId:missionId`.
- Cập nhật giữa các tab dùng `BroadcastChannel` tên `dana-quest-updates`.

### Bản đồ và dẫn đường

- Bản đồ dùng Leaflet và lớp nền OpenStreetMap.
- Có tìm kiếm, lọc, định vị, địa điểm gần người dùng và marker riêng cho từng địa điểm.
- Dẫn đường dùng API `/api/navigation/route`; máy chủ hiện gọi dịch vụ tuyến đường Valhalla.
- Khi tới đủ gần điểm đích, người dùng được chuyển sang trang nhiệm vụ.
- Cơ chế chống rời nhầm trang dẫn đường đã có và nên được giữ.

### API hiện có

| Nhóm | Chức năng |
| --- | --- |
| `/api/auth/*` | Đăng ký, đăng nhập, phiên, đăng xuất, hồ sơ, avatar, dữ liệu game |
| `/api/navigation/route` | Tạo tuyến đi bộ |
| `/api/places/visit-info` | Thông tin tham quan cập nhật |
| `/api/recommendations/nearby` | Gợi ý địa điểm gần đó |

Thông báo hiện tại chỉ là toast trong ứng dụng; chưa có hộp thư sự kiện, lịch nhắc hay Web Push.

## 3. Quyết định giữ, sửa, thay thế

### Giữ làm nền

- Xác thực, phiên đăng nhập và cơ chế đồng bộ tài khoản.
- Leaflet, OpenStreetMap, GPS, kiểm tra độ chính xác và nền tảng dẫn đường.
- Danh mục địa điểm và toàn bộ ID hiện có.
- Camera, ảnh và album.
- IndexedDB, đồng bộ máy chủ, BroadcastChannel và tính chất hoàn thành không bị cộng lặp.
- Cửa hàng và sổ giao dịch phần thưởng trong thời gian chuyển đổi.
- Cảnh báo khi rời phiên dẫn đường.

### Mở rộng hoặc chỉnh sửa có kiểm soát

- Điều hướng chính theo ưu tiên đã chốt: **Bản đồ và dẫn đường → Khám phá → Quest đang chơi → Sự kiện/Thông báo → Cửa hàng → Tài khoản/Đội**.
- Mô hình nội dung để hỗ trợ địa điểm, sự kiện, hoạt động và quest mà không phá ID cũ.
- Marker và bộ lọc bản đồ theo loại nội dung.
- Dẫn đường theo từng checkpoint thay vì chỉ một điểm đích.
- Tiến trình có thứ tự, câu đố đa dạng, gợi ý, XP và phần thưởng.
- Trung tâm thông báo và thông báo sự kiện theo thời gian.
- Liên kết giữa phần thưởng quest và cửa hàng.

### Thay thế sau khi có dữ liệu mới

- Cách chọn ngẫu nhiên 5–10 nhiệm vụ.
- Bộ 10 nhiệm vụ chung được tạo giống nhau cho mọi địa điểm.
- Quy tắc hoàn thành 80% nhiệm vụ của một địa điểm.
- Các nhiệm vụ chỉ yêu cầu người dùng tự xác nhận.

### Chỉ xóa sau khi chuyển đổi thành công

- Route và component gameplay cũ không còn người dùng.
- CSS, helper và dữ liệu mẫu không còn tham chiếu.
- Không xóa dữ liệu địa điểm, ảnh hoặc tiến trình cũ trước khi xác nhận cơ chế đọc/chuyển đổi tương thích.

## 4. Điểm dễ xung đột và cách phòng tránh

1. **Tiến trình cũ và quest mới:** không ghi đè `ProgressState` phiên bản 1. Phần sau phải có phiên bản 2 và hàm chuyển đổi, hoặc thêm nhánh `quests` tương thích ngược.
2. **Route nhiệm vụ:** `#/nhiem-vu/:destinationId` đang thuộc gameplay cũ. Quest mới cần route rõ nghĩa riêng trước khi thay route cũ.
3. **Tên thông báo:** `Notifications` hiện là toast. Trung tâm thông báo sự kiện phải dùng model/component riêng để tránh hai chức năng cùng tên.
4. **Mô hình nội dung:** không nhồi mọi trường vào `Destination`; nên có phần dữ liệu chung và các loại `place`, `event`, `activity`, `quest` phân biệt rõ.
5. **Dẫn đường:** trạng thái hiện chỉ biết một điểm cuối. Quest nhiều chặng cần checkpoint chủ động và bước bàn giao rõ ràng khi đến nơi.
6. **Số dư cửa hàng:** số xu hiện phụ thuộc số nhiệm vụ hoàn tất. Khi đổi đơn vị tiến trình phải giữ sổ giao dịch hoặc có quy tắc chuyển đổi để không làm đổi số dư ngoài ý muốn.
7. **Đồng bộ tài khoản:** schema frontend, giới hạn payload và kiểm tra phía server phải đổi cùng một lần.
8. **Ảnh đã lưu:** tiếp tục đọc khóa `destinationId:missionId`; chỉ thêm khóa mới sau khi có lớp tương thích.
9. **PWA và liên kết thông báo:** hash route phù hợp host tĩnh, nhưng liên kết mở từ thông báo cần ID ổn định và bộ phân tích route thống nhất.
10. **Hiệu năng:** bundle hiện vượt cảnh báo 500 kB; tách tải trang theo nhu cầu nên làm sau khi route mới ổn định.

## 5. Kết quả kiểm tra nền

- Build sản phẩm: đạt.
- Lint: không có lỗi; còn 4 cảnh báo kỹ thuật hiện hữu liên quan cập nhật state trong effect, export context và `Date.now()` khi render.
- Kiểm thử: 53 test đạt. Một test API xác thực bị chặn quyền mở cổng trong môi trường kiểm tra; các suite còn lại bị lỗi đường dẫn thư mục tạm của sandbox. Đây được ghi nhận là giới hạn môi trường, chưa có bằng chứng là lỗi hồi quy của mã nguồn.
- Git trước khi lập tài liệu: sạch.

## 6. Ranh giới đề xuất cho Phần 2

Phần 2 chỉ nên dựng **khung dữ liệu quest mới và cơ chế chuyển đổi tiến trình**, chưa thay toàn bộ giao diện. Đầu ra tối thiểu:

1. Kiểu dữ liệu `Quest`, `Checkpoint` và các loại thử thách.
2. Quest demo Đại học Kinh tế – Đại học Đà Nẵng gồm 2 nhiệm vụ.
3. Tiến trình phiên bản mới có đọc dữ liệu cũ an toàn.
4. Test cho chuyển đổi dữ liệu và không cộng thưởng lặp.

Chỉ sau khi phần này được duyệt mới nối quest mới vào bản đồ, dẫn đường và giao diện chơi.
