const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

const GameState = require('./GameState');
const GameEngine = require('./GameEngine');
const serverAuth = require('./auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Phục vụ thư mục static client
app.use(express.static(path.join(__dirname, '../client')));

// Phục vụ thư mục shared
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'Splendor Board Game',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint cấu hình Google OAuth Client ID cho client
app.get('/api/auth/config', (req, res) => {
  res.json({
    success: true,
    googleClientId: serverAuth.getGoogleClientId()
  });
});

app.post('/api/auth/config', (req, res) => {
  const { googleClientId } = req.body;
  if (googleClientId) {
    serverAuth.setGoogleClientId(googleClientId);
  }
  res.json({
    success: true,
    googleClientId: serverAuth.getGoogleClientId()
  });
});

// Endpoint xác minh Google OAuth Token (ID Token hoặc Access Token)
app.post('/api/auth/google/verify', async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;
    const result = await serverAuth.verifyGoogleToken({ idToken, accessToken });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Lưu trữ các phòng chơi (Game Rooms)
const rooms = new Map();

// Lưu trữ các bộ đếm thời gian ân hạn ngắt kết nối (tránh circular reference trên player object)
const disconnectTimers = new Map();

function getPublicRoomData(room) {
  if (!room) return null;
  return {
    code: room.code,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    status: room.status,
    createdAt: room.createdAt,
    players: (room.players || []).map(p => ({
      id: p.id,
      uid: p.uid,
      email: p.email || null,
      name: p.name,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      connected: p.connected
    }))
  };
}

// Helper: sinh mã phòng 6 ký tự ngẫu nhiên
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Bỏ các ký tự dễ nhầm: O, 0, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
  console.log(`[Socket] Người chơi kết nối: ${socket.id}`);

  // Ping - Pong kiểm tra độ trễ
  socket.on('latency:ping', (timestamp) => {
    socket.emit('latency:pong', timestamp);
  });

  // Tạo phòng mới
  socket.on('room:create', ({ player, maxPlayers = 4 }, callback) => {
    try {
      // Chặn tạo phòng nếu tài khoản Google đang hoạt động trên thiết bị khác
      if (player && (player.email || player.uid)) {
        const normEmail = (player.email || '').toLowerCase().trim();
        const normUid = (player.uid || '').trim();

        for (const [existingCode, r] of rooms) {
          const duplicateActive = r.players.find(p => 
            p.connected && 
            p.id !== socket.id &&
            ((normEmail && p.email && p.email.toLowerCase().trim() === normEmail) ||
             (normUid && p.uid && p.uid.trim() === normUid))
          );
          if (duplicateActive) {
            console.log(`[Bảo Mật] Từ chối tạo phòng mới: Tài khoản ${normEmail || normUid} đang hoạt động trong phòng ${existingCode}`);
            if (typeof callback === 'function') {
              callback({
                success: false,
                message: `⚠️ Tài khoản Google (${player.email || player.name}) hiện đang ở trong phòng ${existingCode} trên một thiết bị khác! Vui lòng thoát phòng cũ trước.`
              });
            }
            return;
          }
        }
      }

      let code;
      let attempts = 0;
      do {
        code = generateRoomCode();
        attempts++;
      } while (rooms.has(code) && attempts < 100);

      const roomData = {
        code,
        hostId: socket.id,
        maxPlayers: Math.min(Math.max(parseInt(maxPlayers) || 4, 2), 4),
        players: [
          {
            id: socket.id,
            uid: player?.uid || socket.id,
            email: player?.email || null,
            name: player?.name || 'Người chơi 1',
            avatar: player?.avatar || null,
            isHost: true,
            isReady: true,
            connected: true
          }
        ],
        gameState: null,
        status: 'LOBBY',
        createdAt: Date.now()
      };

      rooms.set(code, roomData);
      socket.join(code);
      socket.currentRoom = code;

      console.log(`[Phòng] Phòng mới được tạo: ${code} bởi ${player?.name || socket.id} (${player?.email || 'Khách'})`);

      if (typeof callback === 'function') {
        callback({ success: true, room: getPublicRoomData(roomData) });
      }

      socket.emit('room:updated', getPublicRoomData(roomData));
    } catch (err) {
      console.error('[Phòng] Lỗi tạo phòng:', err);
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Không thể tạo phòng, vui lòng thử lại.' });
      }
    }
  });

  // Vào phòng bằng mã
  socket.on('room:join', ({ code, player }, callback) => {
    try {
      const cleanCode = (code || '').trim().toUpperCase();
      const room = rooms.get(cleanCode);

      if (!room) {
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Mã phòng không tồn tại!' });
        }
        return;
      }

      // 1. Kiểm tra chặn 2 thiết bị khác nhau dùng CÙNG 1 tài khoản Google vào cùng phòng
      if (player && (player.email || player.uid)) {
        const normEmail = (player.email || '').toLowerCase().trim();
        const normUid = (player.uid || '').trim();

        const activeDuplicate = room.players.find(p => 
          p.connected && 
          p.id !== socket.id &&
          ((normEmail && p.email && p.email.toLowerCase().trim() === normEmail) ||
           (normUid && p.uid && p.uid.trim() === normUid))
        );

        if (activeDuplicate) {
          console.log(`[Bảo Mật] Chặn thiết bị thứ 2 cố tình vào phòng ${cleanCode} bằng cùng tài khoản Google: ${normEmail || normUid}`);
          if (typeof callback === 'function') {
            callback({
              success: false,
              message: `⚠️ Tài khoản Google (${player.email || player.name}) hiện đang hoạt động trên một thiết bị khác trong phòng này! Mỗi người chơi phải đăng nhập một tài khoản Google riêng biệt để thi đấu.`
            });
          }
          return;
        }

        // Kiểm tra xem tài khoản này có đang hoạt động ở phòng nào khác không
        for (const [otherCode, otherRoom] of rooms) {
          if (otherCode === cleanCode) continue;
          const duplicateOther = otherRoom.players.find(p =>
            p.connected &&
            p.id !== socket.id &&
            ((normEmail && p.email && p.email.toLowerCase().trim() === normEmail) ||
             (normUid && p.uid && p.uid.trim() === normUid))
          );
          if (duplicateOther) {
            console.log(`[Bảo Mật] Chặn vào phòng ${cleanCode}: Tài khoản ${normEmail || normUid} đang hoạt động ở phòng ${otherCode}`);
            if (typeof callback === 'function') {
              callback({
                success: false,
                message: `⚠️ Tài khoản Google (${player.email || player.name}) hiện đang tham gia phòng ${otherCode} trên một thiết bị khác! Vui lòng thoát phòng cũ trước.`
              });
            }
            return;
          }
        }
      }

      if (room.status !== 'LOBBY') {
        // Kiểm tra xem người này có phải là người chơi cũ đang kết nối lại vào ván đấu không
        const existingPlayer = room.players.find(p => (player?.uid && p.uid === player.uid) || p.name === player?.name);
        if (existingPlayer) {
          const timerKey = `${cleanCode}:${existingPlayer.uid || existingPlayer.name}`;
          if (disconnectTimers.has(timerKey)) {
            clearTimeout(disconnectTimers.get(timerKey));
            disconnectTimers.delete(timerKey);
          }
          const oldSocketId = existingPlayer.id;
          existingPlayer.id = socket.id;
          existingPlayer.connected = true;
          existingPlayer.disconnectedAt = null;

          // Cập nhật socket id trong gameState nếu có
          if (room.gameState && room.gameState.players) {
            const gp = room.gameState.players.find(p => p.id === oldSocketId || (player?.uid && p.id === player.uid) || p.name === existingPlayer.name);
            if (gp) gp.id = socket.id;
          }

          socket.join(cleanCode);
          socket.currentRoom = cleanCode;

          console.log(`[Phòng] Người chơi ${existingPlayer.name} đã kết nối lại ván đấu đang diễn ra trong phòng ${cleanCode}`);

          if (typeof callback === 'function') {
            callback({ success: true, room: getPublicRoomData(room), reconnected: true, gameState: room.gameState ? room.gameState.toJSON() : null });
          }

          io.to(cleanCode).emit('room:updated', getPublicRoomData(room));
          io.to(cleanCode).emit('room:player_reconnected', { playerName: existingPlayer.name, playerId: socket.id });
          if (room.gameState) {
            io.to(cleanCode).emit('game:state_updated', {
              gameState: room.gameState.toJSON(),
              lastAction: { actionType: 'RECONNECT', playerName: existingPlayer.name }
            });
            socket.emit('game:started', { gameState: room.gameState.toJSON() });
          }
          return;
        }

        if (typeof callback === 'function') {
          callback({ success: false, message: 'Trận đấu trong phòng này đã bắt đầu!' });
        }
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Phòng đã đủ số lượng người chơi!' });
        }
        return;
      }

      // Kiểm tra xem người chơi đã có trong phòng chưa (dành cho socket reconnect cùng thiết bị)
      const existingIdx = room.players.findIndex(p => p.id === socket.id);
      if (existingIdx !== -1) {
        room.players[existingIdx].id = socket.id;
        room.players[existingIdx].connected = true;
      } else {
        room.players.push({
          id: socket.id,
          uid: player?.uid || socket.id,
          email: player?.email || null,
          name: player?.name || `Người chơi ${room.players.length + 1}`,
          avatar: player?.avatar || null,
          isHost: false,
          isReady: false,
          connected: true
        });
      }

      socket.join(cleanCode);
      socket.currentRoom = cleanCode;

      console.log(`[Phòng] ${player?.name || socket.id} đã vào phòng ${cleanCode}`);

      if (typeof callback === 'function') {
        callback({ success: true, room: getPublicRoomData(room) });
      }

      io.to(cleanCode).emit('room:updated', getPublicRoomData(room));
    } catch (err) {
      console.error('[Phòng] Lỗi vào phòng:', err);
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Có lỗi xảy ra khi vào phòng.' });
      }
    }
  });

  // Người chơi đổi trạng thái sẵn sàng
  socket.on('room:toggle_ready', () => {
    const code = socket.currentRoom;
    if (!code || !rooms.has(code)) return;

    const room = rooms.get(code);
    const player = room.players.find(p => p.id === socket.id);
    if (player && !player.isHost) {
      player.isReady = !player.isReady;
      io.to(code).emit('room:updated', getPublicRoomData(room));
    }
  });

  // Bắt đầu game trong phòng (chỉ Host)
  socket.on('room:start', (data, callback) => {
    const code = socket.currentRoom;
    if (!code || !rooms.has(code)) return;
    const room = rooms.get(code);
    if (room.hostId !== socket.id) {
      if (typeof callback === 'function') callback({ success: false, message: 'Chỉ chủ phòng mới có quyền bắt đầu trận đấu!' });
      return;
    }
    if (room.players.length < 2) {
      if (typeof callback === 'function') callback({ success: false, message: 'Cần ít nhất 2 người chơi để bắt đầu.' });
      return;
    }

    const notReady = room.players.some(p => !p.isReady);
    if (notReady) {
      if (typeof callback === 'function') callback({ success: false, message: 'Tất cả người chơi phải sẵn sàng mới có thể bắt đầu!' });
      return;
    }

    try {
      const playerConfigs = room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isAI: false
      }));

      room.gameState = GameState.createNewGame(playerConfigs, 'ONLINE');
      room.gameEngine = new GameEngine(room.gameState);
      room.status = 'PLAYING';

      console.log(`[Game] Trận đấu phòng ${code} chính thức bắt đầu với ${room.players.length} người chơi!`);

      io.to(code).emit('room:updated', getPublicRoomData(room));
      io.to(code).emit('game:started', { gameState: room.gameState.toJSON() });
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      console.error('[Game] Lỗi khởi tạo trận đấu:', err);
      if (typeof callback === 'function') callback({ success: false, message: 'Lỗi bắt đầu trận đấu.' });
    }
  });

  // Nhận hành động game từ client
  socket.on('game:action', ({ actionType, actionData }, callback) => {
    const code = socket.currentRoom;
    if (!code || !rooms.has(code)) return;
    const room = rooms.get(code);
    if (!room.gameEngine || !room.gameState) return;

    const playerIndex = room.gameState.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;

    let result = null;
    try {
      switch (actionType) {
        case 'TAKE_THREE_GEMS':
          result = room.gameEngine.takeThreeGems(playerIndex, actionData.gems);
          break;
        case 'TAKE_TWO_SAME_GEMS':
          result = room.gameEngine.takeTwoSameGems(playerIndex, actionData.gem);
          break;
        case 'RESERVE_CARD':
          result = room.gameEngine.reserveCard(playerIndex, actionData);
          break;
        case 'PURCHASE_CARD':
          result = room.gameEngine.purchaseCard(playerIndex, actionData);
          break;
        case 'DISCARD_TOKENS':
          result = room.gameEngine.discardTokens(playerIndex, actionData.tokens);
          break;
        case 'SELECT_NOBLE':
          result = room.gameEngine.selectNoble(playerIndex, actionData.nobleId);
          break;
        default:
          result = { valid: false, error: 'Hành động không xác định.' };
      }

      if (result && result.valid === false) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        socket.emit('game:action_error', { error: result.error });
        return;
      }

      io.to(code).emit('game:state_updated', {
        gameState: room.gameState.toJSON(),
        lastAction: { actionType, playerIndex, result }
      });

      if (typeof callback === 'function') callback({ success: true, result });
    } catch (err) {
      console.error('[Game Action] Lỗi xử lý:', err);
      if (typeof callback === 'function') callback({ success: false, error: 'Lỗi máy chủ khi xử lý hành động.' });
    }
  });

  // Rời phòng chủ động
  socket.on('room:leave', () => {
    handleLeaveRoom(socket, true);
  });

  // Ngắt kết nối socket (mất mạng, đóng tab, reload)
  socket.on('disconnect', () => {
    console.log(`[Socket] Ngắt kết nối: ${socket.id}`);
    handleLeaveRoom(socket, false);
  });
});

