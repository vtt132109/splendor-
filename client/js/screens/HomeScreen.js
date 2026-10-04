/**
 * Splendor Board Game - Màn Hình Chính & Menu Điều Hướng (HomeScreen.js)
 * Tích hợp Modal Sảnh Thi Đấu Trực Tuyến với hoạt ảnh và đo độ trễ Ping
 */

class HomeScreen {
  constructor() {
    this.selectedCreateSize = 4;
    this.initEvents();
    this.initOnlineChoiceModal();
  }

  initEvents() {
    // 1. Chơi Online
    const btnOnline = document.getElementById('btn-mode-online');
    if (btnOnline) {
      btnOnline.addEventListener('click', () => {
        if (window.SplendorSound) SplendorSound.playClick();
        const user = SplendorAuth.getUser();
        if (!user || !user.isLoggedIn || !user.isGoogle) {
          SplendorHelpers.showToast('Vui lòng đăng nhập Google để tham gia thi đấu Online!', 'info');
          SplendorAuth.handleGoogleButtonClick();
          return;
        }
        this.openOnlineChoiceModal();
      });
    }

    // 2. Chơi Local (Chuyền tay)
    const btnLocal = document.getElementById('btn-mode-local');
    if (btnLocal) {
      btnLocal.addEventListener('click', () => {
        if (window.SplendorSound) SplendorSound.playClick();
        window.SplendorApp.showSetupScreen('LOCAL');
      });
    }

    // 3. Đấu với máy (AI)
    const btnAI = document.getElementById('btn-mode-ai');
    if (btnAI) {
      btnAI.addEventListener('click', () => {
        if (window.SplendorSound) SplendorSound.playClick();
        window.SplendorApp.showSetupScreen('AI');
      });
    }

    // 4. Xem luật chơi
    const btnRules = document.getElementById('btn-mode-rules');
    if (btnRules) {
      btnRules.addEventListener('click', () => {
        if (window.SplendorSound) SplendorSound.playClick();
        window.SplendorApp.openRulesModal();
      });
    }
  }

