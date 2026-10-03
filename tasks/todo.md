# Danh Sách Nhiệm Vụ Triển Khai Splendor

- [ ] **Giai Đoạn 1: Nền Tảng (Phase 1: Foundation)**
  - [ ] Task 1: Khởi tạo dự án & cấu trúc monorepo (`client/`, `server/`, `shared/`), setup Express + Socket.IO server, test serve client
  - [ ] Task 2: Hệ thống thiết kế CSS (`client/css/index.css`), bảng màu gỗ vintage, đá quý, typography tiếng Việt
  - [ ] Task 3: Bố cục responsive (`client/css/responsive.css`), khóa xoay ngang điện thoại, overlay xoay màn hình

- [ ] **Giai Đoạn 2: Xác Thực (Phase 2: Authentication)**
  - [ ] Task 4: Tích hợp Firebase Auth Google Sign-in (`AuthManager.js`, `LoginScreen.js`, `server/auth.js`)
  - [ ] Task 5: Hồ sơ người chơi & thống kê (avatar, tên, lịch sử trận)

- [ ] **Giai Đoạn 3: Dữ Liệu & Logic Game (Phase 3: Data & Logic)**
  - [ ] Task 6: Mã hóa dữ liệu 90 thẻ bài (3 cấp) & 10 quý tộc chuẩn luật Splendor
  - [ ] Task 7: Mô hình GameState (setup 2, 3, 4 người chơi, serialize/deserialize)
  - [ ] Task 8: Engine luật chơi & Validator
    - [ ] 8a: Lấy 3 đá quý khác màu
    - [ ] 8b: Lấy 2 đá quý cùng màu
    - [ ] 8c: Giữ chỗ thẻ & nhận vàng
    - [ ] 8d: Mua thẻ (từ bàn hoặc thẻ giữ, dùng bonus + vàng)
    - [ ] 8e: Quý tộc tự động ghé thăm
    - [ ] 8f: Giới hạn 10 token & trả token thừa
    - [ ] 8g: Điều kiện thắng 15+ uy tín, vòng cuối & tiebreak

- [ ] **Giai Đoạn 4: Giao Diện Bàn Chơi (Phase 4: UI & Components)**
  - [ ] Task 9: Màn hình chính HomeScreen & điều hướng tiếng Việt
  - [ ] Task 10: TokenRenderer & tương tác chọn đá quý
  - [ ] Task 11: CardRenderer & luồng xem/mua/giữ thẻ
  - [ ] Task 12: NobleRenderer & hiển thị tiến độ quý tộc
  - [ ] Task 13: PlayerPanel (thông tin 2-4 người chơi, bonus, token, điểm uy tín)
  - [ ] Task 14: Ghép bàn chơi hoàn chỉnh BoardRenderer & GameScreen

- [ ] **Giai Đoạn 5: Chế Độ Local & AI (Phase 5: Local & AI Modes)**
  - [ ] Task 15: Chế độ chuyền tay (Pass-and-play 2-4 người)
  - [ ] Task 16: AI Bot (Dễ, Trung bình, Khó)
  - [ ] Task 17: Màn hình kết quả ResultScreen & vinh danh người thắng

- [ ] **Giai Đoạn 6: Chơi Online Multiplayer (Phase 6: Online Multiplayer)**
  - [ ] Task 18: Server GameEngine & xác thực lượt
  - [ ] Task 19: Quản lý phòng GameRoom (mã phòng 6 ký tự, kết nối lại 30s)
  - [ ] Task 20: SocketClient & đồng bộ realtime
  - [ ] Task 21: Giao diện phòng chờ LobbyScreen

- [ ] **Giai Đoạn 7: Hoàn Thiện & Trải Nghiệm (Phase 7: Polish)**
  - [ ] Task 22: Hiệu ứng chuyển động & hoạt họa lật thẻ, nảy ngọc
  - [ ] Task 23: SoundManager & hiệu ứng âm thanh cổ điển
  - [ ] Task 24: Hướng dẫn luật chơi trực quan (Cách Chơi)
  - [ ] Task 25: Tối ưu PWA, mobile landscape lock, xử lý biên
