# DANA QUEST

> Điểm vào tài liệu: [DOC-INDEX](docs/DOC-INDEX.md), [DESIGN.md](DESIGN.md), [nguồn ảnh chính](docs/references/VISUAL-SOURCES.md). Các báo cáo trong docs/archive là lịch sử; đọc TASKS và mã hiện tại để xác định trạng thái mới nhất.

Ứng dụng Vite + React + TypeScript với giao diện tiếng Việt, bản đồ khám phá, quest theo địa điểm, dẫn đường đi bộ và lịch sự kiện Đà Nẵng.

## Quest demo DUE

Quest **DUE — Dấu ấn 50 năm** xuất hiện bằng marker riêng trên bản đồ. Luồng chơi: xem tổng quan → chỉ đường đến Trường Đại học Kinh tế – Đại học Đà Nẵng → GPS xác nhận đã đến → hai checkpoint có dạng nhập đáp án và trắc nghiệm → tổng kết XP/xu quest. Quest dùng route và dữ liệu tiến trình phiên bản 2 riêng, không ghi đè nhiệm vụ ngẫu nhiên hoặc tiến trình phiên bản 1.

Các route chính:

- `#/quest/due-dau-an-50-nam`
- `#/quest/due-dau-an-50-nam/chi-duong`
- `#/quest/due-dau-an-50-nam/choi`

## Sự kiện và thông báo

Trang `#/su-kien` hiển thị sự kiện có nguồn công khai và mở trang chi tiết khi bấm vào thẻ. Cầu Rồng được tính lịch gần nhất lúc 21:00 thứ Sáu, thứ Bảy và Chủ nhật; nếu người dùng chủ động bật quyền thông báo, app lên lịch nhắc trước 60 phút. Sự kiện chỉ có ngày dự kiến không được tự gán giờ nhắc.

Thông báo hiện là nhắc cục bộ khi PWA hoặc trang đang hoạt động. Muốn đánh thức thiết bị khi app đã đóng hoàn toàn cần bổ sung dịch vụ Web Push phía máy chủ.

## Cài ứng dụng từ đường link

Production build có Web App Manifest và service worker. Trên Chrome/Edge, mở trang Tài khoản và chọn **Cài ứng dụng** khi trình duyệt cung cấp nút; trên iPhone/iPad dùng Safari → Chia sẻ → **Thêm vào Màn hình chính**. Ứng dụng chạy dạng standalone, không cần App Store hoặc Google Play.

Service worker lưu bộ khung đã truy cập để mở lại giao diện; nền OpenStreetMap, đăng nhập, tuyến đi bộ và dữ liệu trực tiếp vẫn cần mạng. Không cache hàng loạt tile bản đồ.

## Triển khai công khai

`npm run build && npm start` phục vụ cả thư mục `dist` và API trên cùng domain. `render.yaml` là cấu hình mẫu cho Render; cách này phù hợp hơn GitHub Pages vì dự án cần API đăng nhập và dẫn đường. Khi triển khai thực tế cần cấu hình kho dữ liệu bền vững cho `.data` thay vì filesystem tạm của gói miễn phí.

## Chạy website

Dịch vụ tài khoản cục bộ đã tích hợp vào Vite tại `/api/auth`; không cần tạo biến `VITE_AUTH_API_URL` hay chạy thêm server khi dùng `npm.cmd run dev`. Mở `http://127.0.0.1:5173/#/dang-ky`, nhập tên đăng nhập và mật khẩu 6–128 ký tự. Tên đăng nhập không được trùng. Email và số điện thoại có thể bổ sung sau ở trang Tài khoản (email/số điện thoại không được đăng ký lại). Không yêu cầu SMS. Xem [tài khoản và đồng bộ](docs/ACCOUNT-SYNC.md). Nếu trước đó đã đặt `VITE_AUTH_API_URL` rỗng hoặc trỏ tới dịch vụ cũ, hãy bỏ biến đó rồi khởi động lại Vite.

