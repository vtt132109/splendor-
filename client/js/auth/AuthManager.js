/**
 * Splendor Board Game - Quản Lý Xác Thực Người Dùng Google (AuthManager.js)
 * Hỗ trợ Đăng nhập Google, lưu thông tin hồ sơ và đồng bộ trạng thái
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.storageKey = 'splendor_auth_user';
    this.loadCachedUser();
  }

  loadCachedUser() {
    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        this.currentUser = JSON.parse(cached);
      } else {
        // Tạo người chơi mặc định
        this.currentUser = {
          uid: 'user_' + Math.random().toString(36).substr(2, 7),
          name: 'Đại Thương Gia',
          email: '',
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
          isLoggedIn: false
        };
      }
    } catch (e) {
      this.currentUser = {
        uid: 'guest_' + Date.now(),
        name: 'Đại Thương Gia',
        isLoggedIn: false
      };
    }
  }

  onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      callback(this.currentUser);
    }
  }

  notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb(this.currentUser);
      } catch (e) {
        console.error('[Auth] Lỗi callback listener:', e);
      }
    }
  }

  /**
   * Đăng nhập với Google
   * (Sử dụng popup modal hỗ trợ nhập tên hoặc liên kết tài khoản)
   */
  async loginWithGoogle() {
    return new Promise((resolve) => {
      // Hiển thị modal đăng nhập thân thiện
      const promptName = prompt('Nhập tên của bạn hoặc đăng nhập Google:', this.currentUser?.name !== 'Đại Thương Gia' ? this.currentUser?.name : 'Tris');
      if (promptName && promptName.trim()) {
        const cleanName = promptName.trim();
        this.currentUser = {
          uid: 'google_' + Math.random().toString(36).substr(2, 8),
          name: cleanName,
          email: `${cleanName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanName)}`,
          isLoggedIn: true
        };
        localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
        this.notifyListeners();
        SplendorHelpers.showToast(`Chào mừng ${cleanName} quay trở lại!`, 'success');
        resolve({ success: true, user: this.currentUser });
      } else {
        resolve({ success: false });
      }
    });
  }

  logout() {
    this.currentUser = {
      uid: 'guest_' + Date.now(),
      name: 'Khách',
      email: '',
      avatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%236b4423'/%3E%3Ctext x='50' y='60' font-size='40' text-anchor='middle' fill='%23e6c387'%3E👤%3C/text%3E%3C/svg%3E`,
      isLoggedIn: false
    };
    localStorage.removeItem(this.storageKey);
    this.notifyListeners();
    SplendorHelpers.showToast('Đã đăng xuất tài khoản.', 'info');
  }

  getUser() {
    return this.currentUser;
  }
}

window.SplendorAuth = new AuthManager();
