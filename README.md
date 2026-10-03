# 💎 Board Game Splendor - Trực Tuyến & Chuyền Tay

> **Kiệt Tác Đá Quý Thời Kỳ Phục Hưng**  
> Xây dựng hoàn chỉnh trò chơi board game chiến thuật **Splendor** chơi trực tiếp trên trình duyệt Web (Desktop) và Điện Thoại di động (tối ưu xoay ngang màn hình).

---

## 🌟 Tính Năng Nổi Bật

- **Toàn Bộ Giao Diện Tiếng Việt**: Thiết kế theo phong cách bàn cờ cổ điển Phục Hưng — vân gỗ sồi ấm áp, chip đá quý 3D cắt gọt tinh xảo, hiệu ứng vàng kim sang trọng.
- **3 Chế Độ Chơi Hấp Dẫn**:
  1. 🌐 **Chơi Online (Multiplayer)**: Tạo phòng với mã phòng 6 ký tự (ví dụ: `AB12CD`), kết nối bạn bè thi đấu thời gian thực qua WebSockets (Socket.IO).
  2. 👥 **Chuyền Tay (Pass & Play)**: Chơi cùng bạn bè và người thân từ 2 đến 4 người trên cùng một thiết bị.
  3. 🤖 **Đấu Với Máy (AI Bot)**: 3 cấp độ thông minh:
     - **Tập Sự (Dễ)**: Đi các nước hợp lệ ngẫu nhiên.
     - **Chiến Thuật (Trung Bình)**: Chấm điểm hành động theo thẻ điểm cao và tích lũy bonus quý tộc.
     - **Bậc Thầy (Khó)**: Nhìn xa 2-3 lượt, tính toán tối ưu loại ngọc cần gom, chặn thẻ điểm cao của đối thủ.
- **Xác Thực Người Dùng**: Tích hợp danh tính người chơi, avatar và lưu trữ bảng thành tích cá nhân (Số trận, số trận thắng, tỷ lệ thắng, điểm kỷ lục).
- **Trải Nghiệm Điện Thoại Nằm Ngang**: Tự động hiển thị lời nhắc xoay ngang màn hình khi ở chế độ dọc (portrait) trên điện thoại và tablet.
- **Hiệu Ứng Âm Thanh Tự Nhiên**: Tích hợp Web Audio API (không phụ thuộc file âm thanh ngoài), mô phỏng tiếng click đá quý, tiếng lật bài và kèn vinh danh khi Quý Tộc ghé thăm.

---

## 🎲 Luật Chơi Chuẩn Quốc Tế

- **Đá Quý & Vàng**: 5 loại ngọc cơ bản (Kim cương 💎, Sapphire 🔵, Ngọc lục bảo 🟢, Ruby 🔴, Mã não ⚫) + Vàng đa năng 🟡.
- **4 Hành Động Mỗi Lượt**:
  1. Lấy 3 viên đá quý khác màu.
  2. Lấy 2 viên đá quý cùng màu (khi trong kho còn ≥ 4 viên).
  3. Giữ chỗ 1 thẻ bài (tối đa giữ 3 thẻ) + nhận 1 Vàng đa năng nếu kho còn.
  4. Mua 1 thẻ bài từ bàn hoặc từ danh sách đã giữ chỗ bằng đá quý và điểm giảm giá vĩnh viễn (bonus).
- **Quý Tộc (3 Điểm)**: Tự động ghé thăm cuối lượt khi người chơi đạt đủ số thẻ bonus tương ứng.
- **Giới Hạn 10 Viên Đá Quý**: Tự động bật giao diện trả lại ngọc thừa nếu sau khi lấy người chơi có trên 10 viên.
- **Điều Kiện Thắng**: Người đầu tiên đạt 15 điểm uy tín kích hoạt vòng cuối cùng; người có nhiều điểm nhất thắng (hòa xét người mua ít thẻ hơn).

---

## 🚀 Cài Đặt & Chạy Trực Tiếp

### 1. Yêu cầu môi trường
- [Node.js](https://nodejs.org/) phiên bản 18 trở lên.

### 2. Khởi chạy Server
```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy server
npm start
```

Mở trình duyệt truy cập: **`http://localhost:3000`**

---

## 📁 Cấu Trúc Thư Mục

```
├── client/                     # Mã nguồn giao diện người dùng (Frontend thuần)
│   ├── index.html              # Bàn cờ và các màn hình chính
│   ├── css/                    # Hệ thống thiết kế CSS
│   │   ├── index.css           # Biến màu, gỗ vintage, đá quý, typography
│   │   ├── responsive.css      # Bố cục xoay ngang điện thoại & overlay
│   │   ├── tokens.css          # Kiểu dáng đá quý 3D
│   │   ├── cards.css           # Thẻ phát triển 3 tầng & ô quý tộc
│   │   ├── board.css           # Bàn cờ, cột đối thủ & player mat đáy
│   │   ├── auth.css            # Form thiết lập & phòng chờ online
│   │   └── animations.css      # Hiệu ứng chuyển động 60fps
│   └── js/                     # Logic xử lý JavaScript
│       ├── app.js              # Điểm vào ứng dụng & điều hướng
│       ├── auth/AuthManager.js # Quản lý phiên đăng nhập Google
│       ├── game/               # Động cơ bàn cờ
│       │   ├── CardData.js     # 90 thẻ bài + 10 quý tộc
│       │   ├── GameState.js    # Quản lý trạng thái bàn cờ
│       │   ├── Validator.js    # Kiểm tra tính hợp lệ mọi nước đi
│       │   ├── GameEngine.js   # Động cơ luật chơi Splendor
│       │   └── AIPlayer.js     # Bot AI 3 cấp độ
│       ├── network/            # Kết nối Socket.IO realtime
│       ├── screens/            # Điều khiển từng màn hình
│       ├── ui/                 # Render giao diện & tương tác
│       └── utils/              # Âm thanh, tiếng Việt & trợ giúp
├── server/                     # Backend Node.js + Express + Socket.IO
│   ├── index.js                # Server realtime & quản lý phòng chơi
│   └── package.json            # Cấu hình phụ thuộc Express & Socket.IO
├── shared/                     # Hằng số & thông số Splendor dùng chung
│   └── constants.js
└── tasks/                      # Kế hoạch chi tiết & tiến độ triển khai
```

---

## 🌐 Hướng Dẫn Triển Khai (Deploy)

- **Frontend**: Triển khai miễn phí trên **GitHub Pages**, Vercel hoặc Netlify.
- **Backend**: Triển khai trên **Render.com** (Web Service Node.js miễn phí) hoặc Railway / Fly.io.

---

Chúc anh có những giờ phút thi đấu Splendor kịch tính và chiến thắng vẻ vang! 🏆