Tài khoản được lưu tại `.data/accounts.json`, tiến độ/ảnh của từng tài khoản tại `.data/players` (đã loại khỏi Git và chặn Vite phục vụ qua HTTP). Mật khẩu được băm bằng scrypt với salt riêng; phiên dùng cookie HttpOnly, SameSite=Strict. Phiên hết hạn sau 7 ngày hoặc khi khởi động lại server; tài khoản và dữ liệu vẫn còn để đăng nhập lại. Dữ liệu IndexedDB cũ không rõ chủ sở hữu được giữ nguyên riêng, không tự gán vào tài khoản. Các hướng dẫn lưu cục bộ bên dưới mô tả dữ liệu phiên bản cũ; tài khoản hiện dùng API để lưu/đọc và báo lỗi khi mất kết nối. Chưa có xác minh email, quên mật khẩu hoặc đồng bộ offline. Chỉ chạy một tiến trình dịch vụ với cùng thư mục dữ liệu. Khi triển khai cần HTTPS, backend chung chạy liên tục và kho dữ liệu phù hợp.

Mở terminal tại thư mục `DANAQUEST-WEB`:

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Mở http://127.0.0.1:5173/ và giữ terminal hoạt động. Nhấn Ctrl+C để dừng. Sau lần cài đầu, chỉ cần lệnh `npm.cmd run dev ...`.

## Cách thử luồng chính

1. Nhấn **Bắt đầu**, chọn nhân vật và xác nhận để mở bản đồ. Có thể chọn bất kỳ địa điểm nào, không có thứ tự bắt buộc.
2. Tìm địa điểm bằng tên có dấu hoặc không dấu. Gõ "gần tôi", "quanh đây" hoặc "xung quanh" vào ô tìm kiếm nếu muốn dùng bộ lọc khoảng cách. Danh sách và dấu ghim cùng áp dụng bộ lọc.
3. Chạm dấu ghim hoặc chọn địa điểm trong danh sách, rồi nhấn **Khám phá** để vào trang chi tiết.
4. Từ chi tiết, nhấn **Bắt đầu khám phá →** để mở màn chỉ đường, hoặc **Nhiệm vụ và tiến độ** để nhận và làm nhiệm vụ. Màn điều hướng tính tuyến đi bộ theo đường phố, chỉ dẫn rẽ và khoảng cách dọc tuyến theo GPS. Xem [chỉ đường đi bộ](docs/ROUTING.md). Chọn **số lượng từ 5 đến 10**, rồi nhấn **Nhận nhiệm vụ**. Hệ thống tự giao ngẫu nhiên đúng số lượng, không chọn từng nhiệm vụ. Danh sách và tiến độ được lưu cố định; tải lại hoặc bấm lặp không giao lại. Danh sách đã bắt đầu ở phiên bản cũ vẫn được giữ để không mất tiến độ.
5. Hoàn thành nhiệm vụ bằng tự xác nhận, lưu ảnh rồi tự xác nhận, hoặc kiểm tra vị trí cho nhiệm vụ có mặt.
6. Điểm đến hoàn thành khi xong ít nhất `Math.ceil(số nhiệm vụ đã chọn * 0.8)`: chọn 5/6/7/8/9/10 thì cần xong tương ứng 4/5/6/7/8/8 nhiệm vụ. Vẫn có thể làm tiếp các nhiệm vụ đã chọn còn lại.
7. Mỗi nhiệm vụ hoàn thành nhận 10 **Green Coins demo** đúng một lần. Xem **Album ảnh** hoặc vào **Cửa hàng demo** để đổi voucher mẫu.
8. Tải lại trang để kiểm tra tiến độ, ảnh, số xu và voucher vẫn còn trên cùng trình duyệt và địa chỉ website.

Các trang:

- Bản đồ: http://127.0.0.1:5173/#/kham-pha
- API gợi ý địa điểm nổi bật theo khu vực bản đồ: `/api/recommendations/nearby?lat=16.068&lng=108.224&limit=3`
- Ví dụ chi tiết: http://127.0.0.1:5173/#/dia-diem/cau-rong
- Album: http://127.0.0.1:5173/#/album
- Cửa hàng: http://127.0.0.1:5173/#/cua-hang

