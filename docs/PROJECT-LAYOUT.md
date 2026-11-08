# Cấu trúc dự án sau khi gom thư mục — 01/11/2026

Thư mục làm việc chính: Dana-Quest-nhanh-dung, cùng cấp package.json. Mở thư mục này trong Codex để công cụ chạy với cwd đúng.

| Đường dẫn | Vai trò |
| --- | --- |
| DESIGN.md | Điểm vào nhận diện và tài liệu tham khảo |
| .agents/skills/ | 41 skill của dự án, bao gồm Impeccable, Taste Skill và Web Design Guidelines |
| .codex/hooks.json | Hook Impeccable, đường dẫn tương đối tính từ gốc ứng dụng |
| skills-lock.json | Nguồn/phiên bản skill được CLI ghi nhận; giữ nguyên nội dung |
| assets/ | Nhân vật, địa điểm và concept; nguồn ZIP chuyển vào docs/archive/source-packages |
| docs/references/visual-source/ | Ảnh tham khảo bổ sung độc nhất; bản trùng đã gộp theo VISUAL-SOURCES.md |
| docs/HUONG-DAN-SKILL-CODEX.md | Hướng dẫn dùng công cụ |
| docs/references/awesome-design-md/ | Thư viện tham khảo 84 mẫu đã nhập trước đó |

Đã chuyển từ workspace cha, không tạo bản copy song song. Đã cập nhật liên kết DESIGN.md trong DOC-INDEX và DESIGN_SYSTEM; sửa chỉ dẫn nguồn ảnh từng trỏ về workspace cha. Không chỉnh src/server/shared, dữ liệu tài khoản, ảnh người dùng, database hoặc cấu hình API.

Không nhập gói ZIP nguồn ban đầu vào ứng dụng. publish-Dana-Quest-nhanh-dung-20261031 là bản checkout/snapshot riêng ở thư mục cha, không nhập vào ứng dụng. Không trộn node_modules, .git hoặc thay đổi riêng của hai cây source.

Playwright MCP và skill cá nhân là cấu hình ở mức người dùng Codex. Dự án chỉ ghi cách thiết lập lại; không nhập config cá nhân, token hay secret vào Git.

Kiểm tra: 237 tệp thiết kế/skill/hook/asset/lock đã khớp SHA-256 ngay sau chuyển; 185 tệp nguồn tham khảo được đối chiếu trước/sau; Impeccable launcher chạy --help từ gốc mới. Kiểm tra riêng liên kết tài liệu sau cập nhật và fingerprint src/server/shared. Không chạy lại toàn bộ test ứng dụng vì không thay mã runtime.

## Sắp xếp nguồn tham khảo — 01/11/2026

Đọc [VISUAL-SOURCES](references/VISUAL-SOURCES.md) để tìm ảnh. Báo cáo cũ ở [archive/reports](archive/reports/), ZIP gốc ở [archive/source-packages](archive/source-packages/). Bảng mapping và kiểm chứng nằm trong [cleanup-2026-11-01](archive/cleanup-2026-11-01/). Không xóa dist/node_modules hay thay mã trong lần này.
