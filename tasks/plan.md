# Kế Hoạch Triển Khai: Board Game Splendor — Web & Điện Thoại

## Tổng Quan

Xây dựng board game **Splendor** hoàn chỉnh trên nền web, tối ưu cho cả trình duyệt desktop và điện thoại (xoay ngang màn hình). Ứng dụng hỗ trợ **2–4 người chơi** với ba chế độ: **chơi online** (Socket.IO + mã phòng), **chơi local** (chuyền tay trên cùng thiết bị), và **chơi với AI** (Dễ/Trung bình/Khó). Giao diện hoàn toàn **tiếng Việt**, phong cách **bàn cờ cổ điển** — nền gỗ ấm, gem lấp lánh, font chữ vintage.

**Đăng nhập bằng Google** để lưu thống kê, xem lịch sử trận đấu, và kết nối với bạn bè.

---

## Quyết Định Kiến Trúc

| Quyết định | Lựa chọn | Lý do |
|------------|----------|-------|
| **Frontend** | HTML/CSS/JS thuần (single page) | Nhẹ, không cần build, tải nhanh trên điện thoại |
| **Multiplayer** | Socket.IO (Node.js server) | Realtime tốt nhất, hỗ trợ room/reconnect, deploy miễn phí |
| **Cấu trúc dự án** | Monorepo — `client/` + `server/` | Đơn giản, dùng chung logic game ở `shared/` |
| **Xác thực** | Firebase Auth (Google Sign-In) | Miễn phí, dễ tích hợp, hỗ trợ nhiều nền tảng |
| **Quản lý game state** | Server kiểm soát (online) / Client (local/AI) | Chống gian lận online; local không cần server |
| **Điện thoại** | CSS landscape + responsive scaling | Phù hợp bàn cờ; hiển thị xoay ngang |
| **Phong cách UI** | Bàn cờ cổ điển — nền gỗ, tông ấm, cảm giác thật | Theo yêu cầu của anh; vintage như bàn cờ thật |
| **AI Bot** | Heuristic 3 cấp độ | Dễ: ngẫu nhiên; TB: tính điểm; Khó: nhìn xa |
| **Ngôn ngữ** | Tiếng Việt toàn bộ | Giao diện, thông báo, luật chơi đều tiếng Việt |
| **Deploy** | Client: GitHub Pages / Server: Render | Miễn phí, CI/CD đơn giản |

---

## Tóm Tắt Luật Chơi Splendor

### Thành phần
- **Đá quý (Token)**: Mỗi loại 7 viên × 5 màu (Kim cương💎, Sapphire🔵, Ngọc lục bảo🟢, Ruby🔴, Mã não⚫) + 5 Vàng (đại diện) = **40 token**
- **Thẻ phát triển**: 90 thẻ chia 3 cấp (I/II/III) — mỗi thẻ có chi phí, cho 1 bonus đá quý vĩnh viễn, một số cho điểm uy tín
- **Quý tộc**: 10 ô (mở ra `số người chơi + 1`) — mỗi quý tộc cho **3 điểm uy tín**, tự động đến khi đủ điều kiện

### Thiết lập theo số người chơi
| Số người | Token mỗi màu | Quý tộc |
|----------|---------------|---------|
| 2        | 4             | 3       |
| 3        | 5             | 4       |
| 4        | 7             | 5       |

### Hành động mỗi lượt (chọn đúng 1)
1. **Lấy 3 đá quý khác màu** từ nguồn cung
2. **Lấy 2 đá quý cùng màu** (chỉ khi nguồn còn ≥4 viên màu đó)
3. **Giữ chỗ 1 thẻ** + nhận 1 vàng (tối đa giữ 3 thẻ)
4. **Mua 1 thẻ** (từ bàn hoặc thẻ đã giữ) — trả bằng token + bonus; vàng = đại diện bất kỳ

### Điều kiện thắng
- Người chơi đầu tiên đạt **15 điểm uy tín** → kích hoạt vòng cuối
- Hoàn thành vòng để mọi người có số lượt bằng nhau
- Nhiều điểm nhất thắng (hòa: ít thẻ đã mua hơn thắng)

### Giới hạn token
- Tối đa **10 token** trong tay; phải trả lại phần thừa sau khi lấy

### Quý tộc ghé thăm
- Tự động cuối lượt nếu bonus đá quý đủ yêu cầu của quý tộc
- Không thể từ chối; chỉ 1 quý tộc mỗi lượt

---

## Cấu Trúc Thư Mục

```
splendor/
├── client/                         # Frontend (file tĩnh)
│   ├── index.html                  # Trang chính
│   ├── css/
│   │   ├── index.css               # Hệ thống thiết kế & biến CSS
│   │   ├── board.css               # Bố cục bàn chơi
│   │   ├── cards.css               # Kiểu thẻ bài & quý tộc
│   │   ├── tokens.css              # Kiểu đá quý
│   │   ├── auth.css                # Kiểu trang đăng nhập
│   │   ├── responsive.css          # Responsive điện thoại ngang
│   │   └── animations.css          # Hiệu ứng chuyển động
│   ├── js/
│   │   ├── app.js                  # Khởi tạo ứng dụng, điều hướng
│   │   ├── auth/
│   │   │   └── AuthManager.js      # Đăng nhập Google (Firebase Auth)
│   │   ├── game/
│   │   │   ├── GameEngine.js       # Logic game chính
│   │   │   ├── GameState.js        # Quản lý trạng thái
│   │   │   ├── CardData.js         # Dữ liệu 90 thẻ + 10 quý tộc
│   │   │   ├── Validator.js        # Kiểm tra hành động hợp lệ
│   │   │   └── AIPlayer.js         # AI bot (Dễ/TB/Khó)
│   │   ├── ui/
│   │   │   ├── BoardRenderer.js    # Vẽ bàn chơi
│   │   │   ├── CardRenderer.js     # Vẽ thẻ bài
│   │   │   ├── TokenRenderer.js    # Vẽ đá quý + tương tác
│   │   │   ├── PlayerPanel.js      # Bảng thông tin người chơi
│   │   │   ├── NobleRenderer.js    # Vẽ ô quý tộc
│   │   │   └── AnimationManager.js # Điều phối hiệu ứng
│   │   ├── screens/
│   │   │   ├── LoginScreen.js      # Màn hình đăng nhập
│   │   │   ├── HomeScreen.js       # Menu chính
│   │   │   ├── LobbyScreen.js      # Phòng chờ online
│   │   │   ├── GameScreen.js       # Màn hình chơi game
│   │   │   └── ResultScreen.js     # Kết quả trận đấu
│   │   ├── network/
│   │   │   └── SocketClient.js     # Socket.IO client
│   │   └── utils/
│   │       ├── SoundManager.js     # Quản lý âm thanh
│   │       ├── i18n.js             # Văn bản tiếng Việt
│   │       └── helpers.js          # Hàm tiện ích
│   └── assets/
│       ├── images/                 # Hình nền, texture gỗ
│       ├── icons/                  # Icon đá quý, UI
│       └── sounds/                 # Âm thanh click, đặt, thắng
│
├── server/                         # Backend (Node.js + Socket.IO)
│   ├── package.json
│   ├── index.js                    # Điểm vào server
│   ├── auth.js                     # Xác minh Firebase token
│   ├── GameRoom.js                 # Quản lý phòng (tạo/vào/rời)
│   ├── GameEngine.js               # Logic game phía server
│   ├── Validator.js                # Kiểm tra hành động phía server
│   └── CardData.js                 # Dữ liệu thẻ/quý tộc
│
└── shared/                         # Hằng số dùng chung
    └── constants.js                # Màu đá quý, giới hạn, v.v.
```

---

## Danh Sách Công Việc

---

### Giai Đoạn 1: Nền Tảng — Khởi Tạo Dự Án & Hệ Thống Thiết Kế

#### Công việc 1: Khởi tạo dự án & cài đặt dev
**Quy mô:** S (1-2 file)

**Mô tả:** Khởi tạo cấu trúc monorepo với npm project cho server, tạo toàn bộ thư mục, cài Express + Socket.IO server với health check cơ bản, phục vụ client như file tĩnh.

**Tiêu chí hoàn thành:**
- [ ] `npm start` trong server/ khởi chạy server tại localhost:3000
- [ ] Client index.html được phục vụ ở trang chủ
- [ ] Kết nối Socket.IO handshake thành công (log trong console)
- [ ] File constants dùng chung import được từ cả client và server

**Kiểm tra:**
- [ ] `curl http://localhost:3000` trả về HTML
- [ ] Console trình duyệt hiện "Đã kết nối Socket"

**Phụ thuộc:** Không có

**File liên quan:**
- `server/package.json`, `server/index.js`
- `client/index.html`
- `shared/constants.js`

---

#### Công việc 2: Hệ thống thiết kế — biến CSS & kiểu cơ bản
**Quy mô:** S (1 file)

**Mô tả:** Xây dựng hệ thống thiết kế hoàn chỉnh với CSS custom properties: bảng màu gỗ ấm, màu đá quý với sắc thái riêng biệt, điểm nhấn vàng, typography vintage (Google Fonts — serif cho tiêu đề, sans cho nội dung), reset cơ bản, nền vân gỗ.

**Tiêu chí hoàn thành:**
- [ ] Tất cả màu đá quý được định nghĩa với sắc thái đậm, rõ ràng
- [ ] Nền vân gỗ hiển thị trên body
- [ ] Typography tải từ Google Fonts (hỗ trợ tiếng Việt có dấu)
- [ ] Design tokens bao gồm: màu sắc, khoảng cách, bo góc, đổ bóng, cỡ chữ

**Kiểm tra:**
- [ ] Kiểm tra trực quan — trang có cảm giác ấm, vintage như bàn cờ
- [ ] Không có kiểu mặc định trình duyệt lọt qua
- [ ] Tiếng Việt có dấu hiển thị đẹp

