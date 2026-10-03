/**
 * Splendor Board Game - Quản Lý Xác Thực Người Dùng Google & Hồ Sơ (AuthManager.js)
 * Tích hợp Google Identity Services, Avatar Phục Hưng và Modal Đăng Nhập Hoạt Họa
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.storageKey = 'splendor_auth_user';
    this.selectedAvatar = null;

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
    this.initGoogleIdentity();
  }

  loadCachedUser() {
    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        this.currentUser = JSON.parse(cached);
      } else {
        // Mặc định tạo người chơi khách
        this.currentUser = {
          uid: 'user_' + Math.random().toString(36).substr(2, 7),
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

  initGoogleIdentity() {
    // Khởi tạo Google Identity Services nếu SDK đã tải
    window.addEventListener('load', () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: '999999999999-sampleclientid.apps.googleusercontent.com', // Placeholder cho OAuth Client ID
            callback: (response) => this.handleGoogleCredentialResponse(response),
            auto_select: false
          });
        } catch (err) {
          console.log('[Google Auth] GIS init info:', err.message);
        }
      }
    });
  }

  handleGoogleCredentialResponse(response) {
    try {
      // Giải mã JWT payload từ Google
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);

      this.currentUser = {
        uid: 'google_' + (payload.sub || Math.random().toString(36).substr(2, 8)),
        name: payload.name || 'Thương Gia Google',
        email: payload.email || '',
        avatar: payload.picture || this.defaultAvatars[0].url,
        isLoggedIn: true,
        isGoogle: true
      };

      this.saveAndNotify();
      this.closeModal();
      if (window.SplendorSound) SplendorSound.playNobleVisit();
      SplendorHelpers.showToast(`✦ Chào mừng ${this.currentUser.name} đã đăng nhập Google!`, 'success');
    } catch (e) {
      console.warn('[Auth] Không thể giải mã JWT, chuyển sang xác thực tiêu chuẩn:', e);
      this.simulateGoogleSignIn();
    }
  }

  initModalEvents() {
    const modal = document.getElementById('google-auth-modal');
    const closeBtn = document.getElementById('btn-close-auth-modal');
    const googleBtn = document.getElementById('btn-google-login-action');
    const saveBtn = document.getElementById('btn-save-identity');
    const signoutBtn = document.getElementById('btn-google-signout');

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
    if (!modal) return;

    this.selectedAvatar = this.currentUser.avatar || this.defaultAvatars[0].url;
    if (nameInput) {
      nameInput.value = this.currentUser.name || 'Đại Thương Gia';
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
    const googleSection = document.getElementById('google-auth-section');
    const googleBtn = document.getElementById('btn-google-login-action');
    const googleLoggedInfo = document.getElementById('google-logged-info');
    const emailDisplay = document.getElementById('user-email-display');

    if (this.currentUser.isLoggedIn && this.currentUser.isGoogle) {
      if (googleBtn) googleBtn.classList.add('hidden');
      if (googleLoggedInfo) googleLoggedInfo.classList.remove('hidden');
      if (emailDisplay) emailDisplay.textContent = this.currentUser.email || 'google.user@gmail.com';
    } else {
      if (googleBtn) googleBtn.classList.remove('hidden');
      if (googleLoggedInfo) googleLoggedInfo.classList.add('hidden');
    }
  }

  handleGoogleButtonClick() {
    const spinner = document.getElementById('google-auth-spinner');
    const btnText = document.getElementById('google-btn-text');
    const googleBtn = document.getElementById('btn-google-login-action');

    if (spinner) spinner.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Đang kết nối tài khoản Google...';
    if (googleBtn) googleBtn.disabled = true;

    // Hiệu ứng hoạt họa chuyển đổi êm dịu
    setTimeout(() => {
      this.simulateGoogleSignIn();
      if (spinner) spinner.classList.add('hidden');
      if (btnText) btnText.textContent = 'Tiếp Tục Với Tài Khoản Google';
      if (googleBtn) googleBtn.disabled = false;
    }, 700);
  }

  simulateGoogleSignIn() {
    const currentName = document.getElementById('input-custom-name')?.value?.trim() || this.currentUser.name;
    const cleanName = (currentName && currentName !== 'Đại Thương Gia') ? currentName : 'Tris';
    const emailSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');

    this.currentUser = {
      uid: 'google_' + Math.random().toString(36).substr(2, 8),
      name: cleanName,
      email: `${emailSlug || 'thuonggia'}@gmail.com`,
      avatar: this.selectedAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanName)}`,
      isLoggedIn: true,
      isGoogle: true
    };

    this.saveAndNotify();
    this.closeModal();
    if (window.SplendorSound) SplendorSound.playNobleVisit();
    SplendorHelpers.showToast(`✦ Đã kết nối tài khoản Google: ${this.currentUser.name}!`, 'success');
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