## Kiểm tra vị trí

Bản đồ và màn chỉ đường tự theo dõi GPS khi mở; các màn kiểm tra nhiệm vụ xin vị trí khi bấm nút. Có thông báo khi bị từ chối quyền, hết thời gian hoặc trình duyệt không hỗ trợ. Không lưu tọa độ người dùng vào tiến độ. Màn chỉ đường gửi tọa độ GPS qua API tới Valhalla để tính tuyến đi bộ.

- Màn chỉ đường hiển thị khoảng cách còn lại dọc tuyến đi bộ; kiểm tra nhiệm vụ và bộ lọc dùng khoảng cách đường thẳng cùng sai số thiết bị.
- Vùng gần điểm đến: 100 m quanh tọa độ mẫu.
- Chỉ cho hoàn thành nhiệm vụ có mặt nếu sai số không quá 50 m, khoảng cách + sai số không vượt 100 m, và kết quả không cũ hơn 60 giây.
- Sai số lớn hoặc kết quả hết hạn: không ghi nhận đến nơi; yêu cầu đo lại.
- Đây là kiểm tra gần đúng, không đảm bảo độ chính xác 1–2 m và không chống được giả mạo GPS.
- Bộ lọc khoảng cách cũng yêu cầu vị trí còn mới, sai số không quá 50 m. Bộ lọc không phải AI, không tính đường đi thực tế.
- Tọa độ GPS được gửi cho dịch vụ định tuyến khi mở màn chỉ đường (xem [chỉ đường đi bộ](docs/ROUTING.md)). API gợi ý chỉ nhận tâm bản đồ đang xem, làm tròn 3 chữ số thập phân để tìm điểm nổi bật gần khu vực đó.

Định vị cần quyền của người dùng và HTTPS hoặc localhost. Địa chỉ 127.0.0.1 là máy đang mở trình duyệt; mở địa chỉ này trên điện thoại không truy cập được máy tính. Khi đưa website lên môi trường dùng trên điện thoại, cần HTTPS. Chưa có triển khai công khai hay dịch vụ trả phí.

## Ảnh và dữ liệu cục bộ

Ảnh lưu bằng IndexedDB trong trình duyệt, không tải lên một backend. Nhấn **Mở webcam** để dùng camera laptop qua getUserMedia (không thu âm), xem hình trực tiếp rồi **Chụp ảnh**. Cả chụp và tải ảnh đều có xem trước; nhấn **Lưu ảnh** mới lưu vào album. Có thể bỏ ảnh chưa lưu. Khi chụp, tắt camera hoặc rời trang, ứng dụng dừng camera. Nếu bị từ chối quyền, không có webcam hoặc camera bận, ứng dụng giải thích bằng tiếng Việt; dùng **Chọn ảnh từ thiết bị**. Camera cần HTTPS hoặc localhost.

- Chấp nhận JPG, PNG, WebP — chọn tối đa 10 MB, ảnh sau xử lý phải ≤ 3 MB mới lưu được; HEIC cần đổi sang JPG.
- Thu nhỏ ảnh còn tối đa 1600 px cạnh dài, lưu JPEG để giảm dung lượng. Ảnh tải từ album là bản đã xử lý.
- Mỗi nhiệm vụ ảnh giữ 1 ảnh; có thể thay trước khi hoàn thành. Tải ảnh không tự hoàn thành nhiệm vụ và không tự cộng xu.
- **Xác minh ảnh bằng AI: chưa triển khai (not implemented).** Người dùng tự xác nhận ảnh phù hợp. Không có kết quả AI giả.
- Tiến độ, ảnh và voucher chỉ lưu trên cùng trình duyệt/địa chỉ website, không đồng bộ giữa các thiết bị. Dùng nhất quán `127.0.0.1:5173` vì `localhost:5173` là vùng lưu khác.
- Xóa dữ liệu trang web, chế độ riêng tư hoặc trình duyệt dọn bộ nhớ có thể làm mất dữ liệu. Tải ảnh cần giữ về máy. Nếu lưu thất bại, ứng dụng báo lỗi và không ghi nhận hoàn thành/giao dịch đó.