**Phụ thuộc:** Công việc 1

**File liên quan:**
- `client/css/index.css`
- `client/index.html` (link font)

---

#### Công việc 3: Bố cục responsive — điện thoại ngang
**Quy mô:** S (1 file)

**Mô tả:** CSS media queries cho điện thoại/tablet ngang, hiển thị lời nhắc xoay ngang khi ở chế độ dọc, co giãn viewport cho các kích thước màn hình từ 640px đến 1920px+.

**Tiêu chí hoàn thành:**
- [ ] Bàn chơi co giãn đúng trên điện thoại ngang (Chrome DevTools — iPhone, Pixel)
- [ ] Chế độ dọc hiển thị overlay "Xoay ngang thiết bị để chơi"
- [ ] Bố cục desktop dùng bàn chơi căn giữa với khoảng cách thoải mái
- [ ] Không cuộn ngang trên bất kỳ thiết bị nào

**Kiểm tra:**
- [ ] Test với Chrome DevTools device mode: iPhone 14, Pixel 7, iPad ngang
- [ ] Test xoay trên điện thoại thật nếu có

**Phụ thuộc:** Công việc 2

**File liên quan:**
- `client/css/responsive.css`
- `client/index.html` (thẻ meta viewport)

---

### ✅ Mốc kiểm tra: Nền tảng
- [ ] Server chạy, client tải với trang đã styled
- [ ] Bố cục responsive hoạt động trên trình giả lập điện thoại ngang
- [ ] Hệ thống thiết kế đã thiết lập — tất cả UI sau này dùng các biến này

---

### Giai Đoạn 2: Xác Thực — Đăng Nhập Google

#### Công việc 4: Tích hợp Firebase Auth — Đăng nhập Google
**Quy mô:** M (3-4 file)

**Mô tả:** Thiết lập Firebase project, tích hợp Firebase Auth với Google Sign-In. Màn hình đăng nhập với nút "Đăng nhập bằng Google" phong cách vintage. Sau đăng nhập, lưu thông tin user (tên, avatar, email) vào session. Gửi Firebase ID token lên server để xác minh.

**Tiêu chí hoàn thành:**
- [ ] Nút "Đăng nhập bằng Google" hoạt động (popup hoặc redirect)
- [ ] Sau đăng nhập, hiển thị avatar + tên người dùng
- [ ] Phiên đăng nhập duy trì khi tải lại trang (persistent auth state)
- [ ] Nút "Đăng xuất" hoạt động
- [ ] Server xác minh được Firebase ID token
- [ ] Chuyển hướng về màn hình đăng nhập nếu chưa đăng nhập

**Kiểm tra:**
- [ ] Đăng nhập Google → thấy tên + avatar → tải lại trang → vẫn đăng nhập
- [ ] Đăng xuất → quay về màn hình đăng nhập
- [ ] Gửi token giả lên server → bị từ chối

**Phụ thuộc:** Công việc 1

**File liên quan:**
- `client/js/auth/AuthManager.js`
- `client/js/screens/LoginScreen.js`
- `client/css/auth.css`
- `server/auth.js`

---

#### Công việc 5: Hồ sơ người chơi & thống kê
**Quy mô:** S (1-2 file)

**Mô tả:** Sau đăng nhập, hiển thị hồ sơ người chơi: avatar Google, tên hiển thị, số trận đã chơi, số trận thắng, tỷ lệ thắng. Lưu thống kê vào localStorage (hoặc Firestore nếu muốn đồng bộ). Hiển thị trên menu chính.

**Tiêu chí hoàn thành:**
- [ ] Hồ sơ hiển thị avatar, tên, thống kê cơ bản
- [ ] Thống kê cập nhật sau mỗi trận
- [ ] Dữ liệu lưu trữ và khôi phục khi đăng nhập lại

**Kiểm tra:**
- [ ] Chơi 1 trận → thống kê cập nhật → tải lại → thống kê vẫn còn

**Phụ thuộc:** Công việc 4

**File liên quan:**
- `client/js/screens/HomeScreen.js`
- `client/js/utils/helpers.js`

---

### ✅ Mốc kiểm tra: Xác thực
- [ ] Đăng nhập Google hoạt động trơn tru
- [ ] Server xác minh token thành công
- [ ] Thống kê người chơi hiển thị đúng

---

### Giai Đoạn 3: Dữ Liệu & Logic Game

#### Công việc 6: Mã hóa dữ liệu thẻ bài & quý tộc
**Quy mô:** M (2-3 file)

**Mô tả:** Mã hóa toàn bộ 90 thẻ phát triển qua 3 cấp và 10 ô quý tộc thành dữ liệu JavaScript có cấu trúc. Mỗi thẻ có: cấp, chi phí (số lượng đá quý), màu bonus, điểm uy tín. Mỗi quý tộc có: yêu cầu (bonus đá quý cần), điểm uy tín (luôn là 3).

**Tiêu chí hoàn thành:**
- [ ] Đủ 90 thẻ với dữ liệu chính xác theo game gốc
- [ ] Đủ 10 quý tộc với yêu cầu chính xác
- [ ] Dữ liệu đối chiếu ít nhất 2 nguồn chính thức
- [ ] Không trùng thẻ, phân bố đúng (40 Cấp I, 30 Cấp II, 20 Cấp III)

**Kiểm tra:**
- [ ] Đếm tự động: 40 + 30 + 20 = 90 thẻ
- [ ] Kiểm tra ngẫu nhiên 10 thẻ so với danh sách chính thức

**Phụ thuộc:** Công việc 1

**File liên quan:**
- `client/js/game/CardData.js`
- `server/CardData.js`

---

#### Công việc 7: Mô hình trạng thái game
**Quy mô:** S (1-2 file)

**Mô tả:** Định nghĩa class GameState chứa toàn bộ trạng thái: mảng người chơi (token, bonus, thẻ giữ, thẻ đã mua, quý tộc), nguồn cung token, lưới thẻ (3 cấp × 4 thẻ hiện + bộ bài), quý tộc hiện, người chơi hiện tại, giai đoạn game, lịch sử lượt.

**Tiêu chí hoàn thành:**
- [ ] Tạo được trạng thái game cho 2, 3, hoặc 4 người chơi đúng luật
- [ ] Nguồn cung token đúng theo số người (2p=4, 3p=5, 4p=7 mỗi màu, luôn 5 vàng)
- [ ] Số quý tộc đúng luật (số người chơi + 1)
- [ ] Trạng thái có thể serialize sang JSON và deserialize lại
- [ ] Lưới thẻ hiện 4 thẻ mỗi cấp từ bộ bài đã xáo

**Kiểm tra:**
- [ ] Test tạo trạng thái cho từng số người chơi, xác minh số lượng
- [ ] Test JSON round-trip: serialize → deserialize → so sánh

**Phụ thuộc:** Công việc 6

**File liên quan:**
- `client/js/game/GameState.js`
- `shared/constants.js`

---

#### Công việc 8: Logic game — các hành động chính (chia thành nhiều phần nhỏ)
**Quy mô:** L → 7 phần nhỏ (mỗi phần S)

**Mô tả:** Xây dựng engine game Splendor hoàn chỉnh với đủ 4 hành động, quý tộc ghé thăm, giới hạn token, và điều kiện thắng.

##### Công việc 8a: Lấy 3 đá quý khác màu
- [ ] Người chơi chọn tối đa 3 đá quý khác màu
- [ ] Kiểm tra: tất cả khác màu, màu đó còn token
- [ ] Trừ từ nguồn cung, cộng cho người chơi
- [ ] Nếu nguồn còn ít hơn 3 màu, cho phép lấy ít hơn

##### Công việc 8b: Lấy 2 đá quý cùng màu
- [ ] Người chơi chọn 1 màu để lấy 2
- [ ] Kiểm tra: màu đó có ≥4 token trong nguồn
- [ ] Trừ 2 từ nguồn, cộng 2 cho người chơi

##### Công việc 8c: Giữ chỗ thẻ
- [ ] Người chơi chọn thẻ hiện trên bàn hoặc đầu bộ bài (giữ mù)
- [ ] Thẻ chuyển vào tay giữ chỗ (tối đa 3)
- [ ] Người chơi nhận 1 token vàng (nếu còn)
- [ ] Ô trống được lấp từ bộ bài

##### Công việc 8d: Mua thẻ
- [ ] Người chơi chọn thẻ hiện trên bàn hoặc thẻ đã giữ
- [ ] Tính chi phí thực: chi phí thẻ − bonus đá quý của người chơi
- [ ] Trả bằng token (token đá quý trước, rồi vàng thay thế)
- [ ] Thẻ thêm vào danh sách đã mua (bonus vĩnh viễn + điểm uy tín)
- [ ] Ô trống được lấp từ bộ bài

##### Công việc 8e: Kiểm tra quý tộc ghé thăm
- [ ] Sau mỗi lượt, kiểm tra tất cả quý tộc hiện
- [ ] Nếu bonus đá quý người chơi đạt/vượt yêu cầu quý tộc → tự động nhận
- [ ] Quý tộc cho 3 điểm uy tín
- [ ] Chỉ 1 quý tộc mỗi lượt (nếu nhiều quý tộc đủ, người chơi chọn)

##### Công việc 8f: Kiểm soát giới hạn token
- [ ] Sau khi lấy token, kiểm tra người chơi có > 10 không
- [ ] Nếu vượt giới hạn, người chơi phải trả lại token đến khi còn 10
- [ ] Gợi ý UI cho việc trả token nào

