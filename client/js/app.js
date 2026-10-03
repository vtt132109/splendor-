/**
 * Splendor Board Game - Ứng Dụng Chính & Điều Hướng (app.js)
 */

class SplendorApp {
  constructor() {
    this.currentScreen = 'home';
    this.setupMode = 'LOCAL'; // LOCAL hoặc AI
    this.selectedPlayerCount = 3;
    this.init();
  }

  init() {
    // 1. Khởi tạo Socket.IO
    SplendorSocket.init();

    // 2. Khởi tạo xác thực & header
    this.initAuthHeader();

    // 3. Khởi tạo thanh điều khiển Header (Âm thanh, Toàn màn hình, Luật chơi, Logo)
    this.initHeaderControls();
    this.initFullscreenControls();
    this.initOrientationControls();

    // 4. Khởi tạo Modal vào phòng
    this.initJoinModal();

    // 5. Khởi tạo Form thiết lập trận đấu (Setup screen)
    this.initSetupForm();

    // 6. Cập nhật thống kê ban đầu
    SplendorHomeScreen.updateStats();

    // 7. Xử lý Hash Routing
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();

    console.log('✨ Ứng dụng Board Game Splendor đã khởi tạo thành công!');
  }

  initAuthHeader() {
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const authBtn = document.getElementById('btn-auth-action');
    const userProfileBox = document.getElementById('user-profile-header');

    SplendorAuth.onAuthStateChanged((user) => {
      if (user) {
        if (avatarEl && user.avatar) avatarEl.src = user.avatar;
        if (nameEl) nameEl.textContent = user.name;
        if (authBtn) {
          authBtn.textContent = user.isLoggedIn ? (user.isGoogle ? 'Google' : 'Hồ Sơ') : 'Đăng Nhập';
          authBtn.title = user.isLoggedIn ? 'Xem & sửa hồ sơ thương gia' : 'Đăng nhập Google';
        }
      }
    });

    const openAuth = () => {
      if (window.SplendorSound) SplendorSound.playClick();
      SplendorAuth.openModal();
    };

    if (userProfileBox) {
      userProfileBox.addEventListener('click', openAuth);
      userProfileBox.style.cursor = 'pointer';
    }
  }

  initFullscreenControls() {
    const fsBtn = document.getElementById('btn-toggle-fullscreen');
    const boardFsBtn = document.getElementById('btn-board-fullscreen');
    const fsIcon = document.getElementById('header-fs-icon');
    const fsText = document.getElementById('header-fs-text');

    const updateFsIcons = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (fsIcon) fsIcon.textContent = isFs ? '🗗' : '⛶';
      if (fsText) fsText.textContent = isFs ? 'Thu Nhỏ' : 'Toàn Màn Hình';
      if (boardFsBtn) boardFsBtn.textContent = isFs ? '🗗' : '⛶';
      if (fsBtn) fsBtn.title = isFs ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình';
    };

    const toggleFs = () => {
      if (window.SplendorSound) SplendorSound.playClick();
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(err => {
            console.log('[Fullscreen] request error:', err);
            SplendorHelpers.showToast('Vui lòng cấp quyền toàn màn hình trên trình duyệt.', 'info');
          });
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(e => console.log(e));
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    };

    if (fsBtn) fsBtn.addEventListener('click', toggleFs);
    if (boardFsBtn) boardFsBtn.addEventListener('click', toggleFs);

