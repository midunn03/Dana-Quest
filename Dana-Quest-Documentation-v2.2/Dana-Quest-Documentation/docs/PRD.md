# Product Requirements Document — Dana Quest

## Project context

Phiên bản tài liệu: 2.2, ngày 26/10/2026. Chủ quyết định: chủ dự án Dana Quest. Ngôn ngữ tài liệu: tiếng Việt; tên trạng thái/ID kỹ thuật giữ ổn định để agent đối chiếu.

### Cách đọc trạng thái quyết định
- **YÊU CẦU**: người dùng đã nêu, dùng làm cơ sở đặc tả.
- **THAM KHẢO**: quan sát từ ảnh Questo do người dùng cung cấp; không phải khẳng định toàn bộ sản phẩm Questo vận hành như vậy.
- **ĐỀ XUẤT**: phương án thiết kế chi tiết để agent có thể đánh giá; chưa tự coi là yêu cầu đã duyệt.
- **CẦN CHỐT**: thiếu quyết định; không tự triển khai nhánh bị phụ thuộc.
- **HIỆN TRẠNG**: điều quan sát được trong code; có thể chứa lỗi, không ghi đè yêu cầu mới.

YÊU CẦU: ưu tiên game chạy trong trình duyệt, mobile-first; chạy local trước; VI/EN; tham khảo UX Questo, dùng nhận diện pixel Dana Quest; tận dụng bản đồ và dữ liệu cũ đã kiểm tra; 15 quest theo 15 địa điểm và 1 quest DUE để thuyết trình, mỗi quest khoảng 2 thử thách; thay Crew bằng Green Coin Shop. Website giới thiệu được hoãn sang giai đoạn phát triển thêm.

**Phạm vi lần chỉnh này chỉ là tài liệu.** Đặc tả gameplay để chuẩn bị phát triển, không phải yêu cầu lập trình gameplay ngay. Nguồn code mới là Dana-Quest.zip do người dùng gửi, không đồng nhất với thư mục DANAQUEST-WEB cũ. Xem ARCHITECTURE.md về khác biệt và nguồn.

### Mục tiêu sản phẩm
Cho người khám phá Đà Nẵng tìm một hành trình ngắn, biết cần đến đâu, làm thử thách tại nơi đó và lưu kỷ niệm cá nhân. Nhóm người dùng ưu tiên, độ tuổi, mục tiêu học tập/du lịch và số người dùng đồng thời chưa được chủ dự án chốt. DUE là tình huống trình diễn đã được yêu cầu, không tự suy ra toàn sản phẩm chỉ phục vụ sinh viên.

### Thuật ngữ dùng thống nhất
| Khái niệm | Nghĩa | Không đánh đồng với |
| --- | --- | --- |
| Destination / địa điểm | Một đối tượng địa lý đã có ID và tọa độ tham chiếu | Quest hoặc tọa độ cổng vào đã xác minh |
| Quest / hành trình | Nội dung trải nghiệm có mở đầu, thử thách và kết thúc | Một nhiệm vụ ngẫu nhiên cũ |
| Checkpoint / điểm dừng | Vị trí hoặc ngữ cảnh xảy ra một đoạn của quest | Bắt buộc là địa điểm catalog khác |
| Challenge / thử thách | Hành động có điều kiện đạt rõ: đáp án, ảnh hoặc tự xác nhận | Đọc truyện hoặc bấm tiếp |
| Run / lượt chơi | Tiến độ một tài khoản trong một phiên bản quest | Phiên đăng nhập hoặc một tab |
| Story step | Đoạn kể chuyện trước/sau thử thách | Thử thách có thưởng |
| Reference photo | Ảnh do dự án cung cấp để nhận ra nơi/vật thể | Ảnh người chơi đã chụp |
| Memory photo | Ảnh riêng người chơi lưu làm kỷ niệm | Bằng chứng tự động hoàn thành |
| Evidence photo | Ảnh gắn vào một thử thách ảnh | Kết quả AI hoặc xác minh GPS |
| Score / XP / Green Coin | Ba khái niệm riêng; Score/XP còn là đề xuất, Green Coin là tiền game | Tiền thật hoặc số điểm Questo |
| Guest | Người không có phiên hợp lệ | Chủ dữ liệu cũ trong IndexedDB |

## MVP scope