##### Công việc 8g: Điều kiện thắng & kết thúc game
- [ ] Sau mỗi lượt, kiểm tra có người chơi nào ≥15 điểm uy tín không
- [ ] Nếu có, đánh dấu "vòng cuối" — tiếp tục đến khi tất cả có số lượt bằng nhau
- [ ] Khi vòng cuối kết thúc, xác định người thắng (nhiều điểm nhất; hòa: ít thẻ hơn thắng)

**Tiêu chí hoàn thành:**
- [ ] Đủ 4 hành động thực thi chính xác với kiểm tra hợp lệ
- [ ] Quý tộc ghé thăm tự động đúng
- [ ] Giới hạn token được thực thi
- [ ] Game kết thúc đúng tại 15+ điểm với tiebreak chính xác

**Kiểm tra:**
- [ ] Mô phỏng console: chơi hết 1 trận dùng các phương thức engine
- [ ] Test trường hợp biên: bộ bài hết, hết token, nhiều quý tộc đủ điều kiện cùng lúc

**Phụ thuộc:** Công việc 7

**File liên quan:**
- `client/js/game/GameEngine.js`
- `client/js/game/Validator.js`

---

### ✅ Mốc kiểm tra: Logic Game
- [ ] Có thể mô phỏng trận đầy đủ trong console với đúng luật
- [ ] Giới hạn token, quý tộc, điều kiện thắng đều chính xác
- [ ] Không có lỗi phá game trong logic cốt lõi

---

### Giai Đoạn 4: Giao Diện — Bàn Chơi & Thành Phần

#### Công việc 9: Màn hình chính & điều hướng
**Quy mô:** M (3-4 file)

**Mô tả:** Menu chính hiển thị sau đăng nhập: "Chơi Online", "Chơi Cùng Bạn Bè" (local), "Chơi Với Máy", "Cách Chơi". Hệ thống điều hướng hash-based. Nền động với hạt đá quý trôi. Branding vintage phong cách bàn cờ. Hiển thị avatar + tên người chơi ở góc. Tất cả text bằng tiếng Việt.

**Tiêu chí hoàn thành:**
- [ ] 4 nút menu hiển thị và điều hướng đúng
- [ ] Điều hướng hash hoạt động (đổi hash → đúng màn hình)
- [ ] Hiệu ứng nền chạy mượt
- [ ] Giao diện premium, vintage, hấp dẫn
- [ ] Avatar + tên Google ở góc trên phải
- [ ] Tất cả text tiếng Việt

**Kiểm tra:**
- [ ] Bấm từng nút → đúng màn hình tải
- [ ] Nút back/forward trình duyệt hoạt động với hash routing
- [ ] Kiểm tra trực quan trên điện thoại ngang

**Phụ thuộc:** Công việc 2, 3, 4

**File liên quan:**
- `client/js/app.js`
- `client/js/screens/HomeScreen.js`
- `client/js/utils/i18n.js`

---

#### Công việc 10: Vẽ đá quý & tương tác
**Quy mô:** M (2-3 file)

**Mô tả:** Vẽ 6 loại token với số lượng. Token có thiết kế 3D-ish giống miếng gỗ/kim loại thật. Nhấn để chọn/bỏ chọn khi lấy đá quý. Phản hồi trực quan: phát sáng, nảy khi chọn, cập nhật số lượng. UI trả token khi vượt giới hạn 10.

**Tiêu chí hoàn thành:**
- [ ] Đủ 6 loại token với màu riêng biệt và icon đá quý
- [ ] Số lượng hiện tại hiển thị trên mỗi chồng token
- [ ] Nhấn chọn/bỏ chọn token (tối đa 3 khác màu, hoặc 2 cùng màu)
- [ ] Token được chọn phát sáng/highlight
- [ ] Nút "Xác nhận" sau khi chọn
- [ ] UI trả token xuất hiện khi vượt giới hạn 10

**Kiểm tra:**
- [ ] Kiểm tra trực quan: token trông thật và rõ ràng
- [ ] Test tương tác: chọn 3 khác → xác nhận → số lượng cập nhật
- [ ] Test tương tác: chọn 2 cùng (khi nguồn ≥4) → xác nhận

**Phụ thuộc:** Công việc 8

**File liên quan:**
- `client/js/ui/TokenRenderer.js`
- `client/css/tokens.css`

---

#### Công việc 11: Vẽ thẻ bài & quy trình mua
**Quy mô:** M (2-3 file)

**Mô tả:** Vẽ thẻ phát triển trong lưới 3 cấp (4 thẻ hiện mỗi cấp). Thẻ hiển thị: chi phí đá quý, bonus đá quý, điểm uy tín, chỉ báo cấp. Nhấn/chạm hiện chi tiết phóng to. Thẻ mua được highlight. Quy trình mua: chọn → xác nhận → hiệu ứng → thẻ chuyển cho người chơi. Khu vực thẻ đã giữ chỗ.

**Tiêu chí hoàn thành:**
- [ ] Tất cả thẻ hiện vẽ đúng dữ liệu
- [ ] Phân biệt trực quan theo cấp (viền/nền khác nhau mỗi cấp)
- [ ] Thẻ đọc được trên điện thoại (chi phí, bonus, điểm)
- [ ] Thẻ mua được có chỉ báo trực quan (phát sáng/viền)
- [ ] Nhấn → phóng to → nút mua/giữ chỗ
- [ ] Sau khi mua, thẻ mới được chia từ bộ bài với hiệu ứng lật

**Kiểm tra:**
- [ ] Mua thẻ → xác minh chi phí trừ đúng, bonus thêm, thẻ mới xuất hiện
- [ ] Giữ chỗ thẻ → xác minh nằm trong khu vực giữ, nhận token vàng
- [ ] Test điện thoại: thẻ đọc được và nhấn được

**Phụ thuộc:** Công việc 8

**File liên quan:**
- `client/js/ui/CardRenderer.js`
- `client/css/cards.css`

---

#### Công việc 12: Vẽ ô quý tộc
**Quy mô:** S (1-2 file)

**Mô tả:** Vẽ ô quý tộc với icon yêu cầu và giá trị uy tín. Hiển thị tiến độ khi người chơi sắp đủ điều kiện (ví dụ: "3/4 ngọc lục bảo"). Hiệu ứng khi nhận được quý tộc.

**Tiêu chí hoàn thành:**
- [ ] Quý tộc hiển thị với icon yêu cầu đá quý và nhãn "3 điểm"
- [ ] Chỉ báo tiến độ cho thấy người chơi hiện tại gần đạt đến đâu
- [ ] Quý tộc trượt đến người chơi với hiệu ứng khi nhận được
- [ ] Đúng số quý tộc theo số người chơi

**Kiểm tra:**
- [ ] Đạt quý tộc → hiệu ứng chạy → quý tộc xuất hiện trong bảng người chơi
- [ ] Kiểm tra trực quan trên điện thoại

**Phụ thuộc:** Công việc 8

**File liên quan:**
- `client/js/ui/NobleRenderer.js`
- `client/css/cards.css`

---

#### Công việc 13: Bảng thông tin người chơi
**Quy mô:** M (2-3 file)

**Mô tả:** Hiển thị thông tin người chơi: tên Google, avatar, điểm uy tín, số bonus đá quý, số token, số thẻ giữ chỗ (úp mặt cho đối thủ). Highlight lượt người chơi hiện tại bằng viền phát sáng. Bố cục gọn cho 4 người trên điện thoại ngang.

**Tiêu chí hoàn thành:**
- [ ] Tất cả thông tin người chơi hiển thị chính xác
- [ ] Người chơi hiện tại được highlight rõ ràng
- [ ] Thẻ giữ chỗ đối thủ chỉ hiện số lượng (không lộ nội dung)
- [ ] Đủ gọn cho 4 người trên điện thoại ngang
- [ ] Điểm uy tín nổi bật
- [ ] Avatar Google hiển thị đúng

**Kiểm tra:**
- [ ] Game 4 người trên điện thoại — tất cả bảng vừa và đọc được
- [ ] Mua thẻ → bảng cập nhật (bonus, điểm)

**Phụ thuộc:** Công việc 8

**File liên quan:**
- `client/js/ui/PlayerPanel.js`
- `client/css/board.css`

---

#### Công việc 14: Ghép bàn chơi hoàn chỉnh
**Quy mô:** M (3-4 file)

**Mô tả:** Ghép tất cả thành phần UI thành bàn chơi hoàn chỉnh. Bố cục: quý tộc (trên), lưới thẻ 3×4 (giữa), nguồn đá quý (bên phải), bảng người chơi (dưới cho người hiện tại, bên cạnh cho người khác). Điện thoại ngang: bố cục grid tối ưu. Desktop: bàn chơi căn giữa rộng rãi.

**Tiêu chí hoàn thành:**
- [ ] Tất cả thành phần (quý tộc, thẻ, token, người chơi) hiện trên 1 màn hình
- [ ] Không chồng chéo phần tử
- [ ] Điện thoại ngang: truy cập được hết mà không cần cuộn quá nhiều
- [ ] Desktop: bố cục thanh lịch căn giữa
- [ ] Phân cấp trực quan rõ: trung tâm bàn chơi là điểm chú ý

**Kiểm tra:**
- [ ] So sánh ảnh chụp: bố cục desktop và điện thoại
- [ ] Chơi thử: hoàn thành 1 lượt không bị rối UI

**Phụ thuộc:** Công việc 9-13

**File liên quan:**
- `client/js/ui/BoardRenderer.js`
- `client/js/screens/GameScreen.js`
- `client/css/board.css`

---

### ✅ Mốc kiểm tra: Giao diện hoàn thành
- [ ] Bàn chơi đầy đủ với mọi thành phần
- [ ] Nhìn và cảm giác như board game cổ điển cao cấp
- [ ] Responsive trên desktop và điện thoại ngang
- [ ] Tất cả phần tử UI tương tác và liên kết đúng với engine
- [ ] Toàn bộ text tiếng Việt