## API Gợi Ý Địa Điểm

Vite dev/preview gắn API cùng origin, không cần mở terminal thứ hai. Endpoint `GET /api/recommendations/nearby` nhận `lat`, `lng`, `limit`; kiểm tra phạm vi tọa độ, chỉ trả địa điểm trong bán kính 12 km và giới hạn tối đa 6 kết quả. Xếp hạng kết hợp điểm nổi bật biên tập với khoảng cách tới tâm bản đồ. `featuredScore` và `highlightReason` trong `src/data/destinations.json` là dữ liệu biên tập mẫu, không phải đánh giá người dùng hay số lượt ghé.

Có thể chạy API Node độc lập bằng `npm.cmd run api` (mặc định `127.0.0.1:3001`). Khi triển khai riêng, reverse proxy `/api/*` về tiến trình này để frontend và API dùng cùng origin. Có thể cấu hình `API_HOST` và `API_PORT` qua biến môi trường.

## Bộ Điểm Đến Hoạt Động

Bản đồ có đúng 15 điểm văn hóa, cảnh quan và hoạt động ngoài trời: Cầu Rồng; Cầu Sông Hàn; Bảo tàng Đà Nẵng; Bảo tàng Điêu khắc Chăm; Công viên APEC; Cầu Tình Yêu; Bãi biển Mỹ Khê; Công viên Biển Đông; Bãi biển Mân Thái (SUP); Chùa Linh Ứng Bãi Bụt; Đỉnh Bàn Cờ; Hải Vân Quan; Danh thắng Ngũ Hành Sơn; Cầu Vàng trong Bà Nà Hills; Bãi biển Nam Ô.

Giữ nguyên ID của Cầu Rồng, Cầu Sông Hàn, Bảo tàng Đà Nẵng và Công viên APEC. Chợ Hàn đã rời catalog/map/API active; `src/data/historicalDestinations.json` vẫn giữ ID `cho-han` để tiến độ, nhiệm vụ, ảnh và kỷ niệm đã lưu tiếp tục đọc được. `getDestination()` tra active trước rồi mới tra lịch sử; lịch sử không được đưa lên bản đồ, tìm kiếm hay gợi ý.

Mỗi điểm active có category, tags, hoạt động gợi ý, nguồn thông tin, nguồn tọa độ và SVG marker riêng trong `src/data/destinations.json`. Tọa độ được đối chiếu với kết quả địa điểm cụ thể trên Google Maps và các nguồn chính thức khi có: Bảo tàng Đà Nẵng ghim tại cổng khách 31 Trần Phú (không dùng địa chỉ hành chính cũ làm cổng); Bảo tàng Chăm tại 02 đường 2 Tháng 9; Linh Ứng tại Bãi Bụt Sơn Trà; Cầu Vàng ghim trên cây cầu trong khu Bà Nà, không phải cổng vào; Hải Vân Quan ghim tại di tích trên đỉnh đèo.

Pin Mân Thái đại diện bãi tắm đã định vị, không xác định điểm hẹn cho tour SUP. Chưa xác minh được đơn vị, điểm tập trung hoặc tình trạng hoạt động SUP cố định; nội dung trong sheet yêu cầu khách xác nhận trực tiếp. Giờ mở cửa, giá vé, tình trạng tắm biển và lịch hoạt động chỉ hiển thị khi có nguồn hiện hành; nếu không, giao diện nói rõ chưa có thông tin thay vì tự đặt số liệu.

## Phần demo và phần cần làm sau

Green Coins/voucher chỉ để thử luồng, không phải tiền và không có giá trị sử dụng tại cửa hàng thật. Mỗi loại voucher chỉ đổi một lần. Ghi nhận nhiệm vụ và đổi xu dùng giao dịch cục bộ để tránh cộng/trừ lặp khi bấm nhiều lần hoặc mở nhiều tab. API hiện chỉ phục vụ danh mục/gợi ý; tiến độ, ảnh, xu và voucher vẫn chưa được đồng bộ lên backend.

