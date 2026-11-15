# Kết quả sắp xếp và lưu trữ — 01/11/2026

## Phạm vi đã thực hiện

- Di chuyển 49 tệp nguồn/ảnh/tài liệu, không thay nội dung ảnh hoặc ZIP.
- Xóa 142 bản ảnh trùng SHA-256; giảm 144.015.671 byte (khoảng 144 MB). Mỗi bản có nguồn chính được giữ lại theo file-mapping.json.
- Giữ ảnh đã được đặc tả/prototype tham chiếu trong pack Documentation; ảnh bổ sung riêng ở docs/references/visual-source.
- ZIP ảnh Questo và ZIP địa điểm nằm trong docs/archive/source-packages; không xóa gói nguồn.
- Hai ảnh Cầu Sông Hàn ở assets/locations/source-pixel; ảnh Gemini rời ở assets/concepts.
- Báo cáo VISUAL-REVIEW cũ ở docs/archive/reports, có nhãn lịch sử. Nội dung gốc trước chỉnh tài liệu nằm trong documents-before.json.
- README, DOC-INDEX và PROJECT-LAYOUT trỏ tới chỉ mục nguồn chuẩn docs/references/VISUAL-SOURCES.md.

## Kiểm chứng

- 801 tệp mã/cấu hình/tài nguyên chạy/prototype được đối chiếu SHA-256 trước–sau: không đổi. Phạm vi gồm src, server, shared, backend (trừ dữ liệu riêng/cache), public, scripts, tests, .agents, .codex và cấu hình gốc.
- 191 bản ghi di chuyển/gộp được kiểm tra đường dẫn đích. 190 tệp ảnh/ZIP giữ nguyên hash nguồn; một báo cáo Markdown được bổ sung nhãn lịch sử và sửa đường dẫn, có finalSha256 riêng trong manifest.
- 190 liên kết Markdown nội bộ kiểm tra tồn tại, không có liên kết hỏng trong phạm vi tài liệu đã kiểm tra (không kiểm tra các mẫu thương hiệu upstream).
- Không đọc/ghi nội dung .data, database hoặc ảnh người dùng; không thay Git, runtime code, API, dependency, logo chính thức hoặc luật sản phẩm. Giữ dist và node_modules.
- Không chạy lại build/test ứng dụng: không thay mã hoặc cấu hình runtime. Hash chứng minh các tệp được kiểm kê bất biến, không thay thế kiểm thử chức năng.

## Tra cứu và khôi phục

[file-mapping.json](file-mapping.json) ghi đường dẫn cũ, bản chính và SHA-256. Có thể phục hồi tên/đường dẫn bản ảnh đã gộp bằng cách sao chép từ bản chính tương ứng; ảnh gốc duy nhất không bị xóa. [documents-before.json](documents-before.json) giữ văn bản trước cập nhật để phục hồi tài liệu khi cần. Không nạp toàn bộ manifest vào mọi nhiệm vụ; bắt đầu từ [DOC-INDEX](../../DOC-INDEX.md).