---

### Giai Đoạn 5: Chế Độ Chơi — Local & AI

#### Công việc 15: Chế độ chuyền tay (local pass-and-play)
**Quy mô:** M (2-3 file)

**Mô tả:** Màn hình thiết lập: chọn 2/3/4 người chơi, nhập tên (hoặc dùng tên Google). Quản lý lượt: hiển thị lượt ai kèm overlay, màn hình "che tay" giữa các lượt (tùy chọn). Tất cả hành động kết nối UI qua GameEngine. Hiệu ứng chuyển lượt.

**Tiêu chí hoàn thành:**
- [ ] Màn hình thiết lập cho phép chọn số người và nhập tên
- [ ] Chỉ báo lượt hiển thị rõ ràng lượt ai
- [ ] Đủ 4 hành động hoạt động qua UI (lấy đá quý, giữ chỗ, mua)
- [ ] Quý tộc ghé thăm tự động
- [ ] Nhắc trả token khi vượt giới hạn hoạt động
- [ ] Game kết thúc đúng và hiện màn hình kết quả

**Kiểm tra:**
- [ ] Chơi hết 1 trận 2 người
- [ ] Chơi hết 1 trận 4 người — xác minh UI xử lý được tất cả người chơi

**Phụ thuộc:** Công việc 8, 14

**File liên quan:**
- `client/js/screens/GameScreen.js`
- `client/js/game/GameEngine.js`

---

#### Công việc 16: AI bot
**Quy mô:** L → 4 phần nhỏ

##### Công việc 16a: AI Dễ — hành động ngẫu nhiên hợp lệ
- [ ] Liệt kê tất cả hành động hợp lệ cho trạng thái hiện tại
- [ ] Chọn ngẫu nhiên 1 hành động
- [ ] Thực thi với độ trễ nhỏ (giả lập "suy nghĩ")

##### Công việc 16b: AI Trung bình — tính điểm có trọng số
- [ ] Chấm điểm mỗi hành động có thể dựa trên: điểm uy tín nhận được, tiến độ đến quý tộc, hiệu quả kinh tế đá quý
- [ ] Chọn hành động điểm cao nhất với chút ngẫu nhiên
- [ ] Ưu tiên: mua thẻ nhiều điểm > hướng đến quý tộc > lấy đá quý hiệu quả

##### Công việc 16c: AI Khó — chiến lược nhìn xa
- [ ] Đánh giá giá trị thẻ xét theo khả năng mua tương lai
- [ ] Theo dõi tiến độ đối thủ và thích ứng (chặn đá quý, đua quý tộc)
- [ ] Lên kế hoạch 2-3 lượt trước cho việc gom đá quý hướng đến thẻ mục tiêu
- [ ] Giữ chỗ thẻ giá trị cao mà đối thủ có thể muốn

##### Công việc 16d: Thiết lập chế độ chơi với AI
- [ ] Màn hình thiết lập: chọn số AI (1-3), độ khó mỗi AI
- [ ] Lượt AI tự động thực thi với độ trễ nhìn được
- [ ] Hành động AI hiển thị trực quan (đá quý nào lấy, thẻ nào mua)
- [ ] Tên AI tiếng Việt (ví dụ: "Máy Dễ", "Máy TB", "Máy Khó")

**Tiêu chí hoàn thành:**
- [ ] Cả 3 độ khó đều ra hành động hợp lệ mọi lúc
- [ ] AI Dễ dễ thắng, AI Khó thực sự thách thức
- [ ] Lượt AI hiển thị rõ ràng (hành động có hiệu ứng, không tức thì)
- [ ] AI tuân thủ mọi luật (giới hạn token, quý tộc, v.v.)

**Kiểm tra:**
- [ ] Chơi 3 trận vs AI Khó — AI phải thắng được vài trận
- [ ] Chơi 3 trận vs AI Dễ — người chơi thắng đa số
- [ ] Không crash hoặc hành động sai từ bất kỳ mức độ nào

**Phụ thuộc:** Công việc 15

**File liên quan:**
- `client/js/game/AIPlayer.js`
- `client/js/screens/GameScreen.js`

---

#### Công việc 17: Màn hình kết quả
**Quy mô:** S (1-2 file)

**Mô tả:** Kết quả trận: thông báo người thắng với vương miện/cúp, điểm cuối cùng tất cả người chơi, phân tích chi tiết (điểm từ thẻ vs quý tộc), thông tin tiebreak nếu có. Nút chơi lại / về menu. Hiệu ứng chiến thắng (confetti, mưa đá quý). Tất cả text tiếng Việt.

**Tiêu chí hoàn thành:**
- [ ] Người thắng hiển thị nổi bật với hiệu ứng
- [ ] Điểm tất cả người chơi xếp theo thứ hạng
- [ ] Phân tích điểm (thẻ + quý tộc) hiển thị
- [ ] Lý do tiebreak hiện nếu có
- [ ] "Chơi Lại" bắt đầu trận mới cùng thiết lập
- [ ] "Menu Chính" quay về trang chủ
- [ ] Cập nhật thống kê người chơi

**Kiểm tra:**
- [ ] Kích hoạt điều kiện thắng → màn hình kết quả xuất hiện
- [ ] Test tiebreak (cùng điểm, ít thẻ hơn thắng)

**Phụ thuộc:** Công việc 15

**File liên quan:**
- `client/js/screens/ResultScreen.js`

---

### ✅ Mốc kiểm tra: Chơi Offline hoàn thành
- [ ] Game chơi được đầy đủ ở chế độ chuyền tay
- [ ] AI thách thức phù hợp ở mỗi mức độ
- [ ] Kết thúc game xử lý đúng với kết quả chính xác
- [ ] Không thể vi phạm luật qua giao diện

---

### Giai Đoạn 6: Chơi Online — Multiplayer

#### Công việc 18: Logic game phía server
**Quy mô:** M (2-3 file)

**Mô tả:** Port GameEngine + Validator sang server. Server là nguồn tin cậy: nhận yêu cầu hành động, kiểm tra hợp lệ, áp dụng vào trạng thái, phát sóng trạng thái cập nhật cho tất cả client. Xác minh Firebase token trước khi xử lý hành động.

**Tiêu chí hoàn thành:**
- [ ] Server GameEngine xử lý đủ 4 loại hành động
- [ ] Server Validator bắt được mọi hành động sai
- [ ] Phát sóng trạng thái sau mỗi hành động
- [ ] Hành động bị từ chối gửi thông báo lỗi cho client yêu cầu
- [ ] Chỉ xử lý hành động từ người chơi đã xác thực

**Kiểm tra:**
- [ ] Gửi hành động hợp lệ qua socket → trạng thái cập nhật → nhận phát sóng
- [ ] Gửi hành động sai → phản hồi lỗi, trạng thái không đổi

**Phụ thuộc:** Công việc 8, 4 (Firebase Auth)

**File liên quan:**
- `server/GameEngine.js`
- `server/Validator.js`
- `server/index.js`

---

#### Công việc 19: Hệ thống phòng & mã phòng
**Quy mô:** M (2-3 file)

**Mô tả:** Quản lý phòng: tạo phòng (sinh mã 6 ký tự dễ đọc, ví dụ: "AB12CD"), vào phòng bằng mã, thiết lập phòng (số người chơi), luồng sẵn sàng/bắt đầu, xử lý mất kết nối (thời gian ân hạn 30 giây để kết nối lại, sau đó tự động bỏ lượt), dọn dẹp phòng trống.

**Tiêu chí hoàn thành:**
- [ ] Tạo phòng → nhận mã phòng duy nhất (6 ký tự, chữ + số)
- [ ] Vào phòng bằng mã → xuất hiện trong danh sách người chơi
- [ ] Tất cả sẵn sàng → chủ phòng có thể bắt đầu
- [ ] Mất kết nối → 30 giây ân hạn → nếu không kết nối lại, game tiếp tục (tự bỏ lượt)
- [ ] Kết nối lại → khôi phục trạng thái game
- [ ] Phòng trống dọn dẹp sau timeout
- [ ] Mã phòng dễ đọc, dễ nhập trên điện thoại

**Kiểm tra:**
- [ ] Tạo phòng tab 1, vào tab 2 bằng mã → cả hai thấy nhau
- [ ] Mất kết nối tab 2 → kết nối lại trong 30 giây → trạng thái giữ nguyên
- [ ] Thử vào phòng đầy → thông báo lỗi "Phòng đã đầy"

**Phụ thuộc:** Công việc 18

**File liên quan:**
- `server/GameRoom.js`
- `server/index.js`

---

#### Công việc 20: Socket client & đồng bộ trạng thái
**Quy mô:** M (1-2 file)

**Mô tả:** Wrapper Socket.IO phía client với tự động kết nối lại, xử lý sự kiện, cập nhật UI lạc quan với rollback nếu server từ chối, hiển thị độ trễ, chỉ báo trạng thái kết nối.

**Tiêu chí hoàn thành:**
- [ ] Hành động gửi lên server và phản hồi trong 200ms (mạng nội bộ)
- [ ] UI cập nhật lạc quan, rollback nếu server từ chối
- [ ] Tự kết nối lại khi mất mạng (có chỉ báo trực quan)
- [ ] Trạng thái game đồng bộ đúng sau khi kết nối lại
- [ ] Chỉ báo kết nối (chấm xanh/vàng/đỏ)
- [ ] Thông báo tiếng Việt ("Đang kết nối lại...", "Đã mất kết nối")

**Kiểm tra:**
- [ ] Chơi online → hành động cảm giác tức thì (cập nhật lạc quan)
- [ ] Giả lập mất kết nối → kết nối lại → trạng thái nhất quán
- [ ] Gửi hành động sai → UI rollback

