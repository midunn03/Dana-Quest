# Skill dùng chung cho các dự án — 03/11/2026

## Phạm vi đã kiểm tra

43 skill đang có trong `.agents/skills` của Dana Quest đều có bản cá nhân tương ứng tại `C:/Users/Admin/.agents/skills` hoặc `C:/Users/Admin/.codex/skills`. Đã đối chiếu 272 tệp: không thiếu hoặc khác nội dung. Đây là số skill của dự án được đối chiếu, không phải tổng số skill trên máy.

Lần này bổ sung ba bản còn thiếu tại `C:/Users/Admin/.agents/skills`: `animate-ui`, `impeccable`, `web-design-guidelines`. Các skill lập trình khác và Taste Skill đã có sẵn bản cá nhân; không ghi đè hoặc cài lại.

Giữ các bản trong dự án để người nhận source có hướng dẫn đi kèm. Khi có cả bản cá nhân và bản dự án cùng tên, Codex có thể hiển thị cả hai; chúng không tự gộp hoặc đồng bộ cập nhật. Khi cập nhật sau này, phải xác định phạm vi muốn cập nhật. Không xóa bản dự án nếu hook hoặc tài liệu còn tham chiếu tới nó.

## Dùng trong dự án mới

Mở thư mục dự án mới trong Codex, rồi gọi `$tên-skill` trong chat. Skill có thể được nhận diện từ lượt tiếp theo; tải lại Codex nếu chưa xuất hiện.

| Việc cần làm | Ví dụ |
| --- | --- |
| Animation | `$animate-ui Đề xuất animation nhẹ cho popup của dự án này, chưa sửa code.` |
| Rà giao diện | `$impeccable audit màn đăng nhập, giữ nhận diện của dự án này.` |
| Kiểm tra tính dễ dùng | `$web-design-guidelines Rà giao diện mobile và accessibility.` |
| Rà code | `$code-review Rà thay đổi so với main, chỉ báo lỗi có căn cứ, chưa sửa.` |
| Chẩn đoán lỗi | `$diagnosing-bugs Điều tra lỗi sau, tìm nguyên nhân trước khi sửa: …` |
| Viết theo kiểm thử | `$tdd Xây chức năng sau theo test-first: …` |
| Thiết kế module | `$codebase-design Đánh giá trách nhiệm và interface của module này.` |
| Đặc tả/triển khai | `$to-spec Làm rõ yêu cầu sau thành đặc tả.` hoặc `$implement Thực hiện công việc theo đặc tả đã duyệt của dự án này.` |
| Mô hình miền | `$domain-modeling Làm rõ thuật ngữ và quan hệ trong dự án này.` |
| Nội dung PR | `$pr Soạn mô tả PR từ thay đổi hiện tại, chưa tạo hay gửi PR.` |

Các skill engineering có thể cần cấu hình issue tracker/domain docs theo từng repo; `$setup-matt-pocock-skills` hỗ trợ thiết lập khi thực sự cần. Cài skill không tự cho phép tạo issue, gửi tin, push hoặc thay luật của dự án.

## Những phần không chuyển thành dùng chung

- DESIGN.md, token, ảnh, luật chơi và tài liệu Dana Quest ở lại trong dự án. Dự án khác phải đọc nhận diện và yêu cầu riêng của nó.
- Hook Impeccable vẫn là hook của Dana Quest; không tạo hook tự chạy trên toàn bộ dự án khác trong lần cài này.
- Skill không tự cài dependency như Motion/shadcn và không tự cấu hình nhà cung cấp API. Mỗi dự án thêm dependency khi cần triển khai cụ thể.
- Cấu hình cá nhân ở máy này không tự đồng bộ sang máy hoặc môi trường cloud khác.

Nguồn phạm vi skill: [Tài liệu Codex](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills).
