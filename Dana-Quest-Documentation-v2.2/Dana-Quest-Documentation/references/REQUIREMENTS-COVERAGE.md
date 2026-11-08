# Đối chiếu yêu cầu — Dana Quest v2.1

## Kết luận kiểm tra
Bản v2 đã bao phủ phần lớn yêu cầu. Lần đối chiếu v2.1 bổ sung chi tiết website F5, ba phương án domain, runbook triển khai và sửa cách diễn đạt login lần đầu: yêu cầu login đã được nêu ở ý 4; chỉ cơ chế nhận biết lần đầu còn cần chốt. Tám tài liệu chính đều được cập nhật tương ứng, không thay source app.

Nguồn: ghi chú 14 ý Note document 26/10 được gửi lại, đoạn tư vấn người dùng đánh dấu, và cập nhật sau đó về hoãn website/gameplay chỉ đặc tả. Yêu cầu mới hơn được ưu tiên. Lệnh trong ghi chú cũ “chưa sửa document” mô tả bước xác nhận lúc đó; yêu cầu hiện tại đã cho phép cập nhật tài liệu. Không suy ra quyền code, push hoặc triển khai.

## Đủ 14 ý gốc được phân vào đâu
| Ý | Yêu cầu | File chính và vị trí | File liên quan / kiểm tra | Trạng thái |
| --- | --- | --- | --- | --- |
| 1 | Browser game; website giới thiệu khác khu chơi; tư vấn domain | [PRD](../docs/PRD.md): MVP/F5, Website tương lai; [Architecture](../docs/ARCHITECTURE.md): Website F5, bảng ba phương án | Design: laptop vẫn là game, không tự thành website | Đã ghi; website hoãn, chưa chốt domain |
| 2 | Chạy local trước, sau này GitHub/hosting/domain free và hướng dẫn để không thiếu chức năng | [Architecture](../docs/ARCHITECTURE.md): Operations và runbook 10 bước F4 | Code Style: scripts đúng source; Testing: DEPLOY-01/F4; Security: HTTPS/private persistence | Đã ghi; provider/lệnh deploy cụ thể chờ chọn nền tảng |
| 3 | Dựa chủ yếu giao diện Questo; login/account/explore/quest; bỏ Crew, thay Green Coin Shop | [Design System](../docs/DESIGN_SYSTEM.md): Screen S-01–16, Component C-01–09; [PRD](../docs/PRD.md): Q-01–10, WF | [Nguồn ảnh](INDEX.md): ảnh chọn lọc/tên gốc; AGENTS nhắc không copy mọi chức năng | Đã ghi; không tự thêm Crew/multiplayer/booking |
| 4 | Lần đầu cần login; sau logout xem Explore/quest; muốn làm quest cần login | [PRD](../docs/PRD.md): WF-01/02/04/05, O-01 đã thu hẹp | Design S-01/gate; Database onboarding marker đề xuất; Security UX khác quyền server; Testing AUTH-08–11 | Đã sửa rõ yêu cầu; cách nhận biết/cross-device/deep link còn chốt |
| 5 | Chức năng cơ bản trước; chưa code gameplay | [PRD](../docs/PRD.md): giai đoạn D0/F1/F2 | AGENTS Boundaries; Code Style giới hạn giai đoạn; Testing release F1/F2 | Đã ghi; gameplay chi tiết chỉ là đặc tả chuẩn bị |
| 6 | Hỏi trước push, dùng nhánh phụ, kiểm tra conflict với main và báo; không tự push main | [AGENTS](../AGENTS.md): Working rules; [Code Style](../docs/CODE_STYLE.md): GitHub | Testing F4; Architecture runbook bước 6 | Đã ghi; không tự merge/main/force-push |
| 7 | Explore mở map như UX Questo nhưng dùng map Dana trong ZIP | [PRD](../docs/PRD.md): WF-04; [Design](../docs/DESIGN_SYSTEM.md): C-04 | Architecture map reuse/pixelTiles; Testing MAP-01–04 | Đã ghi; map không thay bằng dữ liệu Questo |
| 8 | Tiếng Việt và Anh | [PRD](../docs/PRD.md): WF-13/F-05; [Design](../docs/DESIGN_SYSTEM.md): chữ, locale, screen states | Database translations/IDs; Architecture i18n; Testing LNG-01–03 | Đã ghi cả UI, lỗi, nội dung, thiếu bản dịch, font |
| 9 | 15 địa điểm → 15 quest; thêm DUE; khoảng hai thử thách mỗi quest | [PRD](../docs/PRD.md): Catalog, WF-14, F-11 | Database QuestVersion/Challenge; Architecture DUE draft; Testing CAT/RUN/DATA | Đã ghi; 16 là mục tiêu, không tuyên bố đã hoàn thiện nội dung |
| 10 | Pixel đúng chỗ, màu tự nhiên/tiết chế, font VI/EN | [Design](../docs/DESIGN_SYSTEM.md): phân vai hình ảnh/token/font/layout | References bộ nhận diện; PRD định hướng; Testing LNG/UI | Đã ghi; palette/font cụ thể vẫn là đề xuất, không giả phê duyệt |
| 11 | Trang custom nhân vật cho người mới đăng ký | [PRD](../docs/PRD.md): WF-03/O-02; [Design](../docs/DESIGN_SYSTEM.md): S-03 | Database avatar; Security avatar khác ảnh mặt; Testing AUTH-03/05 | Đã ghi; mức custom parts chưa chốt |
| 12 | Ghi nhớ feedback, xác nhận trước; không sửa code thật | [AGENTS](../AGENTS.md): sequence/boundaries; [PRD](../docs/PRD.md): D0 | Coverage source precedence; review note | Đã qua bước xác nhận; cập nhật tài liệu theo yêu cầu hiện tại, code giữ nguyên |
| 13 | Code nhiều lỗi chỉ dùng định hướng; reuse, gọn, kế hoạch, debug/review, baseline/main và conflict | [Code Style](../docs/CODE_STYLE.md): kiểm kê, module, review/Git; [AGENTS](../AGENTS.md): sequence | Architecture tách source cũ/mới; Database migration/IDs; Testing phân loại bằng chứng | Đã ghi; không reset/xóa hết làm lại, không hứa tránh conflict tương lai |
| 14 | Không có ngân sách mua API, cần chức năng/API free | [Architecture](../docs/ARCHITECTURE.md): dependency miễn phí/runbook; [Security](../docs/SECURITY.md): billing/key | PRD F-12/O-08; Code Style dependencies; nguồn OSM/GitHub/provider trong INDEX | Đã ghi; không hứa quota vô hạn hoặc tự bật dịch vụ trả phí |