function handleLeaveRoom(socket, isExplicitLeave = false) {
  const code = socket.currentRoom;
  if (!code || !rooms.has(code)) return;

  const room = rooms.get(code);
  const player = room.players.find(p => p.id === socket.id);
  if (!player) return;

  // Nếu đang trong trận đấu VÀ KHÔNG PHẢI người chơi tự bấm nút Rời phòng (tức là chỉ rớt mạng/reload)
  if (room.status === 'PLAYING' && !isExplicitLeave) {
    player.connected = false;
    player.disconnectedAt = Date.now();
    socket.leave(code);
    socket.currentRoom = null;

    console.log(`[Phòng] Người chơi ${player.name} bị ngắt kết nối trong trận đấu ${code}. Bắt đầu ân hạn 60s.`);

    io.to(code).emit('room:updated', getPublicRoomData(room));
    io.to(code).emit('room:player_disconnected', {
      playerId: player.id,
      playerName: player.name,
      reconnectTimeout: 60000
    });

    const timerKey = `${code}:${player.uid || player.name}`;
    if (disconnectTimers.has(timerKey)) {
      clearTimeout(disconnectTimers.get(timerKey));
      disconnectTimers.delete(timerKey);
    }

    const timer = setTimeout(() => {
      disconnectTimers.delete(timerKey);
      if (!player.connected) {
        console.log(`[Phòng] Hết hạn chờ kết nối lại: ${player.name} trong phòng ${code}`);
        io.to(code).emit('room:player_left', { playerName: player.name, timedOut: true });

        // Nếu tất cả người chơi đều ngắt kết nối, xóa phòng
        const activePlayers = room.players.filter(p => p.connected);
        if (activePlayers.length === 0) {
          rooms.delete(code);
          console.log(`[Phòng] Đã xóa phòng không còn người chơi: ${code}`);
        }
      }
    }, 60000);
    disconnectTimers.set(timerKey, timer);

    return;
  }

  // Ở Lobby hoặc người chơi chủ động bấm nút Rời phòng
  const playerIdx = room.players.findIndex(p => p.id === socket.id);
  if (playerIdx !== -1) {
    const [leavingPlayer] = room.players.splice(playerIdx, 1);
    const timerKey = `${code}:${leavingPlayer.uid || leavingPlayer.name}`;
    if (disconnectTimers.has(timerKey)) {
      clearTimeout(disconnectTimers.get(timerKey));
      disconnectTimers.delete(timerKey);
    }
    socket.leave(code);
    socket.currentRoom = null;

    console.log(`[Phòng] ${leavingPlayer.name} đã rời phòng ${code}`);

    // Nếu không còn ai, xóa phòng
    if (room.players.length === 0) {
      rooms.delete(code);
      console.log(`[Phòng] Đã xóa phòng trống: ${code}`);
    } else {
      // Nếu chủ phòng rời đi, chuyển quyền cho người tiếp theo
      if (leavingPlayer.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
        room.players[0].isReady = true;
        room.hostId = room.players[0].id;
      }
      io.to(code).emit('room:updated', getPublicRoomData(room));
      io.to(code).emit('room:player_left', { playerName: leavingPlayer.name });
    }
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ======================================================
  🎲 Board Game Splendor Server đang chạy!
  👉 Truy cập trình duyệt: http://localhost:${PORT}
  👉 API Health Check:   http://localhost:${PORT}/api/health
  ======================================================
  `);
});
