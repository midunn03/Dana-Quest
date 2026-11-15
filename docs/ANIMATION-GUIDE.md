# Animate UI cho Dana Quest

## Đã cài gì?

Skill chính thức `animate-ui` từ https://github.com/imskyleen/animate-ui được cài vào [.agents/skills/animate-ui](../.agents/skills/animate-ui/SKILL.md), với nguồn được CLI ghi trong [skills-lock.json](../skills-lock.json). Skill có hướng dẫn, recipe, tài liệu và script hỗ trợ cho agent; không đồng nghĩa đã thêm animation vào website.

Lần cài này không thay mã ứng dụng, không chạy codemod và không thêm dependency runtime. Khi mở Codex tại gốc Dana-Quest-nhanh-dung, skill có thể được nhận diện từ lượt tiếp theo; nếu chưa thấy, tải lại hoặc mở chat mới tại thư mục đó.

## Cách gọi trong chat Codex

Gõ `$animate-ui` cùng yêu cầu cụ thể. Không cần tự chạy lệnh terminal để yêu cầu hiệu ứng.

**Rà trước, chưa sửa:**

```text
$animate-ui Rà animation hiện có trong Dana Quest. Đọc DESIGN.md và STYLE_PIXEL.md trước. Liệt kê nơi nên thêm, nơi nên giảm chuyển động và vấn đề hiệu năng/accessibility. Chưa sửa code hoặc cài dependency.
```

**Thẻ quest:**

```text
$animate-ui Thêm phản hồi nhấn nhẹ cho thẻ quest ở Explore. Giữ kiểu pixel và màu hiện tại, không đổi nội dung, route hoặc logic. Không phóng to khi hover. Hỗ trợ reduced-motion và kiểm tra trên mobile.
```

**Popup và sheet:**

```text
$animate-ui Làm popup xác nhận mở/đóng nhẹ và nhanh bằng opacity/transform. Giữ focus, Escape, nút hủy và hành vi xác nhận. Không để animation làm chậm thao tác hoặc gửi dữ liệu lặp.
```

**Phần thưởng:**

```text
$animate-ui Thiết kế animation nhận thưởng vui, dứt khoát theo phong cách pixel. Chỉ chạy sau khi server xác nhận phần thưởng; không cộng xu từ animation. Đề xuất trước, chưa sửa code.
```

**Tiến trình và thông báo:**

```text
$animate-ui Thêm chuyển động nhẹ cho thanh tiến trình quest và toast đã lưu. Dùng transform/opacity, không làm xô nội dung và không báo thành công trước phản hồi server. Kiểm tra reduced-motion và kích hoạt liên tiếp.
```

**Tái hiện một hiệu ứng:**

```text
$animate-ui Tham khảo animation ở [link hoặc video]. Giải thích phần phù hợp với Dana Quest và đề xuất phiên bản pixel nhẹ trước khi code.
```

## Nên bắt đầu ở đâu?

1. Rà button/card và popup hiện có, tránh gắn animation thứ hai lên hiệu ứng đang chạy.
2. Chọn một thẻ quest hoặc popup nhỏ để thử; kiểm tra trên máy tính và điện thoại.
3. Sau khi ổn mới áp dụng có chọn lọc cho toast, tiến trình và hiệu ứng phần thưởng.
4. Không thêm hiệu ứng liên tục lên bản đồ, nội dung câu đố hoặc form đăng nhập chỉ để trang trông bận rộn.

## Cách tích hợp phù hợp với dự án

Dana Quest đang dùng React + TypeScript, Leaflet và component pixel tùy chỉnh, chưa có cấu hình shadcn/ui trong package hiện tại. Vì vậy dùng nhánh **C — custom components** của skill: xem catalog/recipe rồi áp dụng theo từng component. Không chạy `npx @animate-ui/cli@latest animate all` cho dự án hiện tại; lệnh đó phục vụ chuyển đổi các component shadcn được hỗ trợ, không phải nút bật animation cho mọi website.

- Nếu hiệu ứng nhỏ làm được bằng CSS theo yêu cầu, có thể không cần thêm package.
- Nếu dùng component hoặc recipe JavaScript của Animate UI, agent kiểm tra phiên bản hiện hành và dependency tương thích trước khi thêm `@animate-ui/react`/`motion` theo tài liệu. Không dán import vào mã trước khi dependency đã sẵn sàng.
- Không cần cài Tailwind, Radix, shadcn hoặc đổi PixelUI chỉ vì một ví dụ bên ngoài sử dụng chúng.
- Không sửa file skill upstream để ép phong cách riêng; các yêu cầu Dana Quest được ghi tại DESIGN.md/STYLE_PIXEL.md và prompt tác vụ.

## Những quy tắc giữ nguyên cho Dana Quest

- Nhận diện, màu, font và hình khối lấy từ [DESIGN.md](../DESIGN.md), [STYLE_PIXEL.md](../STYLE_PIXEL.md), giá trị runtime từ ExperienceTokens.css.
- Ưu tiên transform/opacity. Blur, spring quá mềm hoặc kéo giãn hình không mặc nhiên phù hợp với pixel art; khi cần đổi chuẩn chuyển động phải nêu rõ đề xuất.
- Reduced-motion giữ đầy đủ nội dung và trạng thái, loại chuyển động không cần thiết theo chuẩn của dự án.
- Enter/exit không phá focus, bàn phím, pointer, camera/GPS, khóa nút đang gửi hoặc luồng rời quest.
- Không dùng animation để xác nhận đã lưu, hoàn thành hay nhận xu khi backend chưa xác nhận. Không đổi luật chấm, dữ liệu, auth hoặc API trong tác vụ làm chuyển động.
- Kiểm tra trạng thái giữa chuyển động, kích hoạt liên tiếp, nhiều kích thước, VI/EN và máy yếu. Phân biệt đã kiểm tra trong browser với chỉ kiểm tra mã.

## Giấy phép và nguồn chính thức

Repo hiện ghi **MIT kèm Commons Clause**, không nên gọi đơn giản là MIT thuần. README mô tả việc sử dụng trong ứng dụng và giới hạn bán/phân phối chính các component; đọc nguyên văn giấy phép trước khi phân phối hoặc đóng gói lại thư viện.

- [Repo / README](https://github.com/imskyleen/animate-ui)
- [Tài liệu](https://animate-ui.com/docs)
- [Giấy phép](https://github.com/imskyleen/animate-ui/blob/main/LICENSE.md)

Không cần khóa API chỉ để dùng skill và các hiệu ứng chạy trong giao diện được mô tả ở đây.
