# Rà soát hệ thống Dana Quest (27/10/2026)

Phạm vi: checkout `Dana-Quest-nhanh-dung`, nhánh `ui/responsive-game-layout`, toàn bộ luồng đang chạy bằng React/Vite và Node, đồng thời đọc/kiểm tra Django. Giả định sử dụng local/demo, một tiến trình Node; chưa phải kiểm chứng vận hành nhiều máy chủ. Không push, không bỏ chức năng hoặc màn hình. Các thay đổi sẵn có trước lượt audit được giữ lại.

## Đã tái hiện và vá ở Node/frontend

| Mức | Lỗi và tình huống cụ thể | Bản vá và bằng chứng |
|---|---|---|
| Cao | `server/account-data.mjs` đọc snapshot chỉ có metadata ảnh rồi ghi lại sau hoàn thành nhiệm vụ, thêm ảnh khác hoặc cập nhật tiến độ: dữ liệu ảnh cũ biến mất. Đặt lại tiến độ hỏng cũng bỏ phần dữ liệu ảnh. | Ghi từ snapshot đầy đủ; reset giữ toàn bộ ảnh. `account-reset.test.ts` đã đỏ trước bản vá, xanh sau bản vá; vẫn chỉ trả metadata trong API tiến độ để tránh tải ảnh nặng. |
| Cao | Đổi thưởng với ID như `constructor`/`toString` vượt kiểm tra `in` trên object, tạo lịch sử voucher không hợp lệ. | Chỉ nhận khóa riêng của danh mục qua `Object.hasOwn`. Kiểm tra đầu vào trong `server-actions.test.ts`. Không đổi giá hoặc luật thưởng. |
| Cao | URL có escape sai như `/%ZZ` làm tiến trình Node production dừng do lỗi decode không được bắt. | Trả HTTP 400, xử lý lỗi đọc stream. `static-server.test.ts` chạy tiến trình thật và chứng minh server vẫn trả trang sau yêu cầu lỗi. |
| Vừa | Yêu cầu tải tiến độ lúc focus tab trả chậm hơn thao tác lưu, khiến UI lùi về trạng thái cũ; xảy ra ở cả quest và nhiệm vụ địa điểm. | Đánh số yêu cầu, bỏ phản hồi cũ, không refresh chồng thao tác ghi, khóa thao tác trùng. Hai kiểm tra trong `quest-sync-race.test.tsx`. |
| Vừa | Kiểm tra phiên ban đầu trả 401 sau khi login đã thành công, khiến frontend tự trở về chưa đăng nhập. | Bỏ phản hồi phiên cũ sau thay đổi đăng nhập; chặn cập nhật hồ sơ/nhân vật trả về sau đổi phiên. `auth-race.test.tsx` tái hiện trường hợp login. |
| Vừa | Dữ liệu nhiệm vụ sai bên trong vẫn được backend coi là lành, không cho người dùng phục hồi; ghi tiếp có thể làm tình trạng nặng thêm. | Kiểm tra cấu trúc nhiệm vụ/voucher trước ghi và trước quyết định reset; từ chối ghi dữ liệu hỏng, reset có backup, giữ ảnh và timestamp cũ hợp lệ. `account-reset.test.ts`. |
| Vừa | Chuyển địa điểm nhanh: thông tin giờ/địa chỉ của request cũ ghi đè sang địa điểm mới. | Bỏ phản hồi đã bị hủy và gắn kết quả theo địa điểm/fallback. `live-info-race.test.tsx`. |
| Vừa | Discovery bỏ qua lỗi tải tiến độ DUE, khiến quest có thể biến mất mà không giải thích. | Hiển thị trạng thái tải/lỗi riêng; không nói danh sách rỗng khi đồng bộ lỗi. `discovery.test.tsx`. |
| Vừa | Trang địa điểm và nhiệm vụ dùng ảnh hero kích thước gốc. CSS cần thiết chỉ nằm trong `pixel.css` không được import; ảnh 1200px làm tràn màn 320px. | Đặt quy tắc ảnh co theo vùng hero trong CSS đang dùng, giữ ảnh, crop và ghi nguồn. Browser regression `system-audit-browser.cjs` bắt lỗi trước bản vá và đạt sau bản vá. |
| Thư viện | `npm audit` báo 5 gói công cụ build/test có advisory, trong khi thư viện production không có advisory. | Vá tương thích, không `--force`: Vite 8.3.5, Vitest 5.0.5 và các phụ thuộc liên quan trong lockfile. Kiểm tra lại toàn bộ: 0 advisory được npm audit báo ở thời điểm kiểm tra. Không đồng nghĩa bảo đảm không tồn tại lỗ hổng khác. |

## Django: chỉ kiểm tra, không giữ bản sửa

Theo yêu cầu mới của chủ dự án, đã hoàn nguyên toàn bộ thay đổi do lượt audit tạo trong `backend/`; file kiểm tra mới trong đó cũng đã bỏ. `git status --short -- backend` không trả mục thay đổi. Không chạy migrate hoặc sửa cơ sở dữ liệu đang dùng.