Dữ liệu cục bộ có thể bị sửa bởi người dùng. Một sản phẩm thực vẫn cần backend để quản lý người dùng, đồng bộ/sao lưu ảnh và tiến độ, xác thực hoàn thành, ghi sổ xu và quản lý voucher/đối tác thật. AI kiểm tra nội dung ảnh cần dịch vụ thực và quy trình xử lý dữ liệu phù hợp. Chưa kết nối các dịch vụ đó.

Không có booking, premium trả phí hay AI tạo tour.

## Các tệp chính

- `src/App.tsx`: trang chủ và điều hướng theo URL.
- `src/Explore.tsx`: bản đồ, tìm kiếm và lọc khoảng cách.
- `src/DestinationPage.tsx`: chọn số lượng, tự giao nhiệm vụ và tiến độ điểm đến.
- `src/data/destinations.json`: đúng 15 điểm active dùng chung cho frontend/API, tọa độ, category/tags, gợi ý, nguồn và marker.
- `src/data/historicalDestinations.json`: điểm cũ chỉ dùng để đọc dữ liệu lịch sử.
- `src/data/destinations.ts`: schema, nhãn category và lookup active-or-history.
- `scripts/build-marker-assets.mjs`: sinh marker SVG từ active catalog.
- `server/recommendations.mjs`: API xếp hạng địa điểm theo vùng bản đồ đang xem.
- `src/data/missions.ts`: 10 nhiệm vụ cho mỗi địa điểm.
- `src/data/rewards.ts`: xu mỗi nhiệm vụ và voucher mẫu.
- `src/lib/location.ts`: tính khoảng cách và điều kiện đến nơi.
- `src/lib/progress.ts`, `src/lib/storage.ts`: quy tắc tiến độ/xu và giao dịch lưu cục bộ.
- `src/lib/photos.ts`, `src/PhotoMission.tsx`, `src/AlbumPage.tsx`: xử lý ảnh và album.
- `src/ShopPage.tsx`: đổi voucher demo.

