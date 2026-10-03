/**
 * Splendor Board Game - Màn Hình Phòng Chờ Online (LobbyScreen.js)
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
        SplendorSocket.leaveRoom();
        window.SplendorApp.showScreen('home');
      });
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        if (this.currentRoom) {
          SplendorHelpers.copyToClipboard(this.currentRoom.code, `Đã sao chép mã phòng: ${this.currentRoom.code}`);
        }
      });
    }

    if (btnReady) {
      btnReady.addEventListener('click', () => {
        SplendorSocket.toggleReady();
      });
    }

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (this.currentRoom && this.currentRoom.players.length >= 2) {
          // Bắt đầu game online
          window.SplendorApp.startOnlineGame(this.currentRoom);
        }
      });
    }

    // Lắng nghe cập nhật phòng từ Socket.IO
    SplendorSocket.on('room:updated', (room) => {
      this.updateRoom(room);
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
    const me = room.players.find(p => p.id === mySocketId);
    const isHost = me?.isHost || false;

    // Cập nhật danh sách người chơi
    if (playersListEl) {
      playersListEl.innerHTML = '';

      for (let i = 0; i < room.maxPlayers; i++) {
        const player = room.players[i];
        const slotEl = document.createElement('div');

        if (player) {
          slotEl.className = 'lobby-player-slot occupied';
          slotEl.innerHTML = `
            <div class="lobby-player-info">
              <img class="lobby-avatar" src="${player.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%236b4423'/%3E%3Ctext x='50' y='60' font-size='40' text-anchor='middle' fill='%23e6c387'%3E👤%3C/text%3E%3C/svg%3E"}" alt="">
              <div>
                <span class="lobby-player-name">${player.name}</span>
                ${player.isHost ? '<span class="lobby-host-tag">CHỦ PHÒNG</span>' : ''}
              </div>
            </div>
            <div class="lobby-ready-badge ${player.isReady ? 'ready' : 'waiting'}">
              ${player.isReady ? '✓ ĐÃ SẴN SÀNG' : '⏳ CHỜ...'}
            </div>
          `;
        } else {
          slotEl.className = 'lobby-player-slot';
          slotEl.innerHTML = `
            <div class="lobby-player-info" style="opacity: 0.4;">
              <div class="lobby-avatar" style="border-style: dashed; display:flex; align-items:center; justify-content:center;">+</div>
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

        if (room.players.length < 2) {
          if (statusMsgEl) statusMsgEl.textContent = 'Cần ít nhất 2 người chơi để bắt đầu trận đấu.';
        } else if (!allReady) {
          if (statusMsgEl) statusMsgEl.textContent = 'Đang chờ tất cả người chơi sẵn sàng...';
        } else {
          if (statusMsgEl) statusMsgEl.textContent = 'Mọi người đã sẵn sàng! Chủ phòng có thể bắt đầu ngay.';
        }
      } else {
        startBtn.classList.add('hidden');
        if (statusMsgEl) statusMsgEl.textContent = 'Đang chờ chủ phòng bắt đầu trận đấu...';
      }
    }
  }
}

window.SplendorLobbyScreen = new LobbyScreen();
