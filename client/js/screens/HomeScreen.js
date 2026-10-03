/**
 * Splendor Board Game - Màn Hình Chính & Menu Điều Hướng (HomeScreen.js)
 */

class HomeScreen {
  constructor() {
    this.initEvents();
  }

  initEvents() {
    // 1. Chơi Online
    const btnOnline = document.getElementById('btn-mode-online');
    if (btnOnline) {
      btnOnline.addEventListener('click', () => {
        this.openOnlineChoiceModal();
      });
    }

    // 2. Chơi Local (Chuyền tay)
    const btnLocal = document.getElementById('btn-mode-local');
    if (btnLocal) {
      btnLocal.addEventListener('click', () => {
        window.SplendorApp.showSetupScreen('LOCAL');
      });
    }

    // 3. Đấu với máy (AI)
    const btnAI = document.getElementById('btn-mode-ai');
    if (btnAI) {
      btnAI.addEventListener('click', () => {
        window.SplendorApp.showSetupScreen('AI');
      });
    }

    // 4. Xem luật chơi
    const btnRules = document.getElementById('btn-mode-rules');
    if (btnRules) {
      btnRules.addEventListener('click', () => {
        window.SplendorApp.openRulesModal();
      });
    }
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

  /**
   * Mở hộp thoại lựa chọn Tạo Phòng hoặc Vào Phòng
   */
  openOnlineChoiceModal() {
    const user = SplendorAuth.getUser();
    const action = confirm(
      `CHẾ ĐỘ THI ĐẤU ONLINE:\n\n` +
      `Nhấn [OK] để TẠO PHÒNG MỚI (Lấy mã phòng 6 ký tự để gửi bạn bè).\n` +
      `Nhấn [HỦY / CANCEL] để NHẬP MÃ PHÒNG đang có.`
    );

    if (action) {
      // Tạo phòng mới
      SplendorSocket.createRoom(user, 4).then(res => {
        if (res.success) {
          window.SplendorApp.showLobbyScreen(res.room);
        } else {
          SplendorHelpers.showToast(res.message || 'Không thể tạo phòng.', 'error');
        }
      });
    } else {
      // Mở modal nhập mã phòng
      const joinModal = document.getElementById('join-room-modal');
      const input = document.getElementById('input-room-code');
      const errorMsg = document.getElementById('join-error-msg');
      if (joinModal && input) {
        input.value = '';
        if (errorMsg) errorMsg.classList.add('hidden');
        joinModal.classList.remove('hidden');
        input.focus();
      }
    }
  }
}

window.SplendorHomeScreen = new HomeScreen();