### Các giai đoạn
| Giai đoạn | Có trong phạm vi | Điều kiện chuyển tiếp |
| --- | --- | --- |
| D0 — tài liệu hiện tại | Chốt phạm vi, mô tả màn, vai trò, workflow, gameplay tham khảo/đề xuất, dữ liệu/quyền/test | Chủ dự án xem xét các quyết định còn mở |
| F1 — chức năng nền tảng, khi được yêu cầu code | Đăng nhập/đăng ký/đăng xuất; tùy chỉnh nhân vật; Explore list/map; chi tiết quest; My Quests; Account; đổi VI/EN; Shop/Album đúng mức đã được yêu cầu | Tiêu chí F1 đạt, không giả triển khai gameplay |
| F2 — gameplay, chưa được yêu cầu code | Chạy một quest DUE trước; story, điểm dừng, thử thách, ảnh, lưu/tiếp tục, thưởng theo luật được duyệt | Chơi thử thiết bị thật và bảo toàn dữ liệu |
| F3 — mở rộng nội dung | Chuẩn hóa đủ 16 quest, mỗi quest khoảng hai thử thách, nguồn nội dung và kiểm tra thực địa | Không dùng nội dung nháp như nội dung đã kiểm chứng |
| F4 — phát hành | Chọn hosting/API miễn phí phù hợp; HTTPS; backup; quyền riêng tư; hướng dẫn triển khai | Có yêu cầu triển khai và kiểm tra cấu hình |
| F5 — tương lai | Website giới thiệu riêng, SEO, catalog web, xem lịch sử khi đăng nhập | Không tạo website giới thiệu trong F1/F2 |

Không đưa Crew, multiplayer, mua quest, booking, premium, tiền thật, AI nhận diện ảnh, API trả phí, sự kiện/nhắc sự kiện, bảng xếp hạng hay phát nhạc vào F1 chỉ vì xuất hiện trong code hoặc ảnh. Có thể mô tả chúng ở danh sách hoãn. Một nút mock phải được ghi rõ trong môi trường review, không giả thông báo thành công.

### Vai trò và trạng thái người dùng
Vai trò quyền chỉ có **guest** và **player** trong bản game ưu tiên. Những nhãn dưới là trạng thái của player, không tạo role/database mới cho từng trạng thái.

| Tác nhân/trạng thái | Mục tiêu | Được làm | Bị giới hạn |
| --- | --- | --- | --- |
| Người mới chưa có phiên | Hiểu ứng dụng, vào tài khoản | Xem chào, chọn ngôn ngữ, đăng ký/đăng nhập; lần đầu cần xác thực trước khi vào các trang game | Không tạo run, gửi đáp án, lưu ảnh riêng hoặc đổi xu |
| Guest sau đăng xuất | Tiếp tục xem nội dung | Explore, map, chi tiết quest, Shop catalog công khai nếu duyệt | Không xem ảnh/lịch sử/số xu của tài khoản vừa thoát |
| Player chưa có nhân vật | Hoàn tất hồ sơ ban đầu | Chọn nhân vật và lựa chọn tùy chỉnh đã hỗ trợ | Không tự bỏ qua nếu nhân vật là điều kiện bắt đầu quest |
| Player sẵn sàng | Tìm và bắt đầu quest | Browse, xem chi tiết, tạo run khi điều kiện đạt | Không bắt đầu nội dung chưa xuất bản |
| Player đang chơi | Tiếp tục đúng bước | Đọc truyện, định vị, trả lời, chụp, dùng trợ giúp theo luật | Không nhảy checkpoint, tự tăng xu hoặc đọc ảnh người khác |
| Player tạm dừng | Quay lại sau | Resume từ bước đã lưu; xem ảnh riêng | Không bị tạo run trùng chỉ vì tải lại |
| Player hoàn tất | Xem kết quả/kỷ niệm | Xem lịch sử, album, thưởng và Shop | Replay/reward lặp cần chính sách riêng |
| Người thuyết trình | Demo tại DUE | Dùng tài khoản test và nội dung demo được nhận diện rõ | Không có quyền quản trị hoặc bỏ GPS âm thầm |
| Chủ dự án/biên tập | Duyệt nội dung, nhận diện, quyết định mở | Cập nhật qua quy trình source/review hiện tại | Chưa yêu cầu xây dashboard admin |
| Người vận hành | Chạy server/backup khi có triển khai | Quyền hạ tầng riêng, không là tính năng người chơi | Không mặc định có quyền xem ảnh qua UI |

Thông tin cá nhân, ảnh, run, coin và redemption thuộc tài khoản. Nhân vật pixel là avatar trò chơi, không bắt buộc dùng ảnh mặt hoặc camera khi đăng ký.

### Catalog định hướng
Giữ 15 ID địa điểm active để truy vết: Cầu Rồng; Cầu Sông Hàn; Bảo tàng Đà Nẵng; Bảo tàng Điêu khắc Chăm; Công viên APEC; Cầu Tình Yêu; Mỹ Khê; Công viên Biển Đông; Mân Thái; Linh Ứng Bãi Bụt; Đỉnh Bàn Cờ; Hải Vân Quan; Ngũ Hành Sơn; Cầu Vàng; Nam Ô. Thêm quest tại Trường Đại học Kinh tế – Đại học Đà Nẵng. **16 là mục tiêu nội dung, không phải số quest đã hoàn thiện.** Hai thử thách có thể cùng một khu vực, không mặc định buộc người chơi đi giữa hai địa điểm xa.

