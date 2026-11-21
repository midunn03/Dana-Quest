# Trang chủ Dana Quest — 20/11/2026

Phạm vi được duyệt: chỉ giao diện trang chủ. Giữ nguyên chức năng, logic,
backend và các trang khác. Các lần chỉnh UI tiếp theo cần tham khảo thư viện
trước; không tự mở rộng sang trang chưa được người dùng cho phép.

## Hướng thiết kế

Logo gốc giữ nguyên. Xanh đậm `#092b44` làm màu chữ/nền chính, xanh lá
`#1a704a` cho tương tác phụ, vàng `#ffcf31` cho nút chính. Ảnh Công viên
APEC dẫn vào hành trình bên sông Hàn; danh sách quest, hướng dẫn, phần thưởng,
hỏi đáp và tất cả lối vào hiện có được giữ lại.

Taste: “The place carries it”, seed 598416255. Một lần rút lại kiểu chữ;
phông serif được đề xuất không phù hợp với logo và yêu cầu tiếng Việt, nên
chọn Nunito Sans có đủ ký tự Việt/Latin. Font lưu tại dự án, tên CSS riêng
`Dana Home Sans`, giấy phép OFL nằm cùng thư mục font. Không đổi font trong game.

Ý tưởng: lối đi thật ở Công viên APEC trở thành cánh mở đầu cho hành trình
giải đố quanh Đà Nẵng. Tương tác thật dùng lại: chọn quest và đăng nhập sẵn có;
không tạo chức năng mới để phục vụ thiết kế.

## Tham khảo trước khi sửa

- Linktree: https://linktr.ee/thesanskaarsingh
- Tài liệu “21 Design Sites” từ Linktree:
  https://drive.google.com/file/d/1TKN5_r6ds8G4t244sd4yaLqPBYbnh15g/view
  Đã lấy danh sách 21 địa chỉ thư viện trong tài liệu công khai.
- Uiverse: https://uiverse.io/buttons — các phần tử miễn phí theo MIT;
  tham khảo phản hồi khi hover/nhấn và các mẫu nút. CSS trang chủ viết riêng;
  không lấy UI Kits trả phí, không sao chép mã bị Cloudflare chặn truy cập.
- Motion: https://motion.dev/ — phản hồi hover/press và chuyển động có kiểm soát.
- Magic UI: https://magicui.design/ — tham khảo các thành phần miễn phí;
  không sử dụng các mẫu Pro.
- React Bits: https://reactbits.dev/ — tham khảo chuyển động;
  không cài gói hoặc lấy thành phần Pro.
- Giữ lại bốn minh họa Illos miễn phí đã thêm ở lượt trước:
  xem `src/assets/illos/README.md`.
- Font: https://github.com/google/fonts/tree/main/ofl/nunitosans

Không thêm thư viện chạy mới. Hiệu ứng nút, ảnh và xuất hiện nội dung dùng CSS;
observer minh họa và phần hiện nội dung dùng lại nguyên bản hiện có.

## Ảnh và nguồn

Đều là tài nguyên sẵn trong dự án, không tải ảnh mới:

| Vị trí | Ảnh / tác giả / giấy phép lưu trong dữ liệu |
| --- | --- |
| Mở đầu | Công viên APEC — Quang Nguyen Vinh, Pexels License |
| Quest Cầu Rồng | Somerset999, Wikimedia Commons, CC BY-SA 4.0 |
| Quest Cầu Sông Hàn | Nobbipunktcom, Wikimedia Commons, CC BY-SA 4.0 |
| Hỏi đáp | Chùa Linh Ứng — Alexkom000, Wikimedia Commons, CC BY 4.0 |

Nguồn ảnh đặt tại chú thích cạnh ảnh và chân trang. Hình pixel trên quest DUE
là minh họa gốc có sẵn, không phải ảnh chụp trường. Không thêm số liệu hoặc
đánh giá người dùng giả.

## Kiểm tra và giới hạn

- Build thành công. Lint thành công; còn các cảnh báo cũ ngoài phạm vi.
- 9 bài kiểm tra giao diện/luồng liên quan đạt.
- Chrome thật: 1440, 768, 390, 320 px; không tràn ngang, không lỗi JavaScript.
  Menu, đổi Việt/Anh, tab đăng nhập/đăng ký, hiện mật khẩu, hỏi đáp và chế độ
  giảm chuyển động đã kiểm tra. Không gửi thông tin đăng nhập/đăng ký.
- Đối chiếu mã trước/sau: toàn bộ hooks, các hàm trước phần render, handlers,
  liên kết cũ và props đăng nhập giữ nguyên. Chỉ thêm liên kết nguồn ảnh.
- Kiểu chữ, nút và thanh điều hướng mới chỉ áp dụng khi trang chủ hiện diện.
- Bộ đo taste trên bản build: 0 FAIL sau khi tách ba trường hợp đo không đúng
  ngữ cảnh: chú thích ảnh thật bị nhận nhầm thành nhãn trang trí; số ảnh và
  chuyển động bên trong vùng cuộn ứng dụng. Kiểm tra Chrome riêng xác nhận
  bốn ảnh thật tải thành công và 53–55 animation trong các khối được kiểm tra.
- 5 WARN: nền body cũ nằm sau app; nhiều cỡ chữ do form/metadata; không có video
  vì đã có chuyển động SVG/CSS ngắn; font được chọn lại vì tiếng Việt;
  chữ phụ tương phản 6.7:1, cao hơn mức 4.5:1. Không coi cảnh báo là lỗi chức năng.
- Bản đồ, sự kiện, trang quest/chơi game, tài khoản, cửa hàng và giao diện đăng
  nhập ngoài trang chủ chưa được thiết kế lại; chờ người dùng duyệt trước.

## Đánh giá hình ảnh cuối

ROUND 3

Seen in one second: Dana Quest là trải nghiệm khám phá Đà Nẵng, với ảnh thật
và nút vàng dẫn vào cách chơi.

Idea (one sentence): Lối đi ở APEC mở đầu hành trình đi bộ giải đố quanh thành phố.

Live thing: Các liên kết quest và form đăng nhập hiện có.

Layout words by section: hero=ảnh rộng/chữ và form / hướng dẫn=hàng xen kẽ /
quest=ba khung lệch nhịp / thưởng=minh họa và nội dung / FAQ=ảnh và câu hỏi /
CTA=chữ và nút / footer=nguồn và liên kết.

Scores (tự đánh giá): design 7.8 · usability 8.2 · creativity 7.5 · content 8.0
→ overall 7.9. Caps applied: không thêm tương tác mới theo giới hạn người dùng.

Top three problems from earlier rounds, fixed:
1. Ảnh mở đầu đẩy tiêu đề xuống dưới màn hình desktop: giảm chiều cao ảnh/header.
2. Font pixel lẫn vào thanh tìm kiếm/ngôn ngữ: khoanh vùng font mới cho trang chủ.
3. Nút điện thoại nhỏ và chữ ghi nguồn dưới 13px: tăng vùng chạm và cỡ chữ.

Còn hạn chế: ảnh quest DUE vẫn là minh họa có sẵn; ảnh Cầu Rồng chụp đêm nên
khác sắc độ ảnh ban ngày. Có thể chọn tài nguyên khác sau khi người dùng duyệt.
