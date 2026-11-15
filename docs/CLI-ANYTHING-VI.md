# CLI-Anything trong Dana Quest

## Đã cài gì?

Skill CLI-Anything chính thức cho Codex, có đầy đủ methodology, command specs, guides, script và preview protocol.

- Cấp người dùng: C:/Users/Admin/.codex/skills/cli-anything
- Trong dự án: .agents/skills/cli-anything
- Nguồn: https://github.com/HKUDS/CLI-Anything
- Commit nguồn: 34f519533bc175d2fe287ab8316b0dd99bb9cc43

Đây là bộ hướng dẫn để Codex xây dựng, mở rộng, kiểm thử và kiểm tra chất lượng công cụ dòng lệnh cho phần mềm. Một CLI được tạo ra có thể cho agent thao tác qua lệnh và nhận JSON thay vì phải bấm giao diện.

Skill không tự tạo CLI cho Dana Quest khi cài đặt. Chưa có lệnh cli-anything-danaquest. Không thêm dependency vào ứng dụng React, không thay đổi website và không cài toàn bộ các CLI cho phần mềm khác.

## Dùng trong Codex

Ở lượt tiếp theo, thử gọi skill bằng tên $cli-anything. Nếu chưa xuất hiện trong danh sách skill, đóng và mở lại Codex.

Ví dụ khám phá:

    $cli-anything Liệt kê các CLI-Anything harness hiện có trong dự án này và trên máy. Chỉ đọc.

Ví dụ tạo CLI cho Dana Quest:

    $cli-anything Tạo CLI cho dự án Dana Quest tại C:/Users/Admin/Documents/ChatGPT/Dana Quest 2/Dana-Quest-nhanh-dung. Phạm vi đầu tiên chỉ đọc: liệt kê địa điểm, xem chi tiết quest, kiểm tra sức khỏe API. Dùng dữ liệu/backend thật, hỗ trợ --help và --json, có kiểm thử. Không thay đổi tài khoản, XP hoặc phần thưởng.

Sau khi đã có harness:

    $cli-anything Validate harness của Dana Quest và báo rõ các tiêu chí chưa đạt.

    $cli-anything Test harness của Dana Quest với backend thật; chỉ báo các kiểm tra thực sự đã chạy.

    $cli-anything Refine harness của Dana Quest để thêm bộ lọc địa điểm theo khu vực.

Các ví dụ trên là nội dung gửi trong chat Codex, không phải lệnh PowerShell.

## Phân biệt các thành phần

- Skill: hướng dẫn Codex cách xây dựng công cụ.
- Harness: CLI cụ thể được tạo cho một ứng dụng; cần được xây dựng, cài và kiểm thử riêng.
- CLI-Hub: trình tìm/cài các CLI có sẵn trong hệ sinh thái; là gói riêng, chưa cài trong lần này vì không cần để dùng skill xây CLI cho dự án.

Các harness theo chuẩn upstream thường dùng Python, Click, REPL và đầu ra JSON. Phần mềm đích và dependency tương ứng vẫn phải có. Máy hiện có Python trong runtime đóng gói của Codex; lệnh python thông thường trong PowerShell đang trỏ tới WindowsApps và không chạy được trong phiên kiểm tra. Khi tạo harness cần chọn interpreter thật và môi trường ảo riêng.

## Gỡ cài

Xóa đúng thư mục cli-anything ở cấp người dùng để gỡ khỏi Codex. Xóa .agents/skills/cli-anything để gỡ bản trong repository. Không cần sửa package.json.

## Tài liệu

- https://github.com/HKUDS/CLI-Anything
- https://github.com/HKUDS/CLI-Anything/blob/main/codex-skill/SKILL.md
- https://developers.openai.com/codex/skills/