Mẫu nội dung mỗi quest: questId, destinationId, tên VI/EN, mô tả, ảnh cover có quyền dùng, điểm bắt đầu/ảnh nhận diện/địa chỉ, cảnh báo an toàn, thời lượng có căn cứ, mở đầu, checkpointOrder, hai thử thách, hint, cách đạt, nội dung sau đạt, kết thúc. Không tự bịa giờ mở cửa, vé, lối đi, tọa độ chi tiết hay dữ kiện lịch sử. Quest DUE trong ZIP đã có bản nháp; cần đối chiếu nguồn/thực địa trước khi đưa đáp án thành chính thức.

## User journeys

Mỗi workflow nêu actor, đầu vào, bước, dữ liệu thay đổi, kết quả và ngoại lệ. Số WF là khóa tham chiếu cho DESIGN_SYSTEM/TESTING.

### WF-01 — mở ứng dụng và định tuyến đầu vào
1. Trình duyệt mở game; UI tải cấu hình, catalog và kiểm tra phiên. Trong lúc kiểm tra, chưa hiện tên/ảnh/số xu cache của người khác.
2. Nếu phiên hợp lệ: đọc profile; chưa có avatar → màn nhân vật; có avatar → Explore hoặc điểm quay lại được cho phép.
3. **YÊU CẦU từ ý 4 ghi chú gốc:** lần đầu vào game phải qua đăng nhập/đăng ký, không tự thêm nút Khám phá trước. Sau khi người đã sử dụng đăng xuất, họ được xem Explore và chi tiết quest nhưng phải đăng nhập lại để bắt đầu/thực hiện quest. Khi đang kiểm tra phiên, không cho nháy màn riêng tư.
4. **CẦN CHỐT O-01 chỉ còn cách nhận biết lần đầu**, không còn hỏi lại có bắt buộc login hay không. ĐỀ XUẤT: một cờ onboarding cục bộ chỉ được ghi sau lần xác thực thành công; logout không xóa cờ này. Người chưa có cờ đi đến login ngay cả khi mở deep link Explore/detail; người có cờ và đã logout được browse public. Cờ không chứa userId, token hoặc dữ liệu riêng và không phải bằng chứng bảo mật. Nếu xóa dữ liệu trình duyệt/đổi browser/thiết bị, trải nghiệm lần đầu lặp lại trừ khi có chính sách khác được duyệt. Không thể biết một người đã từng dùng trên thiết bị khác khi chưa xác thực.
5. Lỗi server khi kiểm tra phiên khác với 401; hiển thị kết nối lỗi + thử lại, không kết luận sai mật khẩu.

### WF-02 — đăng ký, đăng nhập, quay lại hành động trước đó
1. Guest chọn đăng ký; nhập tên và mật khẩu; email/phone tùy chính sách hiện tại. Báo lỗi cạnh trường; không giữ mật khẩu sau reload.
2. UI khóa submit trong một yêu cầu; server kiểm tra, tạo tài khoản và phiên. Thành công chuyển tạo nhân vật, không tạo quest run trước.
3. Đăng nhập người cũ: xác thực → đọc hồ sơ; có avatar thì quay về ý định trước đó, chưa có thì tạo avatar trước.
4. Nếu bị chặn lúc bấm bắt đầu quest, lưu return intent chỉ gồm hành động/ID nội bộ đã kiểm tra. Sau login hiển thị lại điểm bắt đầu; không tự gọi hoàn thành hay đổi thưởng.
5. Sai mật khẩu/trùng tên/giới hạn thử/mất mạng có thông báo riêng; không giả lưu local thành tài khoản server.
6. OAuth Apple/Google và reset mật khẩu trong ảnh Questo chỉ là tham khảo, chưa có yêu cầu tích hợp; chỉ hiện nút khi chức năng thực và miễn phí phù hợp đã được duyệt.

### WF-03 — tạo và sửa nhân vật
1. Player mới thấy preview pixel, tên lựa chọn và các tùy chọn được hỗ trợ thật. ĐỀ XUẤT F1 chọn nhân vật có sẵn; quần áo/tóc/màu tự do chỉ thêm sau khi bộ asset hợp lệ.
2. Chọn trước chỉ thay preview; xác nhận mới ghi vào tài khoản. Loading/failed/success rõ; lỗi thì giữ lựa chọn để thử lại.
3. Thành công cập nhật avatar ở Account và các màn dùng chung. Tải lại/máy khác cùng backend đọc lựa chọn đã lưu.
4. Sửa từ Account giữ avatar cũ đến khi lưu xong; hủy không thay avatar và không thay run/coin.