**Phụ thuộc:** Công việc 19

**File liên quan:**
- `client/js/network/SocketClient.js`

---

#### Công việc 21: Giao diện phòng chờ online
**Quy mô:** M (2-3 file)

**Mô tả:** Tạo phòng → hiển thị mã phòng lớn, dễ sao chép, dễ chia sẻ. Vào phòng → ô nhập mã. Màn hình phòng chờ: hiện người chơi đã kết nối với avatar Google, nút sẵn sàng, chủ phòng bắt đầu game khi tất cả sẵn sàng. Tất cả text tiếng Việt.

**Tiêu chí hoàn thành:**
- [ ] Tạo phòng hiện mã lớn, có nút sao chép
- [ ] Ô nhập mã để vào phòng
- [ ] Phòng chờ hiện tất cả người chơi kèm trạng thái sẵn sàng (avatar Google + tên)
- [ ] Nút "Sẵn sàng" mỗi người chơi
- [ ] Chủ phòng thấy nút "Bắt Đầu" (bật khi tất cả sẵn sàng)
- [ ] Game bắt đầu và chuyển sang bàn chơi cho tất cả đồng thời
- [ ] Text: "Mã Phòng", "Sẵn Sàng", "Bắt Đầu", "Đang Chờ...", v.v.

**Kiểm tra:**
- [ ] Luồng đầy đủ: tạo → chia sẻ mã → vào → sẵn sàng → bắt đầu → bàn chơi xuất hiện cho tất cả
- [ ] Test với 2, 3, và 4 người chơi

**Phụ thuộc:** Công việc 20

**File liên quan:**
- `client/js/screens/LobbyScreen.js`

---

### ✅ Mốc kiểm tra: Online Multiplayer
- [ ] 2-4 người chơi có thể chơi online thời gian thực
- [ ] Tạo và vào phòng bằng mã hoạt động trơn tru
- [ ] Xử lý mất kết nối với thời gian ân hạn
- [ ] Không lệch trạng thái giữa các client
- [ ] Server ngăn gian lận / hành động sai
- [ ] Xác thực Google hoạt động xuyên suốt

---

### Giai Đoạn 7: Hoàn Thiện — Hiệu Ứng & Âm Thanh

#### Công việc 22: Hiệu ứng vi mô & chuyển cảnh
**Quy mô:** M (2-3 file)

**Mô tả:** Hiệu ứng lật thẻ khi chia, đá quý nảy/lăn khi lấy, quý tộc trượt đến người chơi, chuyển lượt mờ dần, bộ đếm điểm tăng dần, chuyển cảnh trượt/mờ, hiệu ứng nhỏ khi mua thẻ thành công.

**Tiêu chí hoàn thành:**
- [ ] Tất cả hiệu ứng mượt 60fps
- [ ] Hiệu ứng làm tăng trải nghiệm, không làm chậm game
- [ ] Có thể tắt trong cài đặt để tiết kiệm hiệu năng
- [ ] Lật thẻ khi chia, nảy đá quý khi lấy, trượt quý tộc khi nhận

**Kiểm tra:**
- [ ] Chrome DevTools Performance: không rớt khung hình khi chạy hiệu ứng
- [ ] Chơi 1 trận đầy đủ — hiệu ứng tự nhiên và thỏa mãn

**Phụ thuộc:** Công việc 14, 15

**File liên quan:**
- `client/css/animations.css`
- `client/js/ui/AnimationManager.js`

---

#### Công việc 23: Âm thanh
**Quy mô:** S (1-2 file)

**Mô tả:** Âm thanh đá quý click/đặt (gỗ), mua thẻ (giấy), quý tộc ghé thăm (kèn nhỏ), thông báo lượt (chuông), nhạc/âm thanh chiến thắng, nút click UI. Nút tắt/mở âm thanh. Audio context khởi tạo sau tương tác đầu tiên.

**Tiêu chí hoàn thành:**
- [ ] Âm thanh phát đúng thời điểm
- [ ] Nút tắt/mở hoạt động và lưu lại
- [ ] Không lỗi âm thanh hoặc chồng chéo
- [ ] Audio khởi tạo đúng (không lỗi autoplay)

**Kiểm tra:**
- [ ] Chơi với âm thanh bật → tất cả hiệu ứng kích hoạt đúng
- [ ] Tắt → không âm thanh → mở → âm thanh trở lại

**Phụ thuộc:** Công việc 15

**File liên quan:**
- `client/js/utils/SoundManager.js`
- `client/assets/sounds/`

---

#### Công việc 24: Màn hình "Cách Chơi" / hướng dẫn luật
**Quy mô:** S (1-2 file)

**Mô tả:** Tóm tắt luật trực quan kiểu carousel. Bao gồm: tổng quan game, các hành động lượt (có hình minh họa), đá quý, cấp thẻ, quý tộc, điều kiện thắng. Toàn bộ tiếng Việt. Ví dụ tương tác nếu khả thi.

**Tiêu chí hoàn thành:**
- [ ] Giải thích luật đầy đủ, người mới hiểu được
- [ ] Hình minh họa cho từng loại hành động
- [ ] Điều hướng carousel (trước/sau)
- [ ] Truy cập được từ menu chính và trong game (menu tạm dừng)
- [ ] Toàn bộ text tiếng Việt

**Kiểm tra:**
- [ ] Cho người chưa biết Splendor xem → họ hiểu luật

**Phụ thuộc:** Công việc 9

**File liên quan:**
- Màn hình mới hoặc phần trong `HomeScreen.js`

---

#### Công việc 25: Hoàn thiện cuối cùng & trường hợp biên
**Quy mô:** M (nhiều file)

**Mô tả:** Tiêu đề tab trình duyệt cập nhật (lượt ai, thông báo), PWA manifest cho cài đặt trên điện thoại, xử lý lỗi toàn diện, trạng thái loading/spinner, khả năng tiếp cận cơ bản (tương phản màu, focus states), localStorage cho cài đặt. Tất cả thông báo lỗi tiếng Việt.

**Tiêu chí hoàn thành:**
- [ ] Tiêu đề tab hiện "Lượt của bạn!" hoặc "Đang chờ..."
- [ ] PWA cài được trên điện thoại
- [ ] Không lỗi chưa xử lý — tất cả lỗi hiện cho user dễ hiểu (tiếng Việt)
- [ ] Loading spinner cho thao tác mạng
- [ ] Điều hướng bàn phím cho khả năng tiếp cận
- [ ] Cài đặt (âm thanh, hiệu ứng) lưu qua các phiên

**Kiểm tra:**
- [ ] Cài PWA trên điện thoại → hoạt động ở chế độ standalone
- [ ] Tiêu đề tab cập nhật đúng khi chơi online
- [ ] Cố tình gây lỗi → xử lý mượt mà

**Phụ thuộc:** Tất cả công việc trước

**File liên quan:**
- `client/index.html` (manifest, meta)
- Nhiều file JS cho xử lý lỗi
- `client/css/index.css` (focus states)

---

### ✅ Mốc kiểm tra: Hoàn thành
- [ ] Tất cả chế độ chơi hoạt động hoàn hảo (local, AI, online)
- [ ] Cảm giác cao cấp, mượt mà với hiệu ứng và âm thanh
- [ ] Trải nghiệm điện thoại ngang mượt
- [ ] Sẵn sàng deploy lên GitHub Pages + Render
- [ ] Toàn bộ giao diện tiếng Việt

---

## Rủi Ro & Biện Pháp

| Rủi ro | Mức ảnh hưởng | Biện pháp |
|--------|---------------|-----------|
| Dữ liệu thẻ sai | 🔴 Cao — mất cân bằng game | Đối chiếu 2+ nguồn chính thức; kiểm tra tự động đếm |
| Bố cục điện thoại phức tạp | 🔴 Cao — UX tệ trên điện thoại | Thiết kế mobile-first; test liên tục với DevTools |
| Độ trễ Socket.IO | 🟡 TB — lag khi chơi online | Cập nhật lạc quan + rollback; payload tối thiểu |
| Cân bằng AI | 🟡 TB — quá dễ/khó | Chơi thử mỗi mức; AI Khó dùng heuristic có trọng số |
| Lệch trạng thái multiplayer | 🔴 Cao — game hỏng | Server kiểm soát; đồng bộ toàn bộ trạng thái định kỳ |
| Chính sách audio trình duyệt | 🟢 Thấp — âm thanh không phát | Yêu cầu tương tác trước khi bật audio |
| Giới hạn server miễn phí | 🟡 TB — chậm/sập | Render free tier ngủ sau khi không dùng; hiện UI kết nối lại |
| Firebase Auth lỗi | 🟡 TB — không đăng nhập được | Fallback chơi local không cần đăng nhập; retry logic |

---

## Tổng Kết

| Giai đoạn | Số công việc | Ước lượng |
|-----------|-------------|-----------|
| 1. Nền tảng | 3 | Nhỏ |
| 2. Xác thực Google | 2 | Nhỏ-TB |
| 3. Dữ liệu & Logic | 3 (+ 7 phần nhỏ) | Lớn |
| 4. Giao diện | 6 | Lớn |
| 5. Local & AI | 3 (+ 4 phần nhỏ) | Lớn |
| 6. Online Multiplayer | 4 | Lớn |
| 7. Hoàn thiện | 4 | TB |
| 8. Sửa Lỗi Đồng Bộ Realtime | 6 | TB |
| **Tổng** | **31 công việc** | — |

---

# Giai Đoạn 8: Khắc Phục Triệt Để Lỗi Đồng Bộ Chơi Online & Chuyển Trận Đấu (Điện Thoại & Khách)

## 1. Báo Cáo Rà Soát Đa Trục (Code Review & Quality Findings)

