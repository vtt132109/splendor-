/**
 * Splendor Board Game - Màn Hình Phòng Chờ Online (LobbyScreen.js)
 * Tích hợp hiệu ứng sao chép ánh kim, slot nảy sinh động và đếm ngược chuyển trận
 */

class LobbyScreen {
  constructor() {
    this.currentRoom = null;
    this.initEvents();
  }

  initEvents() {
    const btnBack = document.getElementById('btn-lobby-back');
    const btnCopy = document.getElementById('btn-lobby-copy');
    const btnReady = document.getElementById('btn-lobby-ready');
    const btnStart = document.getElementById('btn-lobby-start');

    if (btnBack) {
      btnBack.addEventListener('click', () => {
        if (window.SplendorSound) SplendorSound.playClick();
        SplendorSocket.leaveRoom();
        window.SplendorApp.showScreen('home');
      });
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        if (this.currentRoom) {
          SplendorHelpers.copyToClipboard(this.currentRoom.code, `Đã sao chép mã phòng: ${this.currentRoom.code}`);
          if (window.SplendorSound) SplendorSound.playTakeChip();

          // Hiệu ứng nút đổi màu xanh lục và thông báo
          const originalText = btnCopy.textContent;
          btnCopy.classList.add('btn-copied-success');
          btnCopy.textContent = '✓ ĐÃ SAO CHÉP!';
          setTimeout(() => {
            btnCopy.classList.remove('btn-copied-success');
            btnCopy.textContent = originalText;
          }, 2000);
        }
      });
    }

    if (btnReady) {
      btnReady.addEventListener('click', () => {
        if (window.SplendorSound) SplendorSound.playClick();
        SplendorSocket.toggleReady();
      });
    }

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (this.currentRoom && this.currentRoom.players.length >= 2) {
          if (window.SplendorSound) SplendorSound.playClick();
          btnStart.disabled = true;
          btnStart.textContent = 'ĐANG KHỞI TẠO...';

          SplendorSocket.startGame().then(res => {
            if (res && res.success === false) {
              btnStart.disabled = false;
              btnStart.textContent = 'BẮT ĐẦU TRẬN ĐẤU';
              SplendorHelpers.showToast(res.message || 'Không thể bắt đầu trận đấu!', 'error');
            }
          });
        }
      });
    }

    // Lắng nghe cập nhật phòng từ Socket.IO
    SplendorSocket.on('room:updated', (room) => {
      this.updateRoom(room);
    });

    // Lắng nghe tín hiệu bắt đầu trận đấu từ máy chủ (đồng bộ toàn bộ phòng: PC & Điện thoại)
    SplendorSocket.on('game:started', (data) => {
      console.log('[Lobby] Nhận game:started từ máy chủ:', data);
      window.SplendorApp.runGameCountdown(() => {
        window.SplendorApp.startOnlineGameWithState(data.gameState);
      });
    });
  }

  updateRoom(room) {
    this.currentRoom = room;

    const codeEl = document.getElementById('lobby-room-code');
    const playersListEl = document.getElementById('lobby-players-list');
    const statusMsgEl = document.getElementById('lobby-status-msg');
    const readyBtn = document.getElementById('btn-lobby-ready');
    const startBtn = document.getElementById('btn-lobby-start');

    if (codeEl) codeEl.textContent = room.code;

    // Cập nhật huy hiệu mã phòng trên Header
    const roomBadge = document.getElementById('room-badge');
    const headerCode = document.getElementById('room-code-display');
    if (roomBadge && headerCode) {
      roomBadge.classList.remove('hidden');
      headerCode.textContent = room.code;
    }

    const mySocketId = SplendorSocket.socket?.id;
    const authUser = window.SplendorAuth?.getUser();
    const me = room.players.find(p => p.id === mySocketId || (authUser?.uid && p.uid === authUser.uid));
    const isHost = me?.isHost || false;

    // Cập nhật danh sách người chơi
    if (playersListEl) {
      playersListEl.innerHTML = '';

      for (let i = 0; i < room.maxPlayers; i++) {
        const player = room.players[i];
        const slotEl = document.createElement('div');

        if (player) {
          slotEl.className = 'lobby-player-slot occupied anim-slot-pop';
          slotEl.innerHTML = `
            <div class="lobby-player-info">
              <img class="lobby-avatar" src="${player.avatar || "assets/nobles/king.jpg"}" alt="">
              <div class="lobby-player-text">
                <div class="lobby-name-row">
                  <span class="lobby-player-name">${player.name}</span>
                  ${player.isHost ? '<span class="lobby-host-tag">CHỦ PHÒNG</span>' : ''}
                </div>
                ${player.email ? `<span class="lobby-player-email" title="${player.email}">✉ ${player.email}</span>` : ''}
              </div>
            </div>
            <div class="lobby-ready-badge ${player.isReady ? 'ready' : 'waiting'}">
              ${player.isReady ? '✓ ĐÃ SẴN SÀNG' : '⏳ CHỜ...'}
            </div>
          `;
        } else {
          slotEl.className = 'lobby-player-slot';
          slotEl.innerHTML = `
            <div class="lobby-player-info" style="opacity: 0.5;">
              <div class="lobby-avatar" style="border-style: dashed; display:flex; align-items:center; justify-content:center; color: var(--gold-light);">+</div>
              <span class="lobby-player-name">Đang chờ người chơi...</span>
            </div>
          `;
        }

        playersListEl.appendChild(slotEl);
      }
    }

    // Điều khiển nút Sẵn sàng & Bắt đầu
    if (readyBtn) {
      if (isHost) {
        readyBtn.classList.add('hidden');
      } else {
        readyBtn.classList.remove('hidden');
        readyBtn.textContent = me?.isReady ? 'HỦY SẴN SÀNG' : 'SẴN SÀNG';
      }
    }

    if (startBtn) {
      if (isHost) {
        startBtn.classList.remove('hidden');
        const allReady = room.players.length >= 2 && room.players.every(p => p.isReady);
        startBtn.disabled = !allReady;
        if (!startBtn.disabled) {
          startBtn.textContent = 'BẮT ĐẦU TRẬN ĐẤU';
        }

        if (room.players.length < 2) {
          if (statusMsgEl) statusMsgEl.textContent = 'Cần ít nhất 2 người chơi để bắt đầu trận đấu.';
        } else if (!allReady) {
          if (statusMsgEl) statusMsgEl.textContent = 'Đang chờ tất cả người chơi sẵn sàng...';
        } else {
          if (statusMsgEl) statusMsgEl.textContent = '✨ Mọi người đã sẵn sàng! Bấm nút để bắt đầu.';
        }
      } else {
        startBtn.classList.add('hidden');
        if (statusMsgEl) statusMsgEl.textContent = 'Đang chờ chủ phòng bắt đầu trận đấu...';
      }
    }
  }
}

window.SplendorLobbyScreen = new LobbyScreen();