### WF-04 — Explore danh sách và bản đồ
1. Guest/player mở Explore: tiêu đề, ô tìm, card quest, điều khiển chuyển List/Map. Cùng một bộ lọc và catalog cho hai chế độ.
2. Chạm card → chi tiết; bấm Map → bản đồ Dana Quest trong ZIP, không thay bằng bản đồ/địa điểm Questo.
3. Chạm ghim → thẻ tóm tắt đúng quest; xem chi tiết → trang đầy đủ. Back khôi phục filter/vị trí cuộn và viewport hợp lý.
4. Xin GPS khi chọn gần tôi/định vị, không biến quyền GPS thành điều kiện đọc catalog. Từ chối vẫn tìm/chọn thủ công được.
5. Catalog rỗng/lỗi, không khớp tìm kiếm và lỗi tile là ba trạng thái khác nhau. Tile lỗi vẫn dùng list/thẻ; không xóa vị trí người dùng đã chọn.

### WF-05 — chi tiết quest và chặn bắt đầu
Hiển thị cover, tên, tóm tắt, khu vực, số thử thách dự kiến, điểm bắt đầu, ảnh nhận diện, ghi chú an toàn, ngôn ngữ có sẵn; thiếu dữ liệu nói rõ. Guest chọn bắt đầu → yêu cầu login, có thể đóng và tiếp tục xem. Player có run dở → Tiếp tục; chưa có → xem chuẩn bị. Quest chưa sẵn sàng → không cho chơi và giải thích; không hiện giá/voucher mua quest từ mẫu Questo.

### WF-06 — chuẩn bị và tạo lượt chơi (đặc tả F2)
1. Xác định tài khoản, avatar, quest/version và ngôn ngữ nội dung. Hiện giới thiệu ngắn, thời gian ước tính nếu có căn cứ và cảnh báo không nhìn màn hình khi băng đường.
2. Xem mở đầu → điểm bắt đầu với hai tab Ảnh nhận diện/Bản đồ; hiển thị địa chỉ và nguồn tọa độ.
3. GPS có thể hỗ trợ đo gần; ảnh nhận diện và xác nhận bằng mắt là luồng riêng. Ngưỡng GPS cũ không tự là luật mới; xem O-04.
4. Bấm bắt đầu gửi yêu cầu có khóa chống lặp. Server tạo đúng một run phù hợp hoặc trả run dở sẵn có; thất bại không được UI tự nhận đang chơi.
5. Vào story đầu, mời lưu ảnh kỷ niệm (có thể bỏ qua theo đề xuất PH-01), rồi đến thử thách 1. Thứ tự này là phương án Dana Quest, không tuyên bố toàn bộ Questo bắt buộc giống vậy.

### WF-07 — vòng chơi tại mỗi checkpoint (đặc tả F2)
Run đang hoạt động → đọc story/chỉ dẫn → nhận diện điểm bằng ảnh/map → mở challenge → gửi đáp án/minh chứng → nhận kết quả → đọc nội dung sau kết quả → checkpoint tiếp hoặc tổng kết. Back cho đọc lại phần đã mở nhưng không tự hoàn tác kết quả. Reload tiếp tục từ trạng thái server đã lưu; UI scroll position không phải bằng chứng hoàn thành.

Text: nhập câu trả lời, submit disabled khi rỗng/đang gửi. ĐỀ XUẤT trim/Unicode/case theo từng challenge; bỏ dấu chỉ khi tác giả duyệt, không mặc định vì có thể đổi nghĩa. Sai thì ở lại, giữ câu trả lời và cho sửa; lỗi mạng không tính là đáp án sai. Đúng thì lưu kết quả một lần trước khi mở bước tiếp.

Single choice: chọn đúng một optionId, chưa gửi thì có thể đổi. Dịch VI/EN không đổi ID đáp án. Response thành công mới khóa kết quả. Observation: phải gọi là tự xác nhận, không gắn nhãn đã chứng minh. Photo challenge: dùng PH-02, có ảnh chưa đồng nghĩa hoàn thành.

### WF-08 — trợ giúp, gợi ý, bỏ qua
Mở Help → chọn gợi ý/xem đáp án/báo sự cố. THAM KHẢO Questo có hộp xác nhận trước gợi ý, giới hạn hiển thị và ảnh hưởng điểm; bỏ qua có kết quả riêng rồi đọc tiếp truyện. ĐỀ XUẤT Dana Quest lưu hintUsed, skipped và answerRevealed thành dữ kiện riêng, không coi skipped là solved. Mọi mức trừ điểm, số hint, có cho skip hay không, có hoàn tất quest khi skip hay không đều ở O-03. Hủy hộp không tiêu hint/xu. Gửi lặp không trừ hai lần. Báo lỗi không tự skip hay cộng thưởng.