## Kiểm tra

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
```

Đã chạy build sau mỗi bước: bản đồ tự chọn; trang nhiệm vụ; lưu tiến độ; định vị; ảnh/album; xu/cửa hàng; bộ lọc.

Kiểm thử tự động kiểm tra quy tắc 80%, tự giao nhiệm vụ, chống hoàn thành lặp, ghi/đọc dữ liệu, ảnh, giao dịch xu đồng thời, lọc tên/khoảng cách, xếp hạng API và luồng giao diện. Các kiểm thử giao diện dùng jsdom, IndexedDB mô phỏng và vị trí mẫu; không thay thế kiểm tra camera/GPS thật hay giao diện trên điện thoại.

Kiểm tra thủ công nên thực hiện trên thiết bị thật: cho phép/từ chối GPS; thử nơi có sai số lớn; chụp và tải ảnh; tải lại trang; thử chiều rộng điện thoại; thử khi mất mạng (nền bản đồ cần Internet).

## Tài liệu tham khảo

- Leaflet: https://leafletjs.com/examples/quick-start/
- OpenStreetMap: https://operations.osmfoundation.org/policies/tiles/
- Geolocation: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
- Sai số vị trí: https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy
- IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Địa chỉ Bảo tàng Đà Nẵng: https://danangfantasticity.com/bao-tang-lich-su/bao-tang-da-nang-42-44-bach-dang-31-tran-phu

Thông báo nhỏ xuất hiện sau khi lưu thành công: giao nhiệm vụ, lưu ảnh, hoàn thành nhiệm vụ kèm 10 xu demo, hoàn thành điểm đến và đổi voucher. Tải lại trang không phát lại thông báo; thao tác hoàn thành lặp không cộng xu hay báo thành công lặp.


## Màn hình chào và nhân vật

- Mở trang chủ, nhấn **Bắt đầu**, chọn một trong bốn nhân vật hoặc dùng hai nút mũi tên.
- Nhấn **Xác nhận nhân vật** để lưu lựa chọn và mở bản đồ. Khung người chơi trên bản đồ hiển thị nhân vật đã chọn.
- Tải lại trang để kiểm tra lựa chọn còn nguyên. Nhấn **Đổi nhân vật** trên bản đồ để chọn lại.
- Nhân vật được lưu riêng bằng khóa localStorage `dana-quest-avatar-v1`; không thay đổi dữ liệu nhiệm vụ, ảnh, xu hay voucher trong IndexedDB. Chỉ lưu sau khi xác nhận. Nếu trình duyệt chặn lưu, trang báo lỗi và không chuyển tiếp.
- Hai màn hình dùng React, CSS và hình SVG tự vẽ theo phong cách pixel; không dùng ảnh tham chiếu làm giao diện. Khung nội dung tối đa 420 px trên desktop, tự co lại trên điện thoại.


## Thẻ thông tin địa điểm và bộ ảnh

- Bấm địa điểm để mở thẻ nhỏ; kéo dọc phần đầu thẻ để mở toàn màn hình hoặc kéo xuống sát đáy để đóng. Không còn nút Xem thêm/Thu gọn. Có thể dùng phím mũi tên lên/xuống khi phần đầu thẻ được focus.
- Mỗi điểm đến có 3 hình minh họa SVG: ban ngày, hoàng hôn và ban đêm. Vuốt ngang trên điện thoại; trên laptop có thể kéo ảnh bằng chuột hoặc dùng các chấm/mũi tên. Đây là minh họa, không phải ảnh chụp hiện trường.
- Thông tin bên dưới gồm Tổng quan, Giờ mở cửa, Địa điểm chi tiết và Thời gian đông đúc. Giờ tham khảo có nguồn trong giao diện; điểm chưa xác nhận lịch cố định được ghi rõ.
- Chưa có nguồn dữ liệu đông đúc trực tiếp. Mục này hiển thị trạng thái chưa có dữ liệu, không tạo số người, phần trăm hoặc biểu đồ giả.
- Kiểm tra ngày 03/10/2026: build/lint đạt; 74/74 test đạt, gồm kiểm tra catalog 15 điểm, marker riêng, mở sheet cho từng điểm, giao 5 nhiệm vụ cho từng điểm, luồng nhiệm vụ/xu gốc và giữ ảnh/tiến độ Chợ Hàn đã lưu. Đã thao tác trên trình duyệt: mở Cầu Rồng, kéo lên, kéo ngang ảnh 1 → 2 → 3, cuộn các mục thông tin, kiểm tra chiều rộng 390 px và kéo xuống đóng thẻ. Nền OpenStreetMap không tải được trong môi trường kiểm tra; thông báo lỗi và lựa chọn điểm đến vẫn hiện.
- Ảnh kiểm tra: `tests/visual/destination-gallery.png`, `tests/visual/destination-gallery-mobile.png`.

## Biểu tượng theo mức phóng bản đồ

Biểu tượng địa điểm hiện từ zoom 15 trở lên, ẩn dưới zoom 15. Đây là độ phóng bản đồ, không phải khoảng cách GPS của người chơi. Ở vĩ độ Đà Nẵng, zoom 15 xấp xỉ 4,6 m/pixel; zoom 14 xấp xỉ 9,2 m/pixel nên biểu tượng 74–100 px dễ chồng lên nhau. Ngưỡng chỉnh tại `DESTINATION_MARKER_MIN_ZOOM` trong `src/Explore.tsx`. Danh sách và tìm kiếm vẫn dùng được khi biểu tượng ẩn; chọn một địa điểm từ danh sách sẽ phóng gần lại.



## Hướng thiết kế du lịch
Xem [hướng dẫn áp dụng góp ý và chơi thử](docs/HUONG-DAN-THIET-KE-DU-LICH.md). Bản này chuyển giao diện pixel sang minh họa mềm kết hợp ảnh địa điểm thật.

