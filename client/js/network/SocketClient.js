/**
 * Splendor Board Game - Trình Điều Khiển Socket.IO Phía Client (SocketClient.js)
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.latency = 0;
    this.eventHandlers = new Map();
  }

  init() {
    if (typeof io === 'undefined') {
      console.warn('[Socket] Thư viện Socket.IO chưa sẵn sàng (chế độ offline).');
      return;
    }

    try {
      this.socket = io({
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('[Socket] Đã kết nối đến máy chủ Splendor:', this.socket.id);
        this.emitLocal('connected', { id: this.socket.id });
        this.measureLatency();
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log('[Socket] Mất kết nối máy chủ:', reason);
        this.emitLocal('disconnected', { reason });
        SplendorHelpers.showToast('Mất kết nối máy chủ, đang tự động kết nối lại...', 'warning');
      });

      this.socket.on('room:updated', (room) => {
        this.emitLocal('room:updated', room);
      });

      this.socket.on('room:player_left', (data) => {
        SplendorHelpers.showToast(`${data.playerName} đã rời phòng.`, 'info');
        this.emitLocal('room:player_left', data);
      });

      this.socket.on('game:state_updated', (gameState) => {
        this.emitLocal('game:state_updated', gameState);
      });

      this.socket.on('latency:pong', (start) => {
        this.latency = Date.now() - start;
      });

    } catch (err) {
      console.error('[Socket] Lỗi khởi tạo socket:', err);
    }
  }

  measureLatency() {
    if (this.socket && this.isConnected) {
      this.socket.emit('latency:ping', Date.now());
    }
  }

  createRoom(player, maxPlayers = 4) {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, message: 'Chưa kết nối máy chủ.' });
        return;
      }
      this.socket.emit('room:create', { player, maxPlayers }, resolve);
    });
  }

  joinRoom(code, player) {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, message: 'Chưa kết nối máy chủ.' });
        return;
      }
      this.socket.emit('room:join', { code, player }, resolve);
    });
  }

  toggleReady() {
    if (this.socket) {
      this.socket.emit('room:toggle_ready');
    }
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.emit('room:leave');
    }
  }

  sendGameAction(actionType, actionData) {
    if (this.socket) {
      this.socket.emit('game:action', { actionType, actionData });
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emitLocal(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    for (const h of handlers) {
      try {
        h(data);
      } catch (e) {
        console.error(`[Socket] Lỗi xử lý sự kiện nội bộ ${event}:`, e);
      }
    }
  }
}

window.SplendorSocket = new SocketClient();
