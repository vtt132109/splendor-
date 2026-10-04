# Danh Sách Nhiệm Vụ Triển Khai Splendor

- [x] **Giai Đoạn 1: Nền Tảng (Phase 1: Foundation)**
  - [x] Task 1: Khởi tạo dự án & cấu trúc monorepo (`client/`, `server/`, `shared/`), setup Express + Socket.IO server, test serve client
  - [x] Task 2: Hệ thống thiết kế CSS (`client/css/index.css`), bảng màu gỗ vintage, đá quý, typography tiếng Việt
  - [x] Task 3: Bố cục responsive (`client/css/responsive.css`), khóa xoay ngang điện thoại, overlay xoay màn hình

- [x] **Giai Đoạn 2: Xác Thực (Phase 2: Authentication)**
  - [x] Task 4: Tích hợp Google Sign-in / Hồ sơ (`AuthManager.js`, `HomeScreen.js`, `server/index.js`)
  - [x] Task 5: Hồ sơ người chơi & thống kê (avatar, tên, lịch sử trận)

- [x] **Giai Đoạn 3: Dữ Liệu & Logic Game (Phase 3: Data & Logic)**
  - [x] Task 6: Mã hóa dữ liệu 90 thẻ bài (3 cấp) & 10 quý tộc chuẩn luật Splendor (`CardData.js`)
  - [x] Task 7: Mô hình GameState (setup 2, 3, 4 người chơi, serialize/deserialize) (`GameState.js`)
  - [x] Task 8: Engine luật chơi & Validator
    - [x] 8a: Lấy 3 đá quý khác màu
    - [x] 8b: Lấy 2 đá quý cùng màu
    - [x] 8c: Giữ chỗ thẻ & nhận vàng
    - [x] 8d: Mua thẻ (từ bàn hoặc thẻ giữ, dùng bonus + vàng)
    - [x] 8e: Quý tộc tự động ghé thăm
    - [x] 8f: Giới hạn 10 token & trả token thừa
    - [x] 8g: Điều kiện thắng 15+ uy tín, vòng cuối & tiebreak

- [x] **Giai Đoạn 4: Giao Diện Bàn Chơi (Phase 4: UI & Components)**
  - [x] Task 9: Màn hình chính HomeScreen & điều hướng tiếng Việt (`HomeScreen.js`)
  - [x] Task 10: TokenRenderer & tương tác chọn đá quý (`TokenRenderer.js`, `tokens.css`)
  - [x] Task 11: CardRenderer & luồng xem/mua/giữ thẻ (`CardRenderer.js`, `cards.css`)
  - [x] Task 12: NobleRenderer & hiển thị tiến độ quý tộc (`NobleRenderer.js`)
  - [x] Task 13: PlayerPanel (thông tin 2-4 người chơi, bonus, token, điểm uy tín) (`PlayerPanel.js`)
  - [x] Task 14: Ghép bàn chơi hoàn chỉnh BoardRenderer & GameScreen (`BoardRenderer.js`, `board.css`)

- [x] **Giai Đoạn 5: Chế Độ Local & AI (Phase 5: Local & AI Modes)**
  - [x] Task 15: Chế độ chuyền tay (Pass-and-play 2-4 người) (`GameScreen.js`)
  - [x] Task 16: AI Bot (Dễ, Trung bình, Khó) (`AIPlayer.js`)
  - [x] Task 17: Màn hình kết quả ResultScreen & vinh danh người thắng (`ResultScreen.js`)

- [x] **Giai Đoạn 6: Chơi Online Multiplayer (Phase 6: Online Multiplayer)**
  - [x] Task 18: Server GameEngine & xác thực lượt (`server/index.js`, `server/GameEngine.js`)
  - [x] Task 19: Quản lý phòng GameRoom (mã phòng 6 ký tự, kết nối lại)
  - [x] Task 20: SocketClient & đồng bộ realtime (`SocketClient.js`)
  - [x] Task 21: Giao diện phòng chờ LobbyScreen (`LobbyScreen.js`, `auth.css`)

- [x] **Giai Đoạn 7: Hoàn Thiện & Trải Nghiệm (Phase 7: Polish)**
  - [x] Task 22: Hiệu ứng chuyển động & hoạt họa lật thẻ, nảy ngọc (`animations.css`)
  - [x] Task 23: SoundManager & hiệu ứng âm thanh cổ điển Web Audio (`SoundManager.js`)
  - [x] Task 24: Hướng dẫn luật chơi trực quan (Cách Chơi) (`i18n.js`, modal)
  - [x] Task 25: Tối ưu PWA, mobile landscape lock, xử lý biên

- [x] **Giai Đoạn 8: Sửa Lỗi Đồng Bộ Realtime & Chuyển Trận Đấu Online (Phase 8: Online Sync & Transition Fix)**
  - [x] Task 26: Hoàn thiện tầng giao thức mạng Socket (`SocketClient.js`) — bổ sung method `startGame()`, event listener `game:started`, `game:state_updated`
  - [x] Task 27: Sửa nút Bắt Đầu ở Phòng Chờ (`LobbyScreen.js`) — Host gửi yêu cầu bắt đầu lên Server thay vì tự chạy local
  - [x] Task 28: Đồng bộ đếm ngược & Chuyển màn hình cho toàn bộ phòng (`LobbyScreen.js` & `app.js`)
  - [x] Task 29: Khởi tạo bàn chơi Online với GameState có thẩm quyền từ Server (`GameScreen.js` & `app.js`)
  - [x] Task 30: Đồng bộ hành động người chơi trong trận đấu Online (`GameScreen.js` → `SocketClient.js` → Server → broadcast `game:state_updated`)
  - [x] Task 31: Kiểm thử đa thiết bị (PC host + Phone client qua kịch bản kiểm thử tự động 2 socket và Chrome E2E)

- [x] **Giai Đoạn 9: Củng Cố Kết Nối Di Động & Trạng Thái Biên (Phase 9: Mobile Reconnection & Edge Case Hardening)**
  - [x] Task 32: Cơ chế Ân Hạn Kết Nối Lại Khi Mất Mạng Đột Ngột (In-Game Disconnect Grace Period & Socket Rebind in `server/index.js`)
  - [x] Task 33: Tối ưu Nhận Diện Người Chơi & Trạng Thái Chờ Toàn Bàn Cờ (Fix `myPlayerIndex` matching in `app.js`, show waiting banners for Discarding & Noble phases in `BoardRenderer.js`)
  - [x] Task 34: Tinh Chỉnh Bố Cục Cảm Ứng Di Động & Vùng Chạm Bàn Cờ (Expand gem hitboxes & touch targets in `responsive.css` & `tokens.css`)
  - [x] Task 35: Tự Động Hóa Kiểm Thử E2E Toàn Quy Trình Đa Thiết Bị (Create and run `scratch/test-e2e-resilience.js`)