### 🔴 Lỗi 1: Chủ phòng (Host) bấm nút bắt đầu chỉ chạy cục bộ (Client-only Local Trigger)
- **Vị trí:** `client/js/screens/LobbyScreen.js` (dòng 51–60)
- **Hiện trạng:** Khi chủ phòng bấm `btn-lobby-start`, mã lệnh chỉ gọi `window.SplendorApp.runGameCountdown()` và `window.SplendorApp.startOnlineGame(this.currentRoom)` trực tiếp trên máy chủ phòng. **Hoàn toàn không gửi bất kỳ sự kiện nào lên server!**
- **Hậu quả:** Server không hề biết trận đấu đã bắt đầu, không đổi trạng thái phòng sang `PLAYING`, và các thiết bị khách (như điện thoại tham gia) hoàn toàn không nhận được tín hiệu gì, vĩnh viễn kẹt ở phòng chờ (`LobbyScreen`).

### 🔴 Lỗi 2: Thiếu phương thức phát và nhận sự kiện `game:started` ở tầng mạng (`SocketClient.js`)
- **Vị trí:** `client/js/network/SocketClient.js`
- **Hiện trạng:** 
  1. Chưa có hàm `startGame(roomCode)` để gửi `room:start` lên server.
  2. Trong hàm `init()`, socket client chỉ lắng nghe `room:updated`, `room:player_left`, `game:state_updated`, `latency:pong`. Không hề đăng ký nhận `game:started`.
- **Hậu quả:** Tầng mạng bỏ qua hoàn toàn thông điệp khởi động ván đấu từ server.

### 🔴 Lỗi 3: Chưa có cơ chế đồng bộ hoạt ảnh đếm ngược và chuyển màn hình tập trung
- **Vị trí:** `client/js/screens/LobbyScreen.js`, `client/js/app.js`
- **Hiện trạng:** Hoạt ảnh đếm ngược 3... 2... 1... hoàng gia (`runGameCountdown`) chỉ được kích hoạt đơn phương bởi nút bấm của chủ phòng, thay vì phản hồi lại sự kiện `game:started` từ server phát tới tất cả người chơi trong phòng.
- **Giải pháp:** Khi server phát `game:started` kèm `gameState`, mọi client trong phòng (cả chủ phòng PC lẫn khách trên điện thoại) cùng lúc bật overlay đếm ngược 3... 2... 1..., sau đó đồng loạt chuyển vào `screen-game`.

### 🔴 Lỗi 4: Khởi tạo bàn chơi Online dùng ngẫu nhiên cục bộ thay vì GameState có thẩm quyền từ Server
- **Vị trí:** `client/js/app.js` (`startOnlineGame`) & `client/js/screens/GameScreen.js` (`startNewGame`)
- **Hiện trạng:** Hàm `startOnlineGame` gọi `SplendorGameScreen.startNewGame(configs, 'ONLINE', myIdx)` tạo ra một đối tượng `SplendorGameState.createNewGame()` mới toanh trên máy khách. Hàm này gọi `Math.random()` xáo bài riêng, khiến các máy trong cùng phòng sẽ nhìn thấy bộ bài và đá quý khác nhau hoàn toàn nếu cùng vào game.
- **Giải pháp:** Server đã có sẵn logic sinh `GameState` chuẩn tại `server/index.js` (dòng 208). Client khi nhận `game:started` phải nạp trạng thái bằng `SplendorGameState.fromJSON(serverGameState)` để mọi người chơi có chung 1 bàn cờ chính xác 100%.

### 🔴 Lỗi 5: Thao tác trong trận đấu Online bị xử lý cục bộ, không gửi lệnh lên Server
- **Vị trí:** `client/js/screens/GameScreen.js` (dòng 13–92)
- **Hiện trạng:** Khi người chơi lấy ngọc (`takeThreeGems`, `takeTwoSameGems`), mua thẻ (`purchaseCard`), giữ thẻ (`reserveCard`), các listener gọi thẳng vào `this.gameEngine` nội bộ trên máy đó mà không gọi `SplendorSocket.sendGameAction(actionType, actionData)`.
- **Hậu quả:** Người này đi nước cờ thì người kia trên điện thoại không thấy cập nhật, lượt chơi không chuyển qua mạng.

---

## 2. Kế Hoạch Nhiệm Vụ Chi Tiết (Phase 8 Task Breakdown)

### Task 26: Hoàn thiện tầng giao thức mạng Socket (`SocketClient.js`)
- **Mô tả:** Thêm phương thức `startGame()` gửi sự kiện `room:start` kèm callback phản hồi. Đăng ký listener sự kiện `game:started` trong `init()` và chuyển tiếp vào hệ thống sự kiện nội bộ `emitLocal('game:started', data)`.
- **Tiêu chí hoàn thành:**
  - `SplendorSocket.startGame()` gửi đúng định dạng `room:start`.
  - Khi server phát `game:started`, `SocketClient` kích hoạt callback nội bộ kèm dữ liệu `gameState`.
- **File:** `client/js/network/SocketClient.js`
- **Phạm vi:** Nhỏ (S, 1 file)

### Task 27: Sửa nút Bắt Đầu ở Phòng Chờ (`LobbyScreen.js`)
- **Mô tả:** Thay đổi sự kiện click nút `#btn-lobby-start`: Khi chủ phòng bấm, hiển thị trạng thái đang gửi lệnh và gọi `SplendorSocket.startGame()`. Nếu server báo lỗi (ví dụ chưa đủ người, chưa sẵn sàng), hiển thị Toast thông báo lỗi. Không tự ý chuyển màn hình tại đây.
- **Tiêu chí hoàn thành:**
  - Nút bắt đầu gửi tín hiệu qua Socket lên server.
  - Xử lý mượt mà khi server trả về lỗi hoặc thành công.
- **File:** `client/js/screens/LobbyScreen.js`
- **Phạm vi:** Nhỏ (S, 1 file)

### Task 28: Đồng bộ đếm ngược & Chuyển màn hình cho toàn bộ phòng
- **Mô tả:** Lắng nghe sự kiện `game:started` trên `LobbyScreen.js` (hoặc `app.js`). Khi nhận được sự kiện:
  1. Cả chủ phòng và người chơi khách (điện thoại) cùng chạy hoạt ảnh đếm ngược `window.SplendorApp.runGameCountdown()`.
  2. Khi đếm ngược kết thúc, tự động gọi `window.SplendorApp.startOnlineGameWithState(data.gameState)`.
- **Tiêu chí hoàn thành:**
  - Cả PC và điện thoại đồng loạt hiển thị overlay đếm ngược 3... 2... 1...
  - Cả hai thiết bị đồng loạt chuyển sang màn hình `#screen-game`.
- **File:** `client/js/screens/LobbyScreen.js`, `client/js/app.js`
- **Phạm vi:** Nhỏ (S, 2 files)

### Task 29: Khởi tạo bàn chơi Online với GameState có thẩm quyền từ Server
- **Mô tả:** Xây dựng hàm `startOnlineGameWithState(serverStateJSON)` trong `app.js` và `initFromOnlineState(serverStateJSON, myIndex)` trong `GameScreen.js`. Sử dụng `SplendorGameState.fromJSON(serverStateJSON)` để khôi phục chính xác 100% bàn cờ, bài 3 tầng, đá quý và lượt đi đầu tiên.
- **Tiêu chí hoàn thành:**
  - Cả 2 máy hiển thị cùng một bộ bài Tier 1, Tier 2, Tier 3 và các Quý tộc giống hệt nhau.
  - Vị trí `myPlayerIndex` được gán chính xác theo Socket ID của từng thiết bị.
- **File:** `client/js/app.js`, `client/js/screens/GameScreen.js`
- **Phạm vi:** Trung bình (M, 2 files)

### Task 30: Đồng bộ hành động người chơi trong trận đấu Online (`GameScreen.js`)
- **Mô tả:** 
  1. Trong `GameScreen.js`, nếu `this.gameState.mode === 'ONLINE'`: các thao tác lấy ngọc, mua thẻ, giữ chỗ, trả ngọc, chọn quý tộc sẽ gửi payload qua `SplendorSocket.sendGameAction(actionType, actionData)`.
  2. Lắng nghe `game:state_updated` từ server: Khi nhận được trạng thái mới, cập nhật `this.gameState = SplendorGameState.fromJSON(data.gameState)`, phát âm thanh tương ứng với hành động của đối thủ, và vẽ lại bàn chơi (`this.render()`).
  3. Khóa tương tác khi chưa đến lượt (`this.gameState.currentPlayerIndex !== this.myPlayerIndex`).
- **Tiêu chí hoàn thành:**
  - Thao tác trên một máy ngay lập tức được server xử lý và cập nhật lên máy còn lại.
  - Lượt chơi chuyển mượt mà giữa PC và điện thoại.
- **File:** `client/js/screens/GameScreen.js`, `server/index.js`
- **Phạm vi:** Trung bình (M, 2 files)

### Task 31: Kiểm thử đa thiết bị (PC Host + Phone Guest)
- **Mô tả:** Sử dụng kịch bản kiểm thử đa socket (CDP headless hoặc mô phỏng 2 phiên trình duyệt đồng thời) để xác thực toàn bộ luồng: Tạo phòng → Nhập mã trên điện thoại → Cả 2 sẵn sàng → Chủ phòng bấm Bắt đầu → Cả 2 đếm ngược → Cả 2 vào bàn cờ cùng trạng thái → Lấy đá quý đồng bộ thành công.
- **Tiêu chí hoàn thành:**
  - Không còn hiện tượng điện thoại bị kẹt ở phòng chờ.
  - Ván đấu diễn ra trơn tru giữa 2 thiết bị.
- **File:** `scratch/test-online-sync.js` (hoặc headless test)
- **Phạm vi:** Nhỏ (S)

