# Hướng Dẫn Cấu Hình Google OAuth 2.0 (Xác Thực Thật)

Tài liệu hướng dẫn thiết lập Google OAuth Client ID để đăng nhập tài khoản Google thật trên Splendor Board Game.

---

## 1. Tạo Google OAuth Client ID Trên Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một Project mới hoặc chọn Project có sẵn.
3. Vào **APIs & Services** ➔ **OAuth consent screen** (Màn hình đồng ý OAuth):
   - Chọn loại User: **External** (Bên ngoài).
   - Điền Tên ứng dụng (ví dụ: `Splendor Board Game`), Email hỗ trợ người dùng và Email liên hệ nhà phát triển.
   - Thêm các quyền (Scopes): `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
   - Trong mục **Test users** (Người dùng thử nghiệm), thêm các địa chỉ Gmail bạn dùng để chơi thử nghiệm (ví dụ email của bạn và bạn bè).
4. Vào **APIs & Services** ➔ **Credentials** (Thông tin xác thực):
   - Bấm **+ CREATE CREDENTIALS** ➔ chọn **OAuth client ID**.
   - Application type: chọn **Web application** (Ứng dụng web).
   - Name: `Splendor Web Client`.
   - **Authorized JavaScript origins** (Nguồn gốc JavaScript được phép):
     - `http://localhost:3000`
     - `http://127.0.0.1:3000`
     - Đường dẫn domain public của bạn (ví dụ localtunnel): `https://olive-bugs-dream.loca.lt`
   - **Authorized redirect URIs** (URI chuyển hướng được phép):
     - `http://localhost:3000/`
     - `http://127.0.0.1:3000/`
     - `https://olive-bugs-dream.loca.lt/`
5. Bấm **CREATE**. Copy chuỗi **Client ID** (có dạng `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`).

---

## 2. Cung Cấp Client ID Cho Ứng Dụng

Bạn có thể cung cấp Client ID theo 2 cách cực kỳ tiện lợi:

### Cách A: Cấu hình qua file `.env` (Khuyên dùng)
Tạo hoặc mở file `.env` ở thư mục gốc của dự án:
```env
PORT=3000
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
```
Khởi động lại server (`node server/index.js`). Mọi thiết bị truy cập sẽ tự động nhận Client ID này.

### Cách B: Điền trực tiếp trên giao diện web
1. Mở web Splendor trên trình duyệt.
2. Bấm vào Avatar góc trên cùng bên phải để mở **Hồ Sơ Thương Gia**.
3. Nếu máy chủ chưa cấu hình file `.env`, khung cấu hình **⚙️ Cấu hình Google Client ID** sẽ tự động hiển thị.
4. Dán Client ID của bạn vào ô và bấm **Lưu & Đăng Nhập**. Hệ thống sẽ tự động lưu lên máy chủ và chuyển hướng sang Google.

---

## 3. Cơ Chế Chống Trùng Thiết Bị (Multi-Device Duplicate Prevention)

Hệ thống tích hợp sẵn thuật toán kiểm tra phiên đăng nhập và định danh tài khoản:
- **Không thể chơi đối kháng với chính mình**: Nếu Thiết bị 1 đã tạo hoặc vào phòng bằng tài khoản Google `A@gmail.com`, Thiết bị 2 dùng cùng tài khoản `A@gmail.com` khi cố vào phòng sẽ bị máy chủ từ chối ngay lập tức với thông báo:
  > *"⚠️ Tài khoản Google (A@gmail.com) hiện đang hoạt động trên một thiết bị khác trong phòng này! Mỗi người chơi phải đăng nhập một tài khoản Google riêng biệt để thi đấu."*
- **Không thể chiếm nhiều phòng cùng lúc**: Nếu tài khoản đang chơi ở phòng khác, máy chủ sẽ yêu cầu thoát phòng cũ trước khi mở phòng mới.
- **Hỗ trợ Reconnect an toàn**: Nếu mạng bị ngắt tạm thời (`connected: false`), chính tài khoản đó vẫn có thể kết nối lại vào ván đấu mà không bị chặn.