### WF-09 — chụp ảnh, xem trước, lưu (PH-01/PH-02/PH-03)
**PH-01: kỷ niệm mở đầu/giữa/kết thúc.** Mời chụp, có Bỏ qua/Để sau. Không chụp vẫn có thể tiếp tục theo đề xuất; ảnh không thưởng và không phải challenge. **PH-02: minh chứng challenge.** Nêu rõ đối tượng nên chụp và điều kiện; cần ảnh lưu thành công + người dùng xác nhận/gửi minh chứng. **PH-03: ảnh nhận diện/câu đố của dự án.** Chỉ xem/phóng to; không mở camera, không sao chép vào album riêng như ảnh do người chơi chụp.

Workflow đầy đủ PH-01/02:
1. Màn nguồn lưu runId/checkpointId và purpose. Nút chụp giải thích mục đích trước khi gọi camera.
2. Chỉ xin camera sau thao tác; không xin microphone. Đang chờ quyền → có thể hủy an toàn.
3. Có quyền → preview trực tiếp; ưu tiên camera sau trên điện thoại, camera khả dụng trên laptop. Không giả chắc chắn đổi camera được trên mọi thiết bị.
4. Chụp → đóng/dừng stream theo lifecycle → ảnh draft, không gọi đã lưu. Chụp lại thay draft; hủy draft giữ ảnh cũ đã lưu.
5. ĐỀ XUẤT giữ chọn ảnh thiết bị làm fallback như code cũ; nếu thử thách bắt buộc ảnh trực tiếp cần quyết định riêng, không tự hứa chống gian lận.
6. Giới hạn kỹ thuật tạm kế thừa: JPEG/PNG/WebP ≤10 MiB đầu vào; xử lý JPEG cạnh dài ≤1600 px; đầu ra ≤3 MiB. HEIC không hỗ trợ phải hướng dẫn đổi; server kiểm tra độc lập. Ngưỡng này là đề xuất tái sử dụng, chưa chứng minh tối ưu trên mọi máy.
7. Kiểm tra sáng/tối/kích thước/chi tiết cục bộ chỉ đưa gợi ý. Không nhận diện người, địa danh hoặc xác minh ảnh đúng nhiệm vụ. Fail có thể cho tự xác nhận dùng ảnh theo chính sách O-05; trạng thái đó lưu là user_reviewed, không đổi thành AI_verified.
8. Người dùng chọn Lưu → UI khóa thao tác; server kiểm tra phiên, owner, run, checkpoint, loại ảnh, giới hạn; chỉ khi commit thành công mới tạo photoId và hiển thị đã lưu.
9. PH-01: quay về story/bước nguồn, tiến độ challenge không đổi. PH-02: hiện ảnh đã lưu và nút Xác nhận/Hoàn thành riêng; server kiểm tra ảnh thuộc chính run/checkpoint/owner trước khi hoàn thành.
10. Lưu lỗi giữ draft trong phiên màn hiện tại và cho thử lại; không hứa draft tồn tại sau refresh nếu chưa có lưu nháp bền vững. Mất phản hồi sau lưu dùng operationId để tránh thêm ảnh trùng.
11. Ảnh mặc định riêng tư. Hộp xin chia sẻ cộng đồng/marketing của Questo không tự đưa vào Dana Quest; chưa có feed công khai/tiền thưởng chia sẻ.
12. Khi rời camera, logout, tab bị ẩn hoặc thay thiết bị, dừng track; nếu quay lại thì yêu cầu thao tác mở lại. Kiểm tra lifecycle trên browser thật.

### WF-10 — album và vòng đời ảnh
Player mở album → lấy metadata riêng → mở ảnh theo nhu cầu. Có rỗng/loading/lỗi ảnh từng tấm/lỗi toàn danh sách. Card nêu quest, checkpoint/purpose và thời điểm lưu; không gọi thời điểm server lưu là ngày chụp nếu không có metadata tin cậy. Phóng to/tải về bản đã xử lý/xóa có xác nhận. ĐỀ XUẤT xóa ảnh cá nhân không thu hồi coin đã cấp; thử thách đã đạt vẫn lưu kết quả và photoDeletedAt để truy vết, không giữ blob bí mật sau khi báo xóa. Ảnh draft chưa lưu không xuất hiện ở album. Đổi tài khoản xóa preview/cache riêng và hủy request cũ.

### WF-11 — tạm dừng, thoát, tiếp tục, hết phiên
ĐỀ XUẤT rời gameplay giữ run đang dở; My Quests hiển thị Tiếp tục. Thoát màn khác với xóa run. Nếu có dữ liệu draft chưa gửi, cảnh báo trước khi bỏ. Logout thu hồi phiên và dọn dữ liệu riêng trên UI nhưng không xóa ảnh/tiến độ server. Phiên hết hạn lúc lưu → giữ draft khả thi trong bộ nhớ, yêu cầu login, xác minh lại owner và trạng thái; không tự gửi draft của A sang B. Offline chưa được coi là hỗ trợ chơi offline; đọc cache nếu có phải hiển thị mức dữ liệu đã lưu, không đánh dấu challenge thành công.

