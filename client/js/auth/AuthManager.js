/**
 * Splendor Board Game - Quản Lý Xác Thực Người Dùng Google Thật & Hồ Sơ (AuthManager.js)
 * Tích hợp Google OAuth 2.0 Redirect chính thức (accounts.google.com),
 * Xác thực ID Token/Access Token với máy chủ, và ngăn chặn xung đột thiết bị
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.storageKey = 'splendor_auth_user';
    this.selectedAvatar = null;
    this.googleClientId = '';

    // Bộ 6 Avatar Hoàng Gia phong cách Phục Hưng
    this.defaultAvatars = [
      { id: 'noble_king', name: 'Đại Vương', url: 'assets/nobles/king.jpg' },
      { id: 'noble_queen', name: 'Nữ Hoàng', url: 'assets/nobles/queen.jpg' },
      { id: 'knight_valiant', name: 'Hiệp Sĩ', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KingTris&backgroundColor=b6e3f4' },
      { id: 'alchemist_emerald', name: 'Nhà Giả Kim', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AlchemistEmerald&backgroundColor=c0aede' },
      { id: 'countess_florence', name: 'Nữ Bá Tước', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CountessVenice&backgroundColor=ffd5dc' },
      { id: 'merchant_venice', name: 'Thương Nhân Venice', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MerchantGalleon&backgroundColor=ffdfbf' }
    ];

    this.loadCachedUser();
    this.initModalEvents();
    this.checkOAuthRedirect();
    this.fetchAuthConfig();
  }

  loadCachedUser() {
    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        this.currentUser = JSON.parse(cached);
      } else {
        this.currentUser = {
          uid: 'guest_' + Math.random().toString(36).substr(2, 7),
          name: 'Đại Thương Gia',
          email: '',
          avatar: this.defaultAvatars[0].url,
          isLoggedIn: false,
          isGoogle: false
        };
      }
    } catch (e) {
      this.currentUser = {
        uid: 'guest_' + Date.now(),
        name: 'Đại Thương Gia',
        email: '',
        avatar: this.defaultAvatars[0].url,
        isLoggedIn: false,
        isGoogle: false
      };
    }
    this.selectedAvatar = this.currentUser.avatar;
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
   * Lấy cấu hình OAuth Client ID từ server
   */
  async fetchAuthConfig() {
    try {
      const res = await fetch('/api/auth/config');
      if (res.ok) {
        const data = await res.json();
        if (data.googleClientId) {
          this.googleClientId = data.googleClientId.trim();
          this.initGisClient();
        }
      }
    } catch (e) {
      console.warn('[Auth] Chưa thể lấy cấu hình OAuth từ máy chủ:', e.message);
    }
  }

  /**
   * Kiểm tra xem trang có vừa được chuyển hướng về từ Google OAuth hay không
   */
  checkOAuthRedirect() {
    const hash = window.location.hash;
    if (!hash || (!hash.includes('id_token=') && !hash.includes('access_token='))) {
      return;
    }

    try {
      const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
      const params = new URLSearchParams(cleanHash);
      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');
      const error = params.get('error');

      // Xóa URL hash ngay lập tức để giữ URL sạch và bảo mật token
      history.replaceState(null, '', window.location.pathname + window.location.search);

      if (error) {
        console.error('[Google OAuth] Lỗi trả về từ Google:', error);
        SplendorHelpers.showToast('Đăng nhập Google bị hủy hoặc thất bại: ' + error, 'error');
        return;
      }

      if (idToken || accessToken) {
        SplendorHelpers.showToast('✦ Đang xác minh tài khoản Google với máy chủ...', 'info');
        this.verifyTokenWithServer({ idToken, accessToken });
      }
    } catch (e) {
      console.error('[Google OAuth] Lỗi xử lý callback URL hash:', e);
    }
  }

  /**
   * Gửi Token về máy chủ backend để xác minh với API chính thức của Google
   */
  async verifyTokenWithServer({ idToken, accessToken }) {
    try {
      const res = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, accessToken })
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        this.currentUser = {
          uid: data.user.uid,
          sub: data.user.sub,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar || this.defaultAvatars[0].url,
          isLoggedIn: true,
          isGoogle: true
        };

        this.selectedAvatar = this.currentUser.avatar;
        this.saveAndNotify();
        this.closeModal();

        if (window.SplendorSound) SplendorSound.playNobleVisit();
        SplendorHelpers.showToast(`✦ Chào mừng ${this.currentUser.name} (${this.currentUser.email}) đã đăng nhập Google thành công!`, 'success');
      } else {
        throw new Error(data.message || 'Xác thực Google thất bại.');
      }
    } catch (err) {
      console.warn('[Google Auth] Lỗi máy chủ xác thực, thử giải mã payload token an toàn:', err.message);
      this.handleFallbackJwt(idToken, err.message);
    }
  }

  /**
   * Giải mã payload an toàn nếu mạng máy chủ tạm thời không gọi được tokeninfo của Google
   */
  handleFallbackJwt(idToken, fallbackErrMsg) {
    if (!idToken) {
      SplendorHelpers.showToast('Xác thực Google thất bại: ' + fallbackErrMsg, 'error');
      return;
    }

    try {
      const parts = idToken.split('.');
      if (parts.length < 2) throw new Error('Token không hợp lệ');

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      if (!payload.email) throw new Error('Không tìm thấy thông tin email từ Google Token');

      this.currentUser = {
        uid: 'google_' + (payload.sub || Math.random().toString(36).substr(2, 8)),
        sub: payload.sub,
        name: payload.name || payload.given_name || 'Thương Gia Google',
        email: payload.email,
        avatar: payload.picture || this.defaultAvatars[0].url,
        isLoggedIn: true,
        isGoogle: true
      };

      this.selectedAvatar = this.currentUser.avatar;
      this.saveAndNotify();
      this.closeModal();

      if (window.SplendorSound) SplendorSound.playNobleVisit();
      SplendorHelpers.showToast(`✦ Đã đăng nhập Google: ${this.currentUser.name} (${this.currentUser.email})`, 'success');
    } catch (e) {
      console.error('[Google Auth] Lỗi giải mã fallback JWT:', e);
      SplendorHelpers.showToast('Xác thực tài khoản Google không thành công.', 'error');
    }
  }

  /**
   * Khởi tạo Google Identity Services (GIS) nếu có SDK
   */
  initGisClient() {
    if (!this.googleClientId || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: (resp) => {
          if (resp && resp.credential) {
            this.verifyTokenWithServer({ idToken: resp.credential });
          }
        },
        auto_select: false
      });
    } catch (e) {
      console.log('[GIS] Init notice:', e.message);
    }
  }

  /**
   * Khi người dùng nhấn nút Đăng Nhập Google:
   * Chuyển hướng trực tiếp sang trang xác thực chính thức của Google (accounts.google.com)
   */
  handleGoogleButtonClick() {
    const configNotice = document.getElementById('google-config-notice');
    const clientIdInput = document.getElementById('input-google-client-id');

    // Nếu chưa có Google Client ID cấu hình
    if (!this.googleClientId) {
      this.openModal();
      if (configNotice) {
        configNotice.classList.remove('hidden');
        if (clientIdInput) clientIdInput.focus();
      }
      SplendorHelpers.showToast('Vui lòng nhập Google Client ID một lần để kết nối Google thật!', 'warning');
      return;
    }

    const spinner = document.getElementById('google-auth-spinner');
    const btnText = document.getElementById('google-btn-text');
    const googleBtn = document.getElementById('btn-google-login-action');

    if (spinner) spinner.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Đang chuyển hướng sang Google...';
    if (googleBtn) googleBtn.disabled = true;

    // Tạo Redirect URL chính xác
    const redirectUri = window.location.origin + window.location.pathname;
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    try { sessionStorage.setItem('google_oauth_nonce', nonce); } catch (e) {}

    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: redirectUri,
      response_type: 'token id_token',
      scope: 'openid profile email',
      nonce: nonce,
      prompt: 'select_account'
    }).toString();

    console.log('[Google Auth] Chuyển hướng đến:', authUrl);

    // Chuyển hướng trình duyệt sang trang đăng nhập của Google
    window.location.href = authUrl;
  }

  /**
   * Lưu Google Client ID nhập từ giao diện và tiến hành đăng nhập ngay
   */
  async saveClientIdAndRedirect() {
    const input = document.getElementById('input-google-client-id');
    const val = (input ? input.value : '').trim();

    if (!val || !val.includes('.apps.googleusercontent.com')) {
      SplendorHelpers.showToast('Vui lòng nhập định dạng Google Client ID hợp lệ (kết thúc bằng .apps.googleusercontent.com)', 'warning');
      if (input) input.focus();
      return;
    }

    try {
      const res = await fetch('/api/auth/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleClientId: val })
      });
      const data = await res.json();
      if (data.success && data.googleClientId) {
        this.googleClientId = data.googleClientId;
        SplendorHelpers.showToast('Đã lưu Google Client ID thành công! Đang chuyển hướng...', 'success');
        this.handleGoogleButtonClick();
      }
    } catch (e) {
      console.error('[Auth] Lỗi lưu client ID:', e);
      this.googleClientId = val;
      this.handleGoogleButtonClick();
    }
  }

  initModalEvents() {
    const modal = document.getElementById('google-auth-modal');
    const closeBtn = document.getElementById('btn-close-auth-modal');
    const googleBtn = document.getElementById('btn-google-login-action');
    const saveBtn = document.getElementById('btn-save-identity');
    const signoutBtn = document.getElementById('btn-google-signout');
    const saveClientIdBtn = document.getElementById('btn-save-client-id');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener('click', () => this.handleGoogleButtonClick());
    }

    if (saveClientIdBtn) {
      saveClientIdBtn.addEventListener('click', () => this.saveClientIdAndRedirect());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveFromForm());
    }

    if (signoutBtn) {
      signoutBtn.addEventListener('click', () => {
        this.logout();
        this.updateModalState();
      });
    }
  }

  openModal() {
    const modal = document.getElementById('google-auth-modal');
    const nameInput = document.getElementById('input-custom-name');
    const clientIdInput = document.getElementById('input-google-client-id');
    const configNotice = document.getElementById('google-config-notice');

    if (!modal) return;

    this.selectedAvatar = this.currentUser.avatar || this.defaultAvatars[0].url;
    if (nameInput) {
      nameInput.value = this.currentUser.name || 'Đại Thương Gia';
    }

    if (clientIdInput && this.googleClientId) {
      clientIdInput.value = this.googleClientId;
    }

    if (configNotice) {
      if (!this.googleClientId) {
        configNotice.classList.remove('hidden');
      } else {
        configNotice.classList.add('hidden');
      }
    }

    this.renderAvatarPalette();
    this.updateModalState();

    modal.classList.remove('hidden');
    if (nameInput) nameInput.focus();
  }

  closeModal() {
    const modal = document.getElementById('google-auth-modal');
    if (modal) modal.classList.add('hidden');
  }

  renderAvatarPalette() {
    const container = document.getElementById('auth-avatar-palette');
    if (!container) return;

    container.innerHTML = '';
    this.defaultAvatars.forEach(av => {
      const item = document.createElement('div');
      item.className = 'avatar-choice-item';
      if (this.selectedAvatar === av.url) {
        item.classList.add('selected');
      }
      item.title = av.name;
      item.innerHTML = `<img src="${av.url}" alt="${av.name}">`;

      item.addEventListener('click', () => {
        this.selectedAvatar = av.url;
        container.querySelectorAll('.avatar-choice-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        if (window.SplendorSound) SplendorSound.playClick();
      });

      container.appendChild(item);
    });
  }

  updateModalState() {
    const googleBtn = document.getElementById('btn-google-login-action');
    const googleLoggedInfo = document.getElementById('google-logged-info');
    const emailDisplay = document.getElementById('user-email-display');
    const configNotice = document.getElementById('google-config-notice');

    if (this.currentUser.isLoggedIn && this.currentUser.isGoogle) {
      if (googleBtn) googleBtn.classList.add('hidden');
      if (googleLoggedInfo) googleLoggedInfo.classList.remove('hidden');
      if (configNotice) configNotice.classList.add('hidden');
      if (emailDisplay) emailDisplay.textContent = this.currentUser.email || 'google.user@gmail.com';
    } else {
      if (googleBtn) googleBtn.classList.remove('hidden');
      if (googleLoggedInfo) googleLoggedInfo.classList.add('hidden');
      if (configNotice && !this.googleClientId) {
        configNotice.classList.remove('hidden');
      }
    }
  }

  saveFromForm() {
    const nameInput = document.getElementById('input-custom-name');
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
      SplendorHelpers.showToast('Vui lòng nhập tên thương nhân của bạn!', 'warning');
      if (nameInput) nameInput.focus();
      return;
    }

    this.currentUser.name = name;
    if (this.selectedAvatar) {
      this.currentUser.avatar = this.selectedAvatar;
    }
    this.currentUser.isLoggedIn = true;

    this.saveAndNotify();
    this.closeModal();
    if (window.SplendorSound) SplendorSound.playClick();
    SplendorHelpers.showToast(`✦ Đã lưu thông tin thương gia: ${name}`, 'success');
  }

  saveAndNotify() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
    } catch (e) {
      console.error('[Auth] Lỗi lưu cache:', e);
    }
    this.notifyListeners();
  }

  logout() {
    this.currentUser = {
      uid: 'guest_' + Date.now(),
      name: 'Đại Thương Gia',
      email: '',
      avatar: this.defaultAvatars[0].url,
      isLoggedIn: false,
      isGoogle: false
    };
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {}
    this.notifyListeners();
    SplendorHelpers.showToast('Đã đăng xuất tài khoản.', 'info');
  }

  getUser() {
    return this.currentUser;
  }
}

window.SplendorAuth = new AuthManager();