1. **Đã tái hiện: thiếu kiểm tra chủ tài khoản của tab.** `backend/game/views.py` dùng tài khoản từ cookie nhưng bỏ qua `X-Dana-User`. Khi tab A còn dữ liệu A mà cookie đã đổi sang B, GET/POST có thể đọc hoặc ghi dữ liệu B thay vì từ chối 409. Kiểm tra trên database test đã trả 200 thay vì 409. Chưa sửa theo yêu cầu.
2. **Đã tái hiện: phục hồi dữ liệu hỏng chưa đúng.** `game.rules.is_healthy` chỉ kiểm tra lớp ngoài nên record có nhiệm vụ không hợp lệ vẫn bị coi là lành; reset trả 400. Nhánh reset hiện không tạo bản sao dữ liệu trước khi thay state. Chưa sửa theo yêu cầu.
3. **Đối chiếu mã: chưa cùng hợp đồng API với Node.** `backend/accounts/urls.py` chưa có `quest-runs` và `quest-codes`. Chưa thể đổi toàn bộ auth sang Django rồi coi DUE/cấp mã đã được hỗ trợ. Đây là khoảng trống tích hợp, không tự bổ sung engine mới hoặc chuyển kho dữ liệu trong audit.
4. **Đối chiếu cấu hình local:** CSRF trusted origins mới có cổng 5173, chưa có cổng đang dùng 5174. Nếu chuyển yêu cầu ghi tài khoản sang Django từ cổng 5174 sẽ cần rà cấu hình tương ứng. Không ảnh hưởng auth Node hiện đang dùng.

Tám test Django sẵn có đạt trên mã đã hoàn nguyên; hai test audit bổ sung trước đó đã chứng minh các lỗi trên. Các thư viện phục vụ kiểm tra nằm riêng trong `.data/audit-python`, bị loại khỏi Git. Không cài vào Python hệ thống. Không tuyên bố Django hết lỗi dựa vào tám test sẵn có; `accounts/tests.py` hiện chỉ là khung trống.

## Code gọn và tối ưu đến đâu

- Không thấy dấu merge conflict hoặc file đang ở trạng thái Git unmerged. Chưa fetch/so sánh nhánh GitHub mới nhất; không bảo đảm sẽ không xung đột khi merge về sau.
- Code chưa được chuẩn hóa hoàn toàn: luật nhiệm vụ/voucher còn lặp giữa client, Node và Django; nhiều lớp CSS điều chỉnh chồng nhau; màn chơi chứa nhiều nhánh hộp thoại. Có thể tách/dọn từng phần với kiểm tra giữ hành vi, nhưng audit này không viết lại hàng loạt để tránh đổi giao diện hoặc tăng phạm vi xung đột.
- Bundle chính khoảng 440 kB (130 kB gzip); Leaflet/tuyến đi bộ tiếp tục được tách tải. Chưa có bằng chứng cần thêm cache/framework/dependency để tăng tốc. Không giảm số ảnh hoặc bỏ hiệu ứng người dùng đã yêu cầu.
- Kho Node là JSON theo tài khoản, cập nhật tuần tự. Tối đa 40 ảnh, mỗi ảnh gần 3 MB có thể khiến một record rất nặng; phù hợp bản local/demo, chưa tối ưu vận hành đông người. Tách ảnh và dùng database là thay đổi kiến trúc cần làm riêng, không tự migrate trong lượt này.
- Lint còn 1 cảnh báo Fast Refresh ở `AuthContext.tsx` vì export hook cùng component. Không phải lỗi runtime. Đã bỏ được 2 cảnh báo effect trong khi sửa các lỗi phản hồi cũ.
- Đáp án quest mẫu vẫn có trong catalog frontend để phục vụ chế độ local cũ. Không coi mẫu này là hệ thống chống xem đáp án qua mã nguồn; chưa tự bỏ chế độ đó hoặc đổi luật chơi.

## Kiểm chứng

- Vitest 5.0.5: **158 test, 39 file đạt**, gồm kiểm tra cũ và hồi quy mới. Một số test jsdom in cảnh báo thiếu `window.scrollTo`; luồng trình duyệt thật được kiểm tra riêng.
- Django: **8 test sẵn có đạt** sau hoàn nguyên; database test riêng, không dùng database người dùng.
- `npm run build`: đạt với Vite 8.3.5. `npm run lint`: không lỗi, 1 cảnh báo nêu trên. `npm audit`: 0 advisory. `git diff --check`: đạt.
- Browser login: **35 trường hợp** (7 kích thước × 5 trạng thái). Onboarding/nhân vật/nhập mã: **42 màn** (7 × 6), có thử login/đăng ký/mã sai và mã đúng bằng dữ liệu giả.
- Browser DUE: hoàn tất ở **7 kích thước**, gồm bản đồ/nhận diện/xác nhận đến, phóng to hình, menu, pause/resume, nhập sai/đúng, đọc lại giữ input, hint, FAQ, report download, reload và tổng kết không thưởng lặp. Kiểm tra thêm ảnh kỷ niệm/thoát ở mobile và desktop.
- Browser rà rộng: **40 trường hợp** (10 màn × 320×568, 390×844, 844×390, 1440×900): Khám phá, tìm kiếm, Quest, sự kiện, tài khoản, album, cửa hàng, chi tiết địa điểm, nhiệm vụ và tổng quan DUE. Không tràn ngang/không lỗi JS trong những trường hợp đã chạy. Có kiểm tra fallback khi API dữ liệu trực tiếp không khả dụng.
- Không kiểm chứng phần cứng camera/GPS trên điện thoại thật, Safari/iOS, tải lớn, triển khai HTTPS/proxy thật hoặc merge với nhánh GitHub. Browser dùng fixture riêng; HTTP và persistence có test tạm riêng, không thay tiến độ người chơi để test.

Kết luận: các lỗi tái hiện được ở Node/frontend đã vá và kiểm tra lại; chức năng/giao diện được giữ. Django giữ nguyên và có vấn đề cần xử lý ở công việc/nhánh riêng. Chưa gọi toàn bộ hệ thống là đã tối ưu hoàn toàn hoặc sẵn sàng chịu tải production.