### WF-12 — kết thúc, thưởng, My Quests và Shop
Sau challenge cuối đạt điều kiện, server ghi run result và reward trong cùng logic nguyên tử; tổng kết nêu số solved/skipped, trạng thái trợ giúp, ảnh đã lưu, coin thực nhận. Màn kết thúc không tự cộng thưởng mỗi lần mở. My Quests phân biệt chưa bắt đầu/đang chơi/đã kết thúc; kết thúc có skip không đánh đồng giải đúng mọi câu. Replay và quyền nhận thưởng lần nữa ở O-03. Shop liệt kê item và số coin từ server; guest chỉ xem catalog nếu cho phép, bấm đổi cần login. Player xác nhận đổi → kiểm tra đủ coin, item còn hợp lệ và khóa lặp → trả giao dịch → cập nhật số dư; lỗi không báo đổi thành công. Green Coin/voucher vẫn là demo cho đến khi chủ dự án quyết định khác; không hứa dùng được tại đối tác thật.

### WF-13 — đổi ngôn ngữ và báo sự cố
Đổi VI/EN giữ tài khoản, run, đáp án draft khi an toàn và photoId; chỉ thay bản dịch. Quest thiếu bản dịch hiển thị ngôn ngữ thực và lựa chọn quay lại, không sinh dịch giả. ErrorCode ổn định để client dịch; tên địa danh có bản gốc. Báo sự cố gồm nhóm bản đồ/chỉ dẫn, câu đố, ngôn ngữ, ứng dụng, khác; payload tối thiểu, ảnh/log chỉ khi chủ sở hữu chọn. Chưa có backend báo lỗi thì UI nói rõ chưa gửi được, không tạo mã yêu cầu hỗ trợ giả.

### WF-14 — demo DUE
Chuẩn bị tài khoản test, avatar, quest DUE hai thử thách và dữ liệu VI/EN có nguồn. Trước buổi demo kiểm tra mạng, HTTPS nếu dùng điện thoại, camera/GPS, đường đi và nơi được phép đứng. Nếu cần demo tại lớp khác vị trí thật, phải có chế độ demo riêng, nhãn rõ, dữ liệu test tách thật, không ảnh hưởng coin/lịch sử thật. Chế độ này là ĐỀ XUẤT cần duyệt; chưa tự bỏ điều kiện vị trí trong production. Nội dung/đáp án DUE từ code là bản nháp, không bằng chứng đã xác minh.

### WF-15 — người biên tập và vận hành (không xây admin mới)
Chủ dự án nhận bản nháp quest → rà sự thật/nguồn/quyền ảnh/VI-EN/an toàn → kiểm tra hai thử thách có thể làm tại chỗ → duyệt phiên bản → cập nhật catalog qua source và review. Người vận hành kiểm tra cấu hình, backup/restore, trạng thái dịch vụ khi triển khai được yêu cầu. Không tạo quyền đọc ảnh người chơi hoặc nút chỉnh số coin cho admin khi chưa có đặc tả.

## Feature specifications

### Cơ chế quan sát từ ảnh Questo
Nguồn ảnh nguyên gốc và chú giải ở ../references/INDEX.md. Chỉ mô tả trạng thái nhìn thấy, không suy ra thuật toán server, mức GPS, cơ chế kiểm tra đáp án, công thức thời gian/điểm hoặc khả năng chống gian lận.

| REF | Bằng chứng | Điều quan sát được | Chuyển sang Dana Quest |
| --- | --- | --- | --- |
| Q-01 | 002, 014, 037, 040, 046 | Explore có card, ô tìm; map có ghim và thẻ quest | List/map chung catalog, dùng map Dana |
| Q-02 | 016, 026, 027 | Chi tiết quest có giới thiệu, việc cần làm, phần thông tin và ảnh | Chọn phần phù hợp; không thêm mua vé/review giả |
| Q-03 | 043, 048, 072 | Chuẩn bị có ngôn ngữ, lựa chọn chế độ, briefing | VI/EN, briefing; timer/multiplayer/offline hoãn |
| Q-04 | 031, 028, 044 | Điểm bắt đầu có photo/map, khoảng cách, trạng thái quá xa và xác nhận bằng ảnh | Tách nhận diện bằng mắt và phép đo GPS |
| Q-05 | 077, 032, 052 | Mời ảnh đầu run, xin quyền, lưu kỷ niệm riêng, tùy chọn chia sẻ | Camera đúng ngữ cảnh; ảnh riêng mặc định; không tự thêm chia sẻ |
| Q-06 | 067, 075, 054 | Story, hướng dẫn đến điểm và nút chuyển tiếp | Story step độc lập challenge |
| Q-07 | 065, 071 | Ảnh câu đố phóng to, ô đáp án, check và help | Không hiểu ảnh câu đố là ảnh upload |
| Q-08 | 055, 063, 017, 018 | Hint có xác nhận/ảnh hưởng điểm; xem đáp án; bỏ qua; đọc tiếp truyện | Lưu trạng thái kết quả riêng; công thức Dana chưa chốt |
| Q-09 | 074, 057, 060 | Menu chơi, báo sự cố, thoát và giữ tiến độ | Pause/resume; không thêm nhạc/mời bạn vì chỉ có trong ảnh |
| Q-10 | 079, 025, 042, 078 | Guest profile nhắc login; My Quests; account/settings | Bảng quyền guest/player, lịch sử riêng |

