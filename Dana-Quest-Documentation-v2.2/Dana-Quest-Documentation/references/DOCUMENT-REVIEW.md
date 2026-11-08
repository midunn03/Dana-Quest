# Kiểm tra bộ tài liệu v2 — 26/10/2026

## Kết quả kiểm tra pack

- Có đúng tám tài liệu chính: AGENTS.md và bảy file trong docs/.
- Giữ đầy đủ các heading chính của mẫu gốc; đã kiểm tra tự động.
- 79 liên kết nội bộ kiểm tra tồn tại thành công trước khi tạo ghi chú này; liên kết web không thuộc phép kiểm tra file local.
- Có 38 ảnh tham khảo: 33 ảnh Questo chọn lọc, ba ảnh bộ nhận diện, hai contact sheets. INDEX.md tra tên gốc của 92 ảnh Questo.
- PRD có WF-01–15; PH-01/02/03; O-01–09; F-01–12. Thiết kế có Screen S/Component C; TESTING có ca nghiệm thu tài khoản/map/run/photo/security/reward/data/UI.
- Đối chiếu scope: game trình duyệt trước; website F5; F1 chức năng nền tảng; gameplay F2 chưa code; Crew loại bỏ; Shop demo; VI/EN; local/free; push phải xin phép và chỉ nhánh phụ.
- Kiểm tra phân biệt: ảnh kỷ niệm, minh chứng, nhận diện/clue; guest/player khác trạng thái run; solved khác skipped; metadata khác blob; code ZIP mới khác bản DANAQUEST-WEB cũ.
- Kiểm tra đề xuất/unknown: policy hint/coin/GPS/replay/onboarding/avatar/custom/quota/hosting được ghi ở O, không coi số trong ảnh Questo thành luật Dana.
- Bản v1 được giữ riêng tại Dana-Quest-Documentation-v1-preserved; ZIP v1 không ghi đè. Thư mục Dana-Quest-Documentation chứa nội dung v2.

## Không thực hiện

Không sửa source app; không tạo engine/schema/API thực; không chạy full suite ZIP mới; không migrate/xóa dữ liệu player; không triển khai; không push/merge GitHub. Chưa kiểm tra camera/GPS/browser thật trong lượt tài liệu. Chi tiết kiểm thử lịch sử và giới hạn nguồn ở TESTING.md.

## Điểm cần duyệt trước implementation

O-01 onboarding lần đầu, O-02 độ sâu custom avatar, O-03 hint/skip/coin/replay, O-04 GPS/demo, O-05 ảnh/upload/override, O-06 quota/privacy/retention, O-07 run policy, O-08 hosting, O-09 nội dung/quyền ảnh/VI-EN. Các mục này không cản việc đọc/review pack, nhưng agent phải giải quyết mục phụ thuộc trước khi code.

Đây là kiểm tra cấu trúc và nhất quán tài liệu, không chứng nhận sản phẩm đã hoàn thiện hoặc mọi đề xuất đã được phê duyệt.

## Bổ sung v2.1
Tám file chính đã cập nhật theo REQUIREMENTS-COVERAGE.md. Kết quả 79 links/heading phía trên là lịch sử kiểm tra v2, không phải con số v2.1. Lần này kiểm tra lại local links, đủ 8 file, không còn mô tả “bắt buộc login hay xem trước” là quyết định mở. Không chạy/sửa code hoặc thao tác GitHub. Backup thư mục v2 giữ ở Dana-Quest-Documentation-v2-preserved và ZIP v2 nguyên vẹn.

## Kiểm tra thiết kế v2.2
- Tạo prototype offline 33 frame/biến thể, notes từng màn và ảnh nguồn, chưa tích hợp app.
- Browser kiểm tra được: List→Map; đổi mẫu avatar; search không khớp hiển thị empty; photo memory→camera mock→draft→memory saved không complete challenge; gallery có 33 frame/22 ảnh, không broken images và không data-go thiếu target tại lúc kiểm tra.
- Đã sửa một lỗi tên biến JavaScript đụng window.top và icon-only bị tràn text trong quá trình review; bản bàn giao là sau sửa. Đã chụp bốn màn làm overview để kiểm tra trực quan desktop.
- Chưa test mobile devices thật, full VI/EN, mọi modal accessibility hoặc backend. Camera/map/số coin trong prototype là mock.
- Nguyên ZIP 86.566.990 byte giữ trong source-archives, SHA-256 trùng nguồn người dùng, xem SOURCE-ARCHIVE.
- Tám tài liệu chính được cập nhật v2.2 với link artifact và giới hạn; v2.1 được giữ riêng. Link/static packaging được kiểm tra lại khi đóng gói, các số link v2/v2.1 phía trên là lịch sử.