---

# Giai Đoạn 9: Củng Cố Kết Nối Di Động & Trạng Thái Biên (Mobile Reconnection & Edge Case Hardening)

## 1. Báo Cáo Rà Soát Đa Trục Toàn Diện (5-Axis Review Summary)

### Trục 1: Tính đúng đắn (Correctness)
- **Critical: Mất kết nối đột ngột trong trận đấu xóa người chơi vĩnh viễn:** Trong `server/index.js`, hàm `handleLeaveRoom(socket)` lập tức gọi `room.players.splice(...)` ngay khi socket ngắt kết nối (`disconnect`). Trên mạng di động (chuyển sóng 4G/WiFi, tắt màn hình tạm thời, có cuộc gọi đến), việc socket ngắt tạm thời là bình thường. Khi người chơi mở lại trình duyệt và cố gắng kết nối lại, mã phòng báo lỗi vì người chơi đã bị xóa khỏi `room.players`, dẫn đến ván đấu bị kẹt cứng (deadlock) vĩnh viễn ở lượt của người chơi đó.
- **Required: Nhận diện chỉ mục người chơi (`myPlayerIndex`) khi khởi động bàn chơi online:** Trong `startOnlineGameWithState` (`app.js`), mã chỉ đối chiếu `p.id === mySocketId`. Nếu người chơi vừa đổi socket hoặc dùng tài khoản Google, việc fallback về `0` có thể khiến người chơi khách ngỡ mình là chủ phòng (Player 0) trong một khoảnh khắc trước khi cập nhật.
- **Required: Trạng thái chờ pha Trả đá quý thừa (`DISCARDING`) & Chọn Quý tộc (`SELECTING_NOBLE`):** Khi một người chơi vượt 10 viên đá quý và đang mở modal trả đá, các người chơi khác chỉ thấy modal bị ẩn nhưng banner lượt không giải thích lý do bàn cờ đang dừng lại.

### Trục 2: Tính dễ đọc & Đơn giản (Readability & Simplicity)
- Mã nguồn phân tách rõ ràng theo mô hình MVC thu gọn (Screen - Renderer - Engine/State).
- Cần chuẩn hóa các thông điệp thông báo trạng thái để người chơi hiểu rõ diễn biến trên mạng di động.

### Trục 3: Kiến trúc (Architecture)
- Giao thức Socket.IO hai chiều đã chuẩn hóa theo mô hình thẩm quyền phía Server (Server-authoritative state). Cần bổ sung cờ trạng thái `connected: false` và thời gian ân hạn (Grace Period) vào mô hình phòng (`GameRoom`).

### Trục 4: Bảo mật (Security)
- Kiểm tra tính hợp lệ của mọi tham số gửi lên từ `game:action`: xác thực `playerIndex`, kiểm tra kiểu dữ liệu của `gems`, `tier`, `cardId`.

### Trục 5: Hiệu năng & Trải nghiệm di động (Performance & Mobile UX)
- Màn hình điện thoại xoay dọc có hỗ trợ cuộn 2 chiều (`-webkit-overflow-scrolling: touch`), cần tối ưu hóa thêm độ nhạy của các nút bấm và kích thước hiển thị khay đá quý khi màn hình nhỏ.

---

## 2. Kế Hoạch Nhiệm Vụ Giai Đoạn 9 (Phase 9 Task Breakdown)

### Task 32: Cơ chế Ân Hạn Kết Nối Lại Khi Mất Mạng Đột Ngột (In-Game Disconnect Grace Period)
- **Mô tả:** Trong `server/index.js`, phân biệt giữa thoát phòng ở sảnh chờ (`status === 'LOBBY'`) và rớt mạng trong khi đang chơi (`status === 'PLAYING'`). Khi đang chơi, nếu ngắt socket:
  1. Không xóa người chơi khỏi `room.players`. Đánh dấu `connected = false` và lưu `disconnectedAt = Date.now()`.
  2. Phát thông báo `room:player_status_changed` tới các người chơi còn lại để hiển thị huy hiệu "Mất kết nối - Đang chờ..." kèm đồng hồ đếm ngược 60s.
  3. Khi người chơi quay lại và gọi `room:join`, nhận diện qua `uid` hoặc `name`, cập nhật socket mới vào `room.players` và `gameState.players`, gửi lại toàn bộ `gameState`, và phát `room:player_reconnected`.
- **Tiêu chí hoàn thành:**
  - [ ] Ngắt kết nối socket của 1 tab trong trận đấu không làm xóa phòng/người chơi.
  - [ ] Tab đó tải lại trang hoặc kết nối lại thành công, tiếp tục ván đấu bình thường.
  - [ ] Các người chơi khác thấy thông báo đối thủ đang kết nối lại thay vì ván đấu bị đơ.
- **Kiểm tra:**
  - [ ] Chạy script mô phỏng socket disconnect 5 giây rồi reconnect lại bằng mã phòng.
- **Phụ thuộc:** Task 30
- **File liên quan:** `server/index.js`, `client/js/screens/GameScreen.js`
- **Quy mô:** M (2 files)

### Task 33: Tối ưu Nhận Diện Người Chơi & Trạng Thái Chờ Toàn Bàn Cờ
- **Mô tả:** 
  1. Trong `app.js` (`startOnlineGameWithState`), nhận diện `myPlayerIndex` chuẩn xác bằng cách so sánh `p.id === mySocketId || (authUser?.uid && p.uid === authUser.uid) || p.name === authUser?.name`.
  2. Trong `BoardRenderer.js`, khi `gameState.phase === 'DISCARDING'` và `gameState.discardingPlayerIndex !== myPlayerIndex`, hiển thị banner thông báo: `⏳ [Tên người chơi] đang chọn trả [N] đá quý thừa về kho...`.
  3. Khi `gameState.phase === 'SELECTING_NOBLE'` và chưa tới lượt mình chọn, hiển thị thông báo: `👑 [Tên người chơi] đang chọn Quý tộc diện kiến...`.
- **Tiêu chí hoàn thành:**
  - [ ] Không còn tình trạng gán nhầm Player 0 cho khách trên điện thoại khi mới vào bàn cờ.
  - [ ] Tất cả người chơi trong phòng luôn biết chính xác bàn cờ đang chờ ai và đang làm thao tác gì.
- **Kiểm tra:**
  - [ ] Kiểm tra trực quan trên 2 màn hình khi 1 bên có > 10 viên đá quý.
- **Phụ thuộc:** Task 29, Task 30
- **File liên quan:** `client/js/app.js`, `client/js/ui/BoardRenderer.js`
- **Quy mô:** S (2 files)

### Task 34: Tinh Chỉnh Bố Cục Cảm Ứng Di Động & Vùng Chạm Bàn Cờ
- **Mô tả:** Nâng cao kích thước vùng chạm (hitbox) trên điện thoại cho các chip đá quý, thẻ phát triển và nút đóng/mở thanh điều khiển. Bổ sung hỗ trợ vuốt chạm mượt mà trên iOS Safari và Android Chrome.
- **Tiêu chí hoàn thành:**
  - [ ] Các chip đá quý có padding chạm tối thiểu 44x44px trên màn hình cảm ứng.
  - [ ] Bàn cờ khi ở chiều dọc có thanh cuộn mượt và chỉ dẫn trực quan.
- **Kiểm tra:**
  - [ ] Kiểm thử cảm ứng trên Chrome DevTools Mobile Emulation.
- **Phụ thuộc:** Task 3
- **File liên quan:** `client/css/board.css`, `client/css/responsive.css`, `client/css/tokens.css`
- **Quy mô:** S (3 files)

### Task 35: Tự Động Hóa Kiểm Thử E2E Toàn Quy Trình Đa Thiết Bị
- **Mô tả:** Viết script kiểm thử tự động toàn diện kiểm tra chu trình hoàn chỉnh: Tạo phòng trên PC → Vào phòng trên điện thoại → Sẵn sàng & Bắt đầu → Đồng bộ đếm ngược → Đi nước cờ lấy đá quý → Rớt mạng và kết nối lại thành công.
- **Tiêu chí hoàn thành:**
  - [x] Script kiểm thử tự động chạy không có lỗi ngoại lệ.
  - [x] Xác nhận toàn bộ chu trình xanh 100%.
- **Kiểm tra:**
  - [x] `node scratch/test-e2e-resilience.js` chạy thành công.
- **Phụ thuộc:** Task 32, 33, 34
- **File liên quan:** `scratch/test-e2e-resilience.js`
- **Quy mô:** S (1 file)

---

# Giai Đoạn 10: Tái Thiết Kế Bố Cục Bàn Cờ "Vừa Khít 100% — Không Che Lấp" (Phase 10: Responsive Auto-Fit & Anti-Clipping Redesign)

## 1. Phân Tích Hiện Trạng Qua 2 Ảnh Người Dùng Cung Cấp

### 🔴 Hiện Trạng Trên Web PC (Ảnh 1)
- **Hàng thẻ Tầng 1 (Tier 1 - Cơ bản) bị che khuất hơn 50%:** Bảng điều khiển người chơi ở đáy (`.current-player-mat`) cao quá mức (125px-135px), đè lên vùng bàn cờ. Các chấm tròn chi phí đá quý dưới đáy thẻ Tầng 1 bị chìm xuống dưới, người chơi không thể nhìn thấy giá mua của các thẻ này.
- **Nguyên nhân cốt lõi:** Kích thước thẻ bài đang dùng chiều cao cố định theo chiều ngang (`clamp(140px, 11.5vw, 196px)` hoặc 174px-198px). Khi chiều cao trình duyệt PC ở mức phổ biến (720px - 820px sau khi trừ thanh tab và taskbar Windows), tổng chiều cao: Header (48px) + Banner lượt (32px) + 3 hàng thẻ ($3 \times 174\text{px} = 522\text{px}$) + Bảng đáy (125px) + Khoảng đệm (30px) = **757px**, vượt quá chiều cao khả dụng của vùng cờ (`overflow: hidden`), dẫn đến đáy bàn cờ bị xén mất.