**Không có bằng chứng từ bộ ảnh rằng Questo yêu cầu AI đối chiếu ảnh đúng địa danh.** Camera prompt trong một ảnh ghi mục đích avatar trong khi nền là luồng kỷ niệm: đây là điểm không nhất quán của ảnh tham khảo, không sao chép sang lời xin quyền Dana. Không dùng con số 15 điểm dừng, bộ đếm 85 phút, 100 điểm, ba hint hay khoản thưởng chia sẻ của quest mẫu làm cấu hình Dana.

### Trạng thái đề xuất để agent thiết kế (F2, chưa triển khai)
Run: not_started → briefing → locating → active → paused → active → completed. abandoned chỉ khi có xác nhận dừng vĩnh viễn; hết phiên không phải abandoned. completed là kết thúc luồng, chất lượng solved/skipped tách riêng.
Checkpoint: locked → available → story → challenge → submitting → solved/skipped → aftermath → next. Wrong/network_error quay về challenge, không mở next; photo_uploaded chưa solved. Các bước UI chưa ghi server không được dùng để cấp thưởng.
Photo: none → requesting_permission → camera_live → draft → processing → ready → uploading → saved → deleted; denied/device_error/invalid_file/upload_failed là trạng thái lỗi có đường phục hồi. Ảnh PH-03 không tham gia state machine upload.

### Ma trận yêu cầu và nghiệm thu
| ID | Phạm vi | Hành vi/tiêu chí chấp nhận |
| --- | --- | --- |
| F-01 | F1, tài khoản | Guest không đọc dữ liệu riêng; 401/403 phân biệt; logout dọn UI; không mất run server |
| F-02 | F1, nhân vật | User chưa có avatar đi đúng onboarding; hủy preview không thay profile; lỗi lưu không chuyển tiếp |
| F-03 | F1, Explore | Guest xem catalog theo chính sách; list/map cùng lọc; map dùng tài nguyên Dana; tile lỗi không làm mất list |
| F-04 | F1, quest detail/My Quests | Detail công khai, start chặn login; trang quest cá nhân không lộ sang user khác; nút tiếp tục phản ánh server |
| F-05 | F1, i18n | VI/EN cho UI/lỗi; đổi ngôn ngữ không đổi ID/run; thiếu nội dung báo rõ |
| F-06 | F2, run/story/challenge | Quest khoảng hai challenge, theo thứ tự; đọc truyện không hoàn thành; reload không tạo run trùng |
| F-07 | F2, ảnh | PH-01 bỏ qua được theo đề xuất; PH-02 lưu riêng rồi submit; PH-03 chỉ xem; mất mạng không báo đã lưu |
| F-08 | F2, giúp đỡ/vị trí | Hint/skip có xác nhận và trạng thái riêng; GPS yếu có phục hồi; policy cần chốt trước code |
| F-09 | F1/F2 theo yêu cầu, album | Chỉ owner đọc/xóa; ảnh sống qua cập nhật tiến độ; tải/xóa từng ảnh có lỗi rõ |
| F-10 | F1/F2 theo yêu cầu, Shop | Không cộng/trừ lặp; không số dư âm; demo rõ; không fake giao dịch |
| F-11 | F2/F3, DUE/catalog | 16 quest mục tiêu, hai challenge/quest; DUE kiểm tra demo đầu tiên; không phát hành nội dung chưa xác minh |
| F-12 | Mọi giai đoạn | Local trước; không API trả phí; không push khi chưa hỏi; không tự merge/push main |

## Success measures
Chưa chốt KPI sản phẩm. ĐỀ XUẤT đo: tỷ lệ bắt đầu/hoàn tất quest DUE, tỷ lệ lỗi lưu ảnh, tỷ lệ resume thành công, tỷ lệ tìm được điểm đầu và lỗi quyền. Dữ liệu đo tối thiểu, không thu GPS chính xác/ảnh để làm analytics. Tiêu chí kỹ thuật: không lộ owner, không mất blob sau action khác, không cấp thưởng lặp, không có lỗi UI chặn luồng trên màn 390 px và điện thoại thật. Chưa cam kết con số hiệu năng khi chưa đo.