    document.addEventListener('fullscreenchange', updateFsIcons);
    document.addEventListener('webkitfullscreenchange', updateFsIcons);
    updateFsIcons();
  }

  initOrientationControls() {
    const overlay = document.getElementById('orientation-overlay');
    const closeBtn = document.getElementById('btn-close-orientation');
    const ignoreBtn = document.getElementById('btn-ignore-orientation');
    const rotateFsBtn = document.getElementById('btn-rotate-fullscreen');

    const hideOverlay = () => {
      if (overlay) overlay.classList.add('hidden');
      sessionStorage.setItem('splendor_ignore_orientation', 'true');
    };

    if (closeBtn) closeBtn.addEventListener('click', hideOverlay);
    if (ignoreBtn) ignoreBtn.addEventListener('click', hideOverlay);

    if (rotateFsBtn) {
      rotateFsBtn.addEventListener('click', () => {
        hideOverlay();
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      });
    }
  }

  runGameCountdown(callback) {
    const overlay = document.getElementById('game-countdown-overlay');
    const numEl = document.getElementById('countdown-number');
    if (!overlay || !numEl) {
      if (callback) callback();
      return;
    }

    overlay.classList.remove('hidden');
    let count = 3;
    numEl.textContent = count;
    numEl.style.animation = 'none';
    numEl.offsetHeight; // trigger reflow
    numEl.style.animation = null;
    if (window.SplendorSound) SplendorSound.playTakeChip();

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.textContent = count;
        numEl.style.animation = 'none';
        numEl.offsetHeight;
        numEl.style.animation = null;
        if (window.SplendorSound) SplendorSound.playTakeChip();
      } else if (count === 0) {
        numEl.textContent = 'BẮT ĐẦU!';
        numEl.style.animation = 'none';
        numEl.offsetHeight;
        numEl.style.animation = null;
        if (window.SplendorSound) SplendorSound.playNobleVisit();
      } else {
        clearInterval(interval);
        overlay.classList.add('hidden');
        if (callback) callback();
      }
    }, 850);
  }

  initHeaderControls() {
    // Nút âm thanh
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      const updateIcon = () => {
        soundBtn.querySelector('.icon').textContent = SplendorSound.isMuted ? '🔇' : '🔊';
      };
      updateIcon();
      soundBtn.addEventListener('click', () => {
        const muted = SplendorSound.toggleMute();
        updateIcon();
        SplendorHelpers.showToast(muted ? 'Đã tắt âm thanh.' : 'Đã bật âm thanh.', 'info');
      });
    }

    // Nút luật chơi
    const rulesBtn = document.getElementById('btn-open-rules');
    const closeRulesBtn = document.getElementById('btn-close-rules');
    const rulesModal = document.getElementById('rules-modal');
    const rulesContent = document.getElementById('rules-content');

    if (rulesContent) {
      rulesContent.innerHTML = SplendorI18n.rulesHtml;
    }

    if (rulesBtn && rulesModal) {
      rulesBtn.addEventListener('click', () => {
        rulesModal.classList.remove('hidden');
      });
    }
    if (closeRulesBtn && rulesModal) {
      closeRulesBtn.addEventListener('click', () => {
        rulesModal.classList.add('hidden');
      });
      rulesModal.addEventListener('click', (e) => {
        if (e.target === rulesModal) rulesModal.classList.add('hidden');
      });
    }

    // Nút sao chép mã phòng trên header
    const copyBadgeBtn = document.getElementById('btn-copy-code');
    const codeDisplay = document.getElementById('room-code-display');
    if (copyBadgeBtn && codeDisplay) {
      copyBadgeBtn.addEventListener('click', () => {
        SplendorHelpers.copyToClipboard(codeDisplay.textContent, 'Đã sao chép mã phòng!');
      });
    }
  }

  initJoinModal() {
    const modal = document.getElementById('join-room-modal');
    const closeBtn = document.getElementById('btn-close-join');
    const submitBtn = document.getElementById('btn-submit-join');
    const input = document.getElementById('input-room-code');
    const errorMsg = document.getElementById('join-error-msg');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (submitBtn && input) {
      submitBtn.addEventListener('click', () => {
        const code = (input.value || '').trim().toUpperCase();
        if (code.length !== 6) {
          if (errorMsg) {
            errorMsg.textContent = 'Mã phòng phải gồm đúng 6 ký tự!';
            errorMsg.classList.remove('hidden');
          }
          return;
        }

        const user = SplendorAuth.getUser();
        SplendorSocket.joinRoom(code, user).then(res => {
          if (res.success) {
            modal.classList.add('hidden');
            this.showLobbyScreen(res.room);
          } else {
            if (errorMsg) {
              errorMsg.textContent = res.message || 'Mã phòng không hợp lệ.';
              errorMsg.classList.remove('hidden');
            }
          }
        });
      });
    }
  }

  initSetupForm() {
    const backBtn = document.getElementById('btn-setup-back');
    const startBtn = document.getElementById('btn-start-game-now');
    const selector = document.getElementById('player-count-selector');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showScreen('home');
      });
    }

    if (selector) {
      selector.querySelectorAll('.btn-count').forEach(btn => {
        btn.addEventListener('click', () => {
          selector.querySelectorAll('.btn-count').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedPlayerCount = parseInt(btn.dataset.count);
          this.renderSetupInputs();
        });
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const playerConfigs = this.collectSetupPlayerConfigs();
        window.lastGameConfig = { players: playerConfigs, mode: this.setupMode };
        this.showGameScreen();
        SplendorGameScreen.startNewGame(playerConfigs, this.setupMode);
      });
    }
  }

  showSetupScreen(mode = 'LOCAL') {
    this.setupMode = mode;
    const titleEl = document.getElementById('setup-title');
    if (titleEl) {
      titleEl.textContent = mode === 'AI' ? 'THIẾT LẬP ĐẤU VỚI MÁY (AI)' : 'THIẾT LẬP CHƠI CHUYỀN TAY (LOCAL)';
    }
    this.renderSetupInputs();
    this.showScreen('setup');
  }

  renderSetupInputs() {
    const container = document.getElementById('setup-players-inputs');
    if (!container) return;

    container.innerHTML = '';
    const me = SplendorAuth.getUser();

    for (let i = 0; i < this.selectedPlayerCount; i++) {
      const item = document.createElement('div');
      item.className = 'setup-player-item';

      if (i === 0) {
        // Người chơi 1 là người dùng hiện tại
        item.innerHTML = `
          <span style="font-weight:700;color:var(--gold-bright);">Người chơi 1:</span>
          <input type="text" class="setup-player-input" id="input-p1-name" value="${me.name}" placeholder="Nhập tên...">
          <span style="font-size:11px;color:var(--text-parchment-muted);">(Bạn)</span>
        `;
      } else {
        if (this.setupMode === 'AI') {
          // Người chơi i là AI
          const defaultDifficulties = ['easy', 'medium', 'hard'];
          const defaultDiff = defaultDifficulties[Math.min(i - 1, 2)];

          item.innerHTML = `
            <span style="font-weight:700;color:var(--text-parchment);">Người chơi ${i + 1} (Máy):</span>
            <input type="text" class="setup-player-input" id="input-p${i + 1}-name" value="Máy ${i}" placeholder="Tên máy...">
            <select class="setup-ai-select" id="select-p${i + 1}-diff">
              <option value="easy" ${defaultDiff === 'easy' ? 'selected' : ''}>Dễ (Tập Sự)</option>
              <option value="medium" ${defaultDiff === 'medium' ? 'selected' : ''}>Trung Bình (Chiến Thuật)</option>
              <option value="hard" ${defaultDiff === 'hard' ? 'selected' : ''}>Khó (Bậc Thầy)</option>
            </select>
          `;
        } else {
          // Người chơi i là người thật
          item.innerHTML = `
            <span style="font-weight:700;color:var(--text-parchment);">Người chơi ${i + 1}:</span>
            <input type="text" class="setup-player-input" id="input-p${i + 1}-name" value="Người chơi ${i + 1}" placeholder="Nhập tên...">
          `;
        }
      }

      container.appendChild(item);
    }
  }

  collectSetupPlayerConfigs() {
    const configs = [];
    const me = SplendorAuth.getUser();

    for (let i = 0; i < this.selectedPlayerCount; i++) {
      const nameInput = document.getElementById(`input-p${i + 1}-name`);
      const name = nameInput?.value?.trim() || (i === 0 ? me.name : `Người chơi ${i + 1}`);

      if (i === 0) {
        configs.push({
          id: me.uid,
          name,
          avatar: me.avatar,
          isAI: false
        });
      } else {
        if (this.setupMode === 'AI') {
          const diffSelect = document.getElementById(`select-p${i + 1}-diff`);
          const diff = diffSelect?.value || 'medium';
          configs.push({
            id: 'ai_' + (i + 1),
            name: `${name}`,
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=ai_${i + 1}_${diff}`,
            isAI: true,
            aiDifficulty: diff
          });
        } else {
          configs.push({
            id: 'local_p_' + (i + 1),
            name,
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
            isAI: false
          });
        }
      }
    }

    return configs;
  }

  showLobbyScreen(room) {
    SplendorLobbyScreen.updateRoom(room);
    this.showScreen('lobby');
  }

  startOnlineGame(room) {
    const configs = room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isAI: false
    }));

    const mySocketId = SplendorSocket.socket?.id;
    const myIdx = configs.findIndex(p => p.id === mySocketId);

    window.lastGameConfig = { players: configs, mode: 'ONLINE' };
    this.showGameScreen();
    SplendorGameScreen.startNewGame(configs, 'ONLINE', Math.max(0, myIdx));
  }

  showGameScreen() {
    this.showScreen('game');
    // Gợi ý xoay ngang màn hình nếu đang chơi trận đấu trên điện thoại ở chế độ dọc
    if (window.innerWidth <= 768 && window.innerHeight > window.innerWidth) {
      if (!sessionStorage.getItem('splendor_ignore_orientation')) {
        const overlay = document.getElementById('orientation-overlay');
        if (overlay) overlay.classList.remove('hidden');
      }
    }
  }

  openRulesModal() {
    const modal = document.getElementById('rules-modal');
    if (modal) modal.classList.remove('hidden');
  }

  showScreen(screenName) {
    this.currentScreen = screenName;
    window.location.hash = `#${screenName}`;

    document.querySelectorAll('.screen').forEach(el => {
      el.classList.remove('active');
    });

    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
      target.classList.add('active');
    }

    // Ẩn huy hiệu mã phòng nếu ở trang chủ
    if (screenName === 'home') {
      const roomBadge = document.getElementById('room-badge');
      if (roomBadge) roomBadge.classList.add('hidden');
    }
  }

  handleHashChange() {
    const hash = (window.location.hash || '#home').replace('#', '');
    if (['home', 'lobby', 'setup', 'game', 'result'].includes(hash)) {
      this.showScreen(hash);
    } else {
      this.showScreen('home');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.SplendorApp = new SplendorApp();
});