  initOnlineChoiceModal() {
    const modal = document.getElementById('online-choice-modal');
    const closeBtn = document.getElementById('btn-close-online-choice');
    const sizeBtns = document.querySelectorAll('#create-room-size-btns .btn-size-chip');
    const btnCreate = document.getElementById('btn-action-create-room');
    const btnJoin = document.getElementById('btn-action-join-room');
    const inputCode = document.getElementById('input-online-room-code');

    const tabCreate = document.getElementById('tab-btn-create');
    const tabJoin = document.getElementById('tab-btn-join');
    const cardCreate = document.getElementById('card-create-room');
    const cardJoin = document.getElementById('card-join-room');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeOnlineChoiceModal());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeOnlineChoiceModal();
      });
    }

    // Chuyển Tab Tạo Phòng / Vào Phòng
    if (tabCreate && tabJoin) {
      tabCreate.addEventListener('click', () => {
        tabCreate.classList.add('active');
        tabJoin.classList.remove('active');
        if (cardCreate) cardCreate.classList.remove('tab-hidden');
        if (cardJoin) cardJoin.classList.add('tab-hidden');
        if (window.SplendorSound) SplendorSound.playClick();
      });

      tabJoin.addEventListener('click', () => {
        tabJoin.classList.add('active');
        tabCreate.classList.remove('active');
        if (cardJoin) cardJoin.classList.remove('tab-hidden');
        if (cardCreate) cardCreate.classList.add('tab-hidden');
        if (inputCode) setTimeout(() => inputCode.focus(), 100);
        if (window.SplendorSound) SplendorSound.playClick();
      });
    }

    // Chọn số người chơi khi tạo phòng
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCreateSize = parseInt(btn.dataset.size, 10) || 4;
        if (window.SplendorSound) SplendorSound.playClick();
      });
    });

    // Bấm Tạo Phòng Mới
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        const user = SplendorAuth.getUser();
        btnCreate.disabled = true;
        btnCreate.innerHTML = `<span>ĐANG KHỞI TẠO PHÒNG...</span>`;

        SplendorSocket.createRoom(user, this.selectedCreateSize).then(res => {
          btnCreate.disabled = false;
          btnCreate.innerHTML = `<span>TẠO PHÒNG HOÀNG GIA</span><span class="arrow-sparkle">➔</span>`;
          if (res.success) {
            this.closeOnlineChoiceModal();
            if (window.SplendorSound) SplendorSound.playNobleVisit();
            window.SplendorApp.showLobbyScreen(res.room);
          } else {
            SplendorHelpers.showToast(res.message || 'Không thể tạo phòng lúc này.', 'error');
          }
        });
      });
    }

    // Bấm Gia Nhập Phòng Bằng Mã
    if (btnJoin && inputCode) {
      const handleJoin = () => {
        const code = inputCode.value.trim().toUpperCase();
        const errorEl = document.getElementById('online-join-error');

        if (!code || code.length !== 6) {
          if (errorEl) {
            errorEl.textContent = 'Mã phòng phải gồm đúng 6 ký tự!';
            errorEl.classList.remove('hidden');
          }
          inputCode.focus();
          return;
        }

        if (errorEl) errorEl.classList.add('hidden');
        btnJoin.disabled = true;
        btnJoin.innerHTML = `<span>ĐANG KẾT NỐI...</span>`;

        const user = SplendorAuth.getUser();
        SplendorSocket.joinRoom(code, user).then(res => {
          btnJoin.disabled = false;
          btnJoin.innerHTML = `<span>GIA NHẬP BÀN</span><span class="arrow-sparkle">➔</span>`;
          if (res.success) {
            this.closeOnlineChoiceModal();
            if (window.SplendorSound) SplendorSound.playNobleVisit();
            window.SplendorApp.showLobbyScreen(res.room);
          } else {
            if (errorEl) {
              errorEl.textContent = res.message || 'Không tìm thấy phòng hoặc phòng đã đầy.';
              errorEl.classList.remove('hidden');
            }
            SplendorHelpers.showToast(res.message || 'Lỗi tham gia phòng.', 'error');
          }
        });
      };

      btnJoin.addEventListener('click', handleJoin);
      inputCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleJoin();
      });

      // Tự động chuyển ký tự in hoa khi gõ
      inputCode.addEventListener('input', () => {
        inputCode.value = inputCode.value.toUpperCase();
      });
    }
  }

  openOnlineChoiceModal() {
    const modal = document.getElementById('online-choice-modal');
    const inputCode = document.getElementById('input-online-room-code');
    const errorEl = document.getElementById('online-join-error');
    const pingBadge = document.getElementById('server-ping-badge');

    if (!modal) return;
    if (inputCode) inputCode.value = '';
    if (errorEl) errorEl.classList.add('hidden');

    // Mặc định về Tab Tạo Phòng
    const tabCreate = document.getElementById('tab-btn-create');
    const tabJoin = document.getElementById('tab-btn-join');
    const cardCreate = document.getElementById('card-create-room');
    const cardJoin = document.getElementById('card-join-room');
    if (tabCreate && tabJoin) {
      tabCreate.classList.add('active');
      tabJoin.classList.remove('active');
      if (cardCreate) cardCreate.classList.remove('tab-hidden');
      if (cardJoin) cardJoin.classList.add('tab-hidden');
    }

    // Đo ping realtime
    if (SplendorSocket.socket?.connected && pingBadge) {
      const start = Date.now();
      SplendorSocket.socket.emit('latency:ping', start);
      const pongHandler = (origTime) => {
        if (origTime === start) {
          const latency = Date.now() - start;
          pingBadge.textContent = `Ping: ${latency}ms`;
          SplendorSocket.socket.off('latency:pong', pongHandler);
        }
      };
      SplendorSocket.socket.on('latency:pong', pongHandler);
    }

    modal.classList.remove('hidden');
  }

  closeOnlineChoiceModal() {
    const modal = document.getElementById('online-choice-modal');
    if (modal) modal.classList.add('hidden');
  }

  updateStats() {
    const stats = SplendorHelpers.getUserStats();
    const gamesEl = document.getElementById('stat-total-games');
    const winsEl = document.getElementById('stat-total-wins');
    const rateEl = document.getElementById('stat-win-rate');

    if (gamesEl) gamesEl.textContent = stats.totalGames;
    if (winsEl) winsEl.textContent = stats.totalWins;
    if (rateEl) rateEl.textContent = `${stats.winRate}%`;
  }
}

window.SplendorHomeScreen = new HomeScreen();