## Những chi tiết trong đoạn tư vấn được đánh dấu
| Nội dung | Nơi ghi | Điều kiện/giới hạn |
| --- | --- | --- |
| ZIP mới khác DANAQUEST-WEB cũ; kết quả test không dùng lẫn | Architecture nguồn/hiện trạng; Testing Results; AGENTS | Chưa full audit/chạy ZIP mới |
| Một domain có thể chia đường dẫn/subdomain; không bắt buộc hai domain | Architecture bảng địa chỉ F5 | Ví dụ minh họa; chưa mua/chốt triển khai |
| GitHub giữ code khác hosting; Pages không chạy nguyên Node backend | Architecture Operations/runbook; INDEX nguồn chính thức | Không bảo đảm ứng dụng full chạy chỉ vì upload dist |
| Website có giới thiệu/catalog/map/lịch sử, không gameplay | PRD Website F5; Architecture Website F5 | Hoãn theo cập nhật mới nhất |
| Pixel logo/avatar/coin, text form bình thường, xanh lá/nền ngà/font VI/EN | Design System direction/tokens | Lựa chọn chi tiết là đề xuất, không phải màu đã đo từ logo |
| Xem quest khác chơi; quest khác challenge | PRD thuật ngữ/WF/F; Database | Chặn start/submit server, không chỉ disable nút |
| Lần đầu khác guest sau logout; nhân vật chưa tạo khác user cũ | PRD WF-01–03; Design; Security; Testing | Đã sửa v2.1, O-01 không còn mở lại “có login hay không” |
| DUE phải có điều kiện trình diễn rõ | PRD WF-14/O-04/O-09; Testing RUN-12 | Không bỏ GPS production hoặc bịa dữ kiện trường |
| Dịch vụ miễn phí có giới hạn và attribution | Architecture/Security/INDEX | Kiểm tra lại điều khoản lúc chọn provider |
| Tư vấn cũ minh họa mềm/khóa mọi màn/5–10/80% bị thay thế | PRD Đính chính; Design v2.1; AGENTS | Bảo toàn dữ liệu cũ bằng migration, không tiếp tục làm luật mới |

## Tám file được sửa ở v2.1
1. PRD.md: sửa WF-01/O-01, bổ sung phạm vi website tương lai và đính chính yêu cầu cũ, liên kết bảng đối chiếu.
2. DESIGN_SYSTEM.md: sửa màn onboarding/login gate, chỉ dẫn pixel và game trên laptop, tránh tự tạo website hiện tại.
3. ARCHITECTURE.md: bổ sung website F5, so ba phương án domain và runbook local → hosting gồm mười bước.
4. DATABASE.md: mô tả cờ onboarding không chứa danh tính, vòng đời sau logout/reset, không thay quyền server.
5. SECURITY.md: làm rõ login lần đầu là UX; quyền browse/public và quyền riêng/submit vẫn kiểm tra server.
6. CODE_STYLE.md: thêm kiểm tra coverage trước bàn giao, báo file đổi và không hỏi lại điều đã nêu rõ.
7. TESTING.md: sửa AUTH-08, thêm AUTH-09–11/SCOPE-01/DEPLOY-01/TRACE-01, tất cả planned chưa chạy code.
8. AGENTS.md: sửa yêu cầu first-open, dẫn coverage và đánh dấu hướng cũ không còn hiệu lực.

File bổ trợ mới: REQUIREMENTS-COVERAGE.md này; cập nhật INDEX và ghi chú review để biết bản nào đang dùng. Các phần nội dung quest chính thức, luật hint/reward/replay/GPS, custom parts, quota/privacy/provider vẫn cần quyết định/kiểm chứng; có mô tả không đồng nghĩa đã có câu trả lời cuối cùng.

## Bổ sung giao diện v2.2
Ý 3/7/10/11 nay có artifact nhìn và chuyển màn được tại [ui-design/index.html](ui-design/index.html); [SCREEN-SPECS](ui-design/SCREEN-SPECS.md) chú giải từ nguồn Questo đến thiết kế Dana. [ZIP source](SOURCE-ARCHIVE.md) giữ nguyên 92 ảnh, có SHA-256 đối chiếu. Đây là thiết kế tham khảo, không làm app hoặc tự chốt O; các khác biệt như avatar pixel/Shop/camera draft được đánh dấu là Dana bổ sung.
