# Hướng dẫn 12 skill đã cài vào Codex

> Cập nhật 03/11/2026: các skill thiết kế/animation/lập trình trong Dana Quest cũng đã được đối chiếu có bản cá nhân dùng cho dự án khác. Xem [GLOBAL-SKILLS.md](GLOBAL-SKILLS.md) để biết phạm vi, ví dụ và cách xử lý các bản cùng tên. Các mục phía dưới giữ hướng dẫn bộ logo/LinkedIn đã cài trước đó.

Đã cài tại `C:\Users\Admin\.codex\skills`. Các skill có thể được nhận diện từ lượt chat tiếp theo. Nếu chưa thấy, mở chat mới hoặc khởi động lại Codex.

## Cách gọi

Viết `$tên-skill` kèm yêu cầu trong ô chat. Bạn cũng có thể nói rõ “Dùng skill tên-skill để…”. Các ví dụ `/li-post` trong tài liệu gốc thuộc cách gọi của Claude; trên Codex nên dùng `$li-post`.

## Thiết kế logo

`$logo-design Thiết kế logo cho Dana Quest, sản phẩm trò chơi giáo dục cho trẻ 8–12 tuổi. Phong cách vui, rõ nét, hiện đại; màu xanh và cam. Cho tôi 3 hướng thiết kế và giải thích lựa chọn.`

Cung cấp: tên chính xác, lĩnh vực, khách hàng, 3–5 tính từ mô tả thương hiệu, màu mong muốn, nơi sử dụng và logo hiện tại nếu có.

Skill hỗ trợ thiết kế mới, đánh giá hoặc cải tiến logo, SVG, biến thể màu, favicon và hướng dẫn nhận diện. Quy trình gốc trình bày 3 phương án trước, chờ bạn chọn rồi mới làm bộ logo hoàn chỉnh. Một số bước xuất ảnh cần Python và trình kết xuất SVG hoặc trình duyệt phù hợp.

## Bộ LinkedIn

| Skill | Công dụng | Ví dụ yêu cầu |
|---|---|---|
| `$li-profile` | Đánh giá và sửa hồ sơ | Chấm điểm hồ sơ sau, viết lại headline và About để thu hút khách hàng giáo dục: [nội dung]. |
| `$li-plan` | Lập kế hoạch tuần | Lập kế hoạch LinkedIn tuần tới, khách hàng ở Việt Nam, múi giờ UTC+7. Chủ đề: giáo dục, trò chơi và AI. Đây là các trải nghiệm thật tuần này: […]. |
| `$li-post` | Viết bài và đề xuất hook | Viết bài từ trải nghiệm sau: […]. Đây là 3 bài cũ của tôi để học giọng văn: […]. |
| `$li-human` | Biên tập cho tự nhiên | Sửa bản nháp sau cho tự nhiên, giữ nguyên ý và dữ kiện: […]. |
| `$li-carousel` | Nội dung bài nhiều trang | Biến chủ đề sau thành carousel 7 trang, có trang bìa và lời kêu gọi hành động: […]. |
| `$li-comment` | Bình luận bài người khác | Viết 3 lựa chọn bình luận cho bài sau, đóng góp một góc nhìn cụ thể: […]. |
| `$li-reply` | Trả lời bình luận bài của bạn | Phân loại và soạn trả lời các bình luận sau: […]. |
| `$li-dm` | Lời mời kết nối và tin nhắn | Soạn lời mời kết nối và tin nhắn tiếp nối cho [vai trò], dựa trên bối cảnh thật sau: […]. |
| `$li-inbox` | Phân loại hộp thư | Phân loại các tin nhắn sau thành khách hàng tiềm năng, tuyển dụng, đồng nghiệp và spam; soạn câu trả lời cần thiết: […]. |
| `$li-repurpose` | Tái sử dụng nội dung dài | Tách bài viết hoặc transcript sau thành các ý bài LinkedIn độc lập cho một tuần: […]. |
| `$li-audit` | Phân tích hiệu quả nội dung | Phân tích các bài và số liệu sau, chỉ ra nội dung nên tiếp tục hoặc dừng: […]. |

### Trình tự bắt đầu

1. Dùng `$li-profile` chỉnh hồ sơ.
2. Cung cấp 3 bài bạn tự viết để bộ skill học giọng văn.
3. Dùng `$li-plan` lập kế hoạch tuần.
4. Dùng `$li-post` hoặc `$li-carousel` để tạo nội dung.
5. Dùng `$li-comment`, `$li-reply`, `$li-dm` khi cần tương tác.
6. Sau khi có số liệu, dùng `$li-audit` đánh giá kết quả.

### Lưu ý tương thích

- Bộ LinkedIn gốc tham chiếu `~/.claude/linkedin/voice.md`, `plan.md` và `log.md`. Đây là đường dẫn gốc của tác giả, không phải thiết lập Codex sẵn có. Có thể yêu cầu Codex dùng một thư mục `linkedin` trong dự án để lưu giọng văn, kế hoạch và lịch sử; nói rõ đường dẫn này khi bắt đầu.
- Skill không đồng nghĩa với kết nối tài khoản LinkedIn. Hãy cung cấp nội dung hồ sơ, bài viết, tin nhắn và số liệu cần xử lý. Bạn tự đăng hoặc gửi các bản nháp.
- Các điểm “human score” là tiêu chí nội bộ của bộ skill, không chứng minh tác giả là người và không bảo đảm vượt công cụ phát hiện AI.
- Những khuyến nghị về thuật toán và giờ đăng trong gói là nội dung của tác giả, chưa được kiểm chứng lại trong lần cài này. Nên điều chỉnh theo số liệu tài khoản của bạn.
- Trên Windows, nếu lệnh `python3` trong tài liệu không chạy, dùng `python` hoặc `py -3` nếu đã cài Python.

## Gói public-apis

`public-apis-master.zip` không có `SKILL.md`, cũng không có README chứa danh mục API. Repo trực tuyến có danh mục trong README.md. Tệp .gitattributes của repo đặt README.md là export-ignore, nên danh mục bị loại khỏi bản ZIP tải xuống. Đây là cấu hình của repo, không phải bằng chứng ZIP bị hỏng. Repo vẫn là tài liệu tra cứu API, không phải skill có sẵn cho Codex. Có thể đọc danh mục tại https://github.com/public-apis/public-apis/blob/master/README.md .

## Kiểm tra cài đặt

Đã đối chiếu SHA-256 toàn bộ tệp cài với tệp trong ZIP: 1.462 tệp của logo-design và 16 tệp của 11 skill LinkedIn khớp hoàn toàn. Đây là kiểm tra toàn vẹn cài đặt; chưa phải kiểm thử tất cả chức năng hoặc các công cụ xuất ảnh/PDF.



## Phạm vi công cụ của dự án — 01/11/2026

Mở Codex trực tiếp tại thư mục Dana-Quest-nhanh-dung (cùng cấp package.json). Skill dự án ở .agents/skills; lockfile ở skills-lock.json; cấu hình hook Impeccable ở .codex/hooks.json; nhận diện ở DESIGN.md. Bộ logo/LinkedIn đã cài trước đó vẫn ở thư mục skill cá nhân của Codex; không tự sao chép toàn bộ công cụ cá nhân vào dự án.

Playwright MCP đã được đăng ký trong cấu hình Codex cá nhân, không phải bên trong .codex/hooks.json. Máy mới cần đăng ký riêng bằng `codex mcp add playwright -- npx.cmd -y @playwright/mcp@latest`. Không sao chép toàn bộ config cá nhân hoặc secret khi bàn giao.
