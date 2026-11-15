# Quest detail / creator: đối chiếu Questo

**Trạng thái mới nhất:** có 16 quest cốt truyện, DUE năm thử thách và 15 quest khác hai thử thách. Luật nhiệm vụ 80% chỉ còn cho dữ liệu lịch sử; người dùng đã yêu cầu thay phần chơi cũ bằng mẫu DUE. Thư viện hiển thị ảnh bìa. Xóa ảnh thật vẫn chờ định danh tài khoản người dùng.

Nguồn: toàn bộ IMG_6747 đến IMG_6756 trong thư mục Quest detail page (10 ảnh). Không sửa Django, không push; giữ quest solo, thứ tự checkpoint và thưởng hiện tại.

Thiết kế: nền trắng, chữ #36352f, viền #e9e4d8, hồng #df2776; hồ sơ nhà sáng tạo dùng thẻ tím đậm như mẫu. Mobile có thanh quay lại ghim và thanh Chơi dưới; desktop nội dung rộng và cột chơi bên cạnh. Divider đường nét đứt/pin, cards viền dày, gallery cuộn ngang, nhãn beta.

Phạm vi đối chiếu:
- 6747: cover/back/share-invite/favorite, beta, title, duration/puzzles/distance/map, overview/read more, free/play.
- 6748: testing invitation/start location/solo mode/testers=1/start testing/feedback expectations.
- 6749/50: why beta, photos from players (trạng thái chưa có ảnh được công khai), gallery.
- 6751: what you'll do: timeline checkpoint và trải nghiệm.
- 6752: reviews + empty/review form (chỉ sau hoàn thành), logistics start/end/time/language.
- 6753: preparation tips, creator card.
- 6754: creator passport, share, name/handle/bio/read more/location/joined, followers/following/follow, lifetime stats, trophy shelf.
- 6755/56: created quests, create-your-own CTA, moments, visited cities, badges.

Dữ liệu: creator hiển thị hồ sơ dự án Dana Quest, chưa có hồ sơ tác giả cá nhân được công bố; không mạo danh Questo/DUE. Không giả rank/XP/km/joined/visited/badges hoặc đánh giá. Chưa có ảnh công khai: giữ section và hướng dẫn; không công khai album riêng. Chưa có công cụ xuất bản quest: CTA đưa tới gửi đề xuất cho dự án, nói rõ chưa tự xuất bản. Mời bạn là chia sẻ link, không bật multiplayer; số người chơi cố định một theo luật cũ. Khoảng cách chưa đo được sẽ ghi chưa có dữ liệu thay vì bịa 2 km. Map có điểm bắt đầu và danh sách dừng, giữ fallback khi tile ngoài không tải được.

Kế hoạch: test social/reviews trước; lưu favorite/follow và đánh giá theo tài khoản trên Node; public chỉ trả nội dung đồng ý công khai. Sau đó giao diện detail, creator, liên kết route và giữ luồng bắt đầu. Kiểm tra mobile/desktop, modal đăng nhập, like/follow/review gates, bản đồ và hồi quy.


Mở rộng theo yêu cầu: áp dụng cùng giao diện cho toàn bộ địa điểm đang có, không chỉ DUE. QuestPresentation chỉ là mô hình trình bày, không dùng để tính thưởng hoặc thay bộ luật. Các địa điểm giữ getMissions, route chỉ đường/nhiệm vụ, luật 80%, nội dung và gallery quản trị, giờ/ghi chú giờ, địa chỉ và nguồn ảnh. Danh sách nhà sáng tạo gồm cả quest cốt truyện và địa điểm. Đánh giá địa điểm kiểm tra tiến độ game thật ở máy chủ, không chấp nhận đánh dấu hoàn thành từ client. Giá miễn phí là giá chơi, không hứa miễn vé địa điểm.


## Chuyển đổi gameplay và thư viện theo yêu cầu tiếp theo

Tất cả 15 địa điểm chủ động chuyển sang quest cốt truyện hai thử thách, dùng cùng chỉ đường/xác nhận đến/màn chơi của DUE. Mẫu DUE được mở rộng thành năm dạng: nhập văn bản, chọn một đáp án, sắp xếp thứ tự, ghép cặp, chọn nhiều đáp án. Hai checkpoint cũ và thưởng 50/70 XP, 10 xu mỗi checkpoint không đổi; ba checkpoint mới có thưởng riêng. Các câu logic mốc năm là bài tập dựa trên năm gốc, không khẳng định có lễ kỷ niệm thật ở các năm được nêu. Tham khảo nguyên tắc khám phá/giải đố ngoài trời tại https://questoapp.com/quests ; các câu hỏi và dạng tương tác bổ sung do Dana Quest thiết kế, không tuyên bố đây là nguyên bản câu đố của Questo.

Bản lưu DUE đã hoàn thành hai thử thách được nâng cấp bằng giữ nguyên checkpoint/thời điểm/thưởng cũ, lưu previousCompletionAt và tiếp tục từ thử thách thứ ba. Dấu hoàn thành bản cũ vẫn giữ. Catalog version của DUE hiện là 2; những quest khác là 1. Không xóa tiến độ, ảnh, xu hay voucher cũ trong quá trình nâng cấp gameplay. Backend Django không sửa.

Thư viện chỉ hiển thị ảnh bìa quest (dùng cùng nguồn với màn chơi/chi tiết), trạng thái tiến độ và ghi chú đây là ảnh đại diện. Ảnh cũ không xuất hiện trong thư viện. Người dùng đã xác nhận muốn xóa vĩnh viễn ảnh cũ của tài khoản mình; hiện tab thực tế là khách nên đang chờ tên đăng nhập để định danh đúng chủ sở hữu. Không xóa ảnh của các tài khoản khác. Có chức năng clear-photos kiểm tra phiên, owner, revision và cụm xác nhận; giữ nguyên tiến độ/xu.


Kiểm chứng chuyển đổi: 191 test/52 tệp đã qua, gồm dữ liệu hai thử thách cho mỗi địa điểm, năm dạng DUE, máy chủ giữ tiến độ bản cũ, chống thưởng lặp, riêng tư/xóa ảnh theo owner và quy đổi xu lịch sử. Chrome đang kiểm thử toàn bộ 16 quest trên bốn kích thước; ba kích thước đầu đã hoàn thành tại thời điểm ghi mục này. Ảnh thực tế của người dùng chưa bị xóa do chưa định danh được tài khoản.


Kiểm chứng cuối: 193/193 test trong 53 tệp. Build thành công, không còn cảnh báo chunk vượt 500kB; lint chỉ còn cảnh báo Fast Refresh có sẵn tại AuthContext. Chrome đã chơi hoàn chỉnh cả 16 quest ở 320x568, 390x844, 844x390 và 1440x900 (64 lượt quest), gồm đủ năm giao diện DUE; thư viện, khôi phục sau tải lại và xóa ảnh theo tài khoản thử đều qua. Backend Django không có thay đổi. Không push GitHub. Ảnh của tài khoản thật chưa xóa vì người dùng chưa cung cấp tên đăng nhập, tab kiểm tra hiện là khách.
