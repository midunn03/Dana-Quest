# Sửa tìm kiếm đầu trang và card tiếp tục quest

Kế hoạch được lưu trước khi sửa tại `docs/superpowers/plans/2026-10-29-search-header-quest-card.md`.

## Nguyên nhân và thay đổi

1. **Ô tìm kiếm bị đẩy xuống dưới card:** Discovery dùng flex order cho tiêu đề (1), ô tìm kiếm (2), utility (3) và tiêu đề kết quả (4), nhưng lưới card thiếu order nên mặc định là 0. Đã đặt `.discovery-page > .discovery-grid` thành order 5 trong rule thuộc Discovery.css. Thứ tự hiện tại: tiêu đề → ô tìm kiếm → utility → kết quả → card. Khôi phục `.sr-only` trong base CSS để nhãn truy cập không hiện thành chữ lặp bên trong ô nhập.
2. **Mục tìm kiếm toàn cục ở đáy:** thêm PageTools ở đầu ứng dụng, dùng link thật tới route `#/tim-kiem` hiện có. Ô nhập và thuật toán lọc của màn tìm kiếm giữ nguyên. Menu đáy trong App còn bốn mục hiển thị; MainNavigation khi dùng độc lập vẫn giữ hợp đồng năm link, nên các test/consumer cũ được bảo toàn.
3. **Dải tiếp tục quest:** anchor trước đây chiếm riêng một hàng flex/grid của App. Đã chuyển vào header PageTools dưới dạng một card có nhãn tiếp tục, tên hành trình, số thử thách hoàn thành/tổng số và mũi tên. Card rộng tối đa 420px, không fixed/absolute, không đè lên main hoặc bottom navigation. Khi không có quest đang chơi, không render card và không để lại hàng trạng thái trống.

Workspace dùng đúng ba hàng header/content/nav, bỏ hàng trạng thái cũ. Màn chơi, chỉ đường/start, camera và onboarding ẩn công cụ đầu trang để giữ không gian toàn màn hình. Điều kiện chọn quest mới nhất, trạng thái hoàn thành, route chi-duong/choi và nhánh legacy đều giữ nguyên. Không đổi ID, storage, API hoặc luật chơi.

## File thay đổi

- Mới: `src/PageTools.tsx`, `src/PageTools.css`.
- Sửa: `src/App.tsx`, `src/MainNavigation.css`, `src/WorkspaceNavigation.css`, `src/ActiveMissionIndicator.tsx`, `src/ActiveMissionIndicator.css`, `src/Discovery.css`, `src/index.css`.
- Kiểm chứng mới: `tests/page-tools.test.tsx`, `scripts/verify-search-quest-card.cjs`.
- Không sửa bất kỳ test có sẵn nào. Test legacy mới dùng fixture Chợ Hàn vì catalog hiện tại xác nhận địa điểm này không có quest mới; APEC đã có quest nên không phù hợp để kiểm tra nhánh legacy. Các assertions route/tên/tiến độ giữ nguyên.

## Kiểm chứng

- Build đạt.
- **236/236 test đạt**: toàn bộ 231 test có sẵn và 5 test hồi quy mới.
- Lint không có cảnh báo mới so với baseline.
- Browser 390/768/1440px, VI/EN: Home, map, quest play, Account, Events, Shop, Quest của bạn và Discovery; không tràn ngang toàn trang, không có page error.
- Assert vị trí **ô nhập tìm kiếm thực tế** nằm sau tiêu đề và trước lưới card; không chỉ kiểm tra shortcut toàn cục.
- Assert header trên main, main không giao với bottom nav, card không giao với main/nav, chỉ bốn link đáy hiển thị, không còn indicator trực tiếp dưới AppShell.
- Thử lọc `cau rong`, không kết quả và xóa bộ lọc; link tiếp tục mở đúng quest; tên rất dài không tràn; tài khoản không có quest không để lại card.
- Guard rời quest: hủy giữ đáp án, lưu lỗi không rời, thử lại lưu thành công mới rời.
- Test đăng nhập/modal hiện có được chạy thêm tại 320/390/844 ngang/1440.

## Bằng chứng

Ảnh trước/sau và kết quả browser: `.data/search-quest-card/before/`, `.data/search-quest-card/after/`, `browser.json` trong mỗi thư mục. Kết quả test: `.data/search-quest-card/tests.json`; baseline lint và lint sau sửa cùng thư mục. Snapshot các file giao diện gốc: `before.zip`.

Ảnh chính: `after/390-su-kien.png`, `after/1440-quest-cua-toi.png`, `after/390-no-active.png`.

Nền bản đồ ngoài vẫn chưa tải được trong môi trường kiểm tra; đã kiểm tra bố cục, fallback, tìm kiếm danh sách và chọn marker. Tất cả kiểm thử dùng tài khoản/context riêng. Không push GitHub; tiếp tục sử dụng localhost:5174.