## Open decisions
| ID | Quyết định cần chốt | Đề xuất để xem xét | Chặn bước nào |
| --- | --- | --- | --- |
| O-01 | Cách nhận biết lần đầu, deep link, xóa dữ liệu/thiết bị khác | Yêu cầu login lần đầu đã rõ; đề xuất cờ sau xác thực thành công, không làm quyền server | Chi tiết onboarding F1 |
| O-02 | Custom avatar đến mức nào | Chọn bộ nhân vật có sẵn trước | Code avatar F1 |
| O-03 | Hint, skip, score, coin, replay | Không đếm giờ, chơi solo, thưởng một lần; chưa gán số | Engine/Shop F2 |
| O-04 | GPS là bắt buộc hay hỗ trợ, demo trong lớp | Có đường phục hồi và chế độ demo tách dữ liệu | Engine vị trí F2 |
| O-05 | Ảnh bắt buộc trực tiếp, fallback upload, override chất lượng | Cho upload, chất lượng là gợi ý; riêng tư mặc định | Photo challenge F2 |
| O-06 | Quota/retention/xóa tài khoản và ảnh | Giới hạn rõ, không hứa lưu vô hạn | Phát hành có user thật |
| O-07 | Lưu một hay nhiều run, chuyển quest giữa chừng | Một run chưa kết thúc mỗi user/quest; không tự giới hạn toàn app | Schema/runtime F2 |
| O-08 | Hosting/backend/lưu ảnh miễn phí | Chọn sau spike tương thích, không mặc định GitHub Pages chạy Node | Triển khai F4 |
| O-09 | Nội dung/đáp án 16 quest, quyền ảnh, VI/EN | Duyệt DUE trước, còn lại nội dung draft | F3/publication |

Chủ quyết định các O: chủ dự án; agent chuẩn bị phương án và hệ quả. Các O không chặn việc viết tài liệu, nhưng chặn nhánh code phụ thuộc. Không coi hết thời gian hoặc im lặng là đồng ý.

## Definition of ready
Yêu cầu người dùng mới nhất được ưu tiên; giao diện/gameplay/website tương lai tách giai đoạn; mỗi hành động có actor, dữ liệu và lỗi; quy tắc chưa chốt có ID. Trước code một lát cắt, duyệt phần liên quan, có test nghiệm thu và đường giữ dữ liệu cũ. Bộ tài liệu chi tiết không tự chứng minh code đã đúng hoặc phát hành được.



### Yêu cầu website tương lai — làm rõ v2.1
Theo cập nhật mới nhất, game trình duyệt là sản phẩm hiện tại. Website giới thiệu giữ ở F5: giới thiệu, hướng dẫn, catalog/Explore/map/quest detail và khả năng xem hành trình cá nhân sau đăng nhập; không thực hiện gameplay tại website. Không phân quyền/chọn khu chỉ bằng độ rộng màn hình. Ba phương án domain và runbook local → hosting ở ARCHITECTURE.md là nội dung tư vấn/phát triển sau, chưa là quyết định mua domain hay triển khai.

### Đính chính các hướng đã bị thay thế
Bản tư vấn/README trước mô tả minh họa mềm, khóa mọi màn khi chưa login, mission ngẫu nhiên 5–10 và ngưỡng 80%. Yêu cầu mới ưu tiên pixel nhận diện + bố cục Questo, login lần đầu nhưng browse sau logout, và 16 quest mục tiêu khoảng hai challenge mỗi quest. Những lựa chọn cũ không tiếp tục là tiêu chuẩn thiết kế mới; dữ liệu/ID cũ vẫn phải bảo toàn và có kế hoạch chuyển khi code. Không thay thế yêu cầu mới bằng hành vi lỗi đang có trong source.

Bảng đối chiếu toàn bộ 14 ý gốc và nội dung tư vấn xem [REQUIREMENTS-COVERAGE](../references/REQUIREMENTS-COVERAGE.md).


### Thiết kế tham khảo v2.2
Bản UI tại [references/ui-design](../references/ui-design/index.html) và [SCREEN-SPECS](../references/ui-design/SCREEN-SPECS.md) cụ thể hóa S-01–16/WF, có 33 màn và biến thể. Đây là prototype chỉ điều hướng để review, không phải implementation F1/F2 hoặc quyết định tự duyệt các O. Nội dung Cầu Rồng/Shop mẫu không thay kịch bản DUE hoặc catalog 16 quest cần duyệt. ZIP Questo nguyên bản được giữ trong references/source-archives, có checksum ở SOURCE-ARCHIVE.md.