### 🔴 Hiện Trạng Trên Web Điện Thoại Xoay Ngang (Ảnh 2)
- **Hàng thẻ Tầng 1 gần như biến mất hoàn toàn:** Thẻ xanh lá Tầng 1 bị Bảng đáy đè lên tới 90%, chỉ còn thò ra đúng viền trên.
- **Kho Đá Quý bên phải bị mất nút thao tác:** 2 viên đá quý cuối (Mã não và Vàng) bị cắt nửa, còn thanh xem trước và **nút "Lấy Đá Quý" bị biến mất 100% ra khỏi màn hình**. Người chơi trên điện thoại hoàn toàn không thể bấm lấy ngọc!
- **Cột Quý tộc bên trái:** Quý tộc trên cùng (`Anne o...`) bị cắt mất nửa trên.
- **Bảng người chơi đáy:** Chiếm tới 25% tổng chiều cao màn hình (80px trên tổng số ~360px của điện thoại ngang), gây lãng phí không gian nghiêm trọng.
- **Nguyên nhân cốt lõi:** Chiều cao điện thoại ngang chỉ từ $340\text{px} - 390\text{px}$. Các thành phần đang dùng chiều cao pixel tĩnh độc lập với nhau thay vì tuân theo nguyên tắc Ngân sách Chiều cao (Vertical Space Budgeting).

---

## 2. Kế Hoạch Nhiệm Vụ Chi Tiết (Phase 10 Task Breakdown)

### Task 36: Tái cấu trúc Khung Bàn Chơi Tổng Thể & Ngân Sách Chiều Cao (Viewport Budgeting)
- **Mô tả:** 
  1. Đặt `#screen-game` theo cấu trúc Flexbox đứng chuẩn: `height: 100dvh; display: flex; flex-direction: column; overflow: hidden;`.
  2. Thu gọn Header: Desktop còn $40\text{px}$, Mobile Landscape còn $34\text{px}$.
  3. Tinh giản `.current-player-mat` thành dạng 1 hàng ngang siêu gọn:
     - Trên Desktop PC: Giảm chiều cao từ $125\text{px}$ xuống `clamp(64px, 8.5vh, 76px)`.
     - Trên Mobile Landscape: Giảm từ $80\text{px}$ xuống `clamp(46px, 12vh, 52px)`, avatar $30\text{px}$, thu gọn padding để giải phóng tối đa diện tích cho bàn cờ.
  4. Phân bổ toàn bộ không gian còn lại cho `.game-layout` với `flex: 1; min-height: 0; overflow: hidden;`.
- **Tiêu chí hoàn thành:**
  - [ ] `.game-layout` luôn tự động chiếm đúng phần chiều cao khả dụng giữa Header và Player Mat.
  - [ ] Không có thanh cuộn trang thừa ngoài ý muốn trên toàn màn hình.
- **Kiểm tra:** Đo đạc `offsetHeight` của `#screen-game` đúng bằng `window.innerHeight`.
- **Phụ thuộc:** Không có
- **File liên quan:** `client/css/board.css`, `client/css/responsive.css`, `client/css/index.css`
- **Quy mô:** M (3 files)

### Task 37: Co Giãn Ma Trận Thẻ Bài 3 Tầng Tự Động (Auto-Fit 3-Tier Card Matrix)
- **Mô tả:** 
  1. `.card-matrix-board` chiếm `flex: 1; min-height: 0;` với 3 hàng `.card-tier-row` chia đều không gian khả dụng (`flex: 1; min-height: 0; max-height: calc(33.33% - 4px);`).
  2. Loại bỏ chiều cao pixel cố định (`--card-height`). Thẻ bài `.dev-card` và ô bài ẩn `.deck-slot` định dạng theo `height: 100%; aspect-ratio: 5 / 7; width: auto;`.
  3. Toàn bộ nội dung bên trong thẻ bài (Header điểm uy tín, tranh nền, khay chi phí đá quý `.card-bottom-tray`, chấm tròn chi phí `.cost-token-disc`) tự động co giãn tỷ lệ thuận theo chiều cao thẻ.
  4. Đảm bảo toàn bộ 4 thẻ của Tầng 3, Tầng 2 và đặc biệt là Tầng 1 cùng các chấm chi phí hiển thị trọn vẹn 100% trong tầm nhìn.
- **Tiêu chí hoàn thành:**
  - [ ] Cả 3 hàng thẻ bài đều nằm trọn vẹn trong màn hình trên cả PC lẫn điện thoại ngang.
  - [ ] Chấm chi phí đá quý dưới đáy thẻ Tầng 1 không bị bảng người chơi đè lên dù chỉ 1 pixel.
- **Kiểm tra:** Kiểm tra hiển thị tại chiều cao màn hình 720px (PC) và 360px (Điện thoại ngang).
- **Phụ thuộc:** Task 36
- **File liên quan:** `client/css/cards.css`, `client/css/board.css`, `client/css/responsive.css`
- **Quy mô:** M (3 files)

### Task 38: Tinh Chỉnh Cột Quý Tộc & Bảng Đối Thủ (Left Sidebar Adaptation)
- **Mô tả:** 
  1. Thẻ Quý tộc `.noble-card` chuyển sang sử dụng `aspect-ratio: 1 / 1` với `max-height: clamp(48px, 9vh, 90px)`.
  2. Trên Mobile Landscape: Sắp xếp các ô Quý tộc thành dạng lưới 2 cột mini hoặc thanh cuộn dọc mượt mà có padding hợp lý, không bao giờ bị cắt mất phần trên của Quý tộc đầu tiên.
  3. Thẻ Đối thủ (`.opponent-card`): Thiết kế siêu gọn gàng (Avatar 20px, điểm vàng, tổng token/thẻ/giữ) để không lấn át diện tích Quý tộc.
- **Tiêu chí hoàn thành:**
  - [ ] Thẻ Quý tộc đầu tiên và các Quý tộc tiếp theo hiển thị đầy đủ, không bị khuất tên hay điều kiện.
  - [ ] Cột trái hiển thị cân đối và hòa quyện với bàn cờ.
- **Kiểm tra:** Chơi thử bàn 2 người, 3 người và 4 người (số Quý tộc từ 3 đến 5).
- **Phụ thuộc:** Task 36
- **File liên quan:** `client/css/board.css`, `client/css/cards.css`, `client/css/responsive.css`
- **Quy mô:** S (2 files)

### Task 39: Tinh Chỉnh Kho Đá Quý & Nút "Lấy Đá Quý" Luôn Trong Tầm Nhìn (Right Sidebar Bank)
- **Mô tả:** 
  1. Tái cấu trúc `.bank-container`: Đảm bảo 6 loại đá quý và khu vực hành động (xem trước + nút "Lấy Đá Quý") luôn nằm trọn vẹn 100% trong khung nhìn thẳng, không bao giờ bị trôi ra khỏi màn hình.
  2. Trên Mobile Landscape:
     - Chuyển `.gem-bank-grid` thành dạng 3 cột $\times$ 2 hàng nhỏ gọn (Hàng 1: Kim cương, Sapphire, Ngọc lục bảo; Hàng 2: Ruby, Mã não, Vàng) với chip size `clamp(32px, 6.5vh, 42px)`.
     - Tích hợp thanh xác nhận lấy ngọc gọn gàng ngay dưới khay ngọc. Nút "Lấy Đá Quý" luôn sáng rõ và dễ bấm.
- **Tiêu chí hoàn thành:**
  - [ ] Cả 6 viên đá quý đều nhìn thấy rõ số lượng trong kho.
  - [ ] Nút "Lấy Đá Quý" luôn hiển thị trên màn hình điện thoại, không cần cuộn trang.
- **Kiểm tra:** Kiểm tra trên màn hình điện thoại xoay ngang 375x667 và 390x844.
- **Phụ thuộc:** Task 36
- **File liên quan:** `client/css/tokens.css`, `client/css/board.css`, `client/css/responsive.css`
- **Quy mô:** S (2 files)

### Task 40: Kiểm Thử Xác Thực Trực Quan Bằng Ảnh Chụp Đa Màn Hình (Visual Snapshot Verification)
- **Mô tả:** Viết script kiểm thử tự động sử dụng Chrome CDP chụp ảnh màn hình bàn cờ ở 3 cấu hình:
  1. Desktop Full HD (1920x1080).
  2. Laptop / Desktop chiều cao trung bình (1280x720).
  3. Mobile Landscape (iPhone / Android: 844x390 & 667x375).
  - Phân tích tọa độ phần tử (boundingClientRect): Đảm bảo cạnh đáy của thẻ Tầng 1 luôn nhỏ hơn cạnh trên của Player Mat (`tier1.bottom <= playerMat.top`).
  - Đảm bảo cạnh đáy của nút "Lấy Đá Quý" luôn nhỏ hơn cạnh trên của Player Mat hoặc đáy viewport.
- **Tiêu chí hoàn thành:**
  - [ ] Script kiểm thử tự động xác nhận không có bất kỳ phần tử nào bị che lấp hoặc tràn màn hình.
  - [ ] Lưu ảnh chụp kiểm chứng vào `scratch/` để đối chiếu với ảnh lỗi ban đầu của người dùng.
- **Kiểm tra:** `node scratch/verify-viewport-fit.js` chạy đạt 100%.
- **Phụ thuộc:** Task 36, 37, 38, 39
- **File liên quan:** `scratch/verify-viewport-fit.js`
- **Quy mô:** S (1 file)



