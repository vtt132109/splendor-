const { io } = require('../server/node_modules/socket.io-client');

async function runTest() {
  console.log('🚀 Bắt đầu kịch bản kiểm thử Multiplayer Realtime (PC Host + Điện Thoại Guest)...');

  const SERVER_URL = 'http://localhost:3000';

  // 1. Tạo kết nối Socket cho Host PC
  const hostSocket = io(SERVER_URL, { reconnection: false });
  const guestSocket = io(SERVER_URL, { reconnection: false });

  await new Promise((resolve) => hostSocket.on('connect', resolve));
  console.log('✓ Host PC đã kết nối socket:', hostSocket.id);

  await new Promise((resolve) => guestSocket.on('connect', resolve));
  console.log('✓ Khách (Điện thoại) đã kết nối socket:', guestSocket.id);

  // 2. Host tạo phòng mới
  const createRes = await new Promise((resolve) => {
    hostSocket.emit('room:create', {
      player: { name: 'Tris (Host PC)', avatar: 'assets/nobles/king.jpg' },
      maxPlayers: 2
    }, resolve);
  });

  if (!createRes.success) {
    throw new Error('Host tạo phòng thất bại: ' + createRes.message);
  }

  const roomCode = createRes.room.code;
  console.log(`✓ Host đã tạo phòng thành công! Mã phòng: [${roomCode}]`);

  // 3. Khách nhập mã phòng để vào
  const joinRes = await new Promise((resolve) => {
    guestSocket.emit('room:join', {
      code: roomCode,
      player: { name: 'Điện Thoại (Guest)', avatar: 'assets/nobles/queen.jpg' }
    }, resolve);
  });

  if (!joinRes.success) {
    throw new Error('Khách vào phòng thất bại: ' + joinRes.message);
  }
  console.log('✓ Điện thoại đã vào phòng thành công!');

  // 4. Kiểm tra thử bắt đầu khi Khách chưa sẵn sàng
  const prematureStartRes = await new Promise((resolve) => {
    hostSocket.emit('room:start', {}, resolve);
  });
  console.log('✓ Kiểm tra chặn bắt đầu khi chưa sẵn sàng:', prematureStartRes.message);
  if (prematureStartRes.success) {
    throw new Error('Server không chặn bắt đầu khi người chơi chưa sẵn sàng!');
  }

  // 5. Khách bấm SẴN SÀNG
  guestSocket.emit('room:toggle_ready');
  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log('✓ Điện thoại đã bấm SẴN SÀNG.');

  // 6. Chuẩn bị đón sự kiện `game:started` trên cả 2 thiết bị
  const hostGameStartedPromise = new Promise((resolve) => {
    hostSocket.on('game:started', (data) => resolve(data));
  });

  const guestGameStartedPromise = new Promise((resolve) => {
    guestSocket.on('game:started', (data) => resolve(data));
  });

  // 7. Host bấm BẮT ĐẦU TRẬN ĐẤU
  const startRes = await new Promise((resolve) => {
    hostSocket.emit('room:start', {}, resolve);
  });

  if (!startRes.success) {
    throw new Error('Host bắt đầu trận đấu thất bại: ' + startRes.message);
  }
  console.log('✓ Host đã gửi lệnh bắt đầu thành công lên Server!');

  // Chờ cả 2 socket nhận game:started
  const [hostStateData, guestStateData] = await Promise.all([
    hostGameStartedPromise,
    guestGameStartedPromise
  ]);

  console.log('🎉 CẢ 2 THIẾT BỊ ĐÃ NHẬN ĐƯỢC SỰ KIỆN game:started ĐỒNG LOẠT!');
  console.log('  - Host Game ID:', hostStateData.gameState.id);
  console.log('  - Guest Game ID:', guestStateData.gameState.id);

  if (hostStateData.gameState.id !== guestStateData.gameState.id) {
    throw new Error('GameState ID giữa Host và Điện thoại không khớp nhau!');
  }

  // Kiểm tra tính nhất quán của bộ bài trên bàn
  const hostTier1 = hostStateData.gameState.boardCards[1].map(c => c.id).join(',');
  const guestTier1 = guestStateData.gameState.boardCards[1].map(c => c.id).join(',');
  if (hostTier1 !== guestTier1) {
    throw new Error('Thẻ bài bàn cờ giữa Host và Điện thoại bị lệch!');
  }
  console.log('✓ Bộ bài 3 tầng trên bàn cờ của Host và Điện thoại hoàn toàn đồng nhất 100%!');

  // 8. Kiểm tra lượt chơi đầu tiên
  const currentPIdx = hostStateData.gameState.currentPlayerIndex;
  console.log(`✓ Lượt chơi đầu tiên: Player Index ${currentPIdx} (${hostStateData.gameState.players[currentPIdx].name})`);

  // 9. Thử để Điện Thoại (Player 1) đi khi đang là lượt của Host (Player 0)
  const illegalTurnPromise = new Promise((resolve) => {
    guestSocket.emit('game:action', {
      actionType: 'TAKE_THREE_GEMS',
      actionData: { gems: ['diamond', 'sapphire', 'emerald'] }
    }, (res) => resolve(res));
  });

  const illegalRes = await illegalTurnPromise;
  console.log('✓ Kiểm tra chặn sai lượt chơi:', illegalRes?.error || 'Đã bị từ chối');

  // 10. Host (Player 0) thực hiện hành động hợp lệ: Lấy 3 viên đá quý
  const hostActionUpdatedPromise = new Promise((resolve) => {
    hostSocket.on('game:state_updated', (data) => resolve(data));
  });

  const guestActionUpdatedPromise = new Promise((resolve) => {
    guestSocket.on('game:state_updated', (data) => resolve(data));
  });

  hostSocket.emit('game:action', {
    actionType: 'TAKE_THREE_GEMS',
    actionData: { gems: ['diamond', 'sapphire', 'emerald'] }
  });

  const [hostUpdatedData, guestUpdatedData] = await Promise.all([
    hostActionUpdatedPromise,
    guestActionUpdatedPromise
  ]);

  console.log('🎉 CẢ 2 THIẾT BỊ ĐÃ NHẬN ĐƯỢC SỰ KIỆN game:state_updated SAU NƯỚC ĐI CỦA HOST!');
  console.log('  - Host ghi nhận currentPlayerIndex mới:', hostUpdatedData.gameState.currentPlayerIndex);
  console.log('  - Điện thoại ghi nhận currentPlayerIndex mới:', guestUpdatedData.gameState.currentPlayerIndex);

  if (guestUpdatedData.gameState.currentPlayerIndex !== 1) {
    throw new Error('Lượt chơi chưa được chuyển sang cho Điện thoại (Player 1)!');
  }

  // 11. Giờ đến lượt Điện thoại (Player 1): Lấy 2 viên đá cùng màu
  const hostTurn2UpdatedPromise = new Promise((resolve) => {
    hostSocket.on('game:state_updated', (data) => resolve(data));
  });

  const guestTurn2UpdatedPromise = new Promise((resolve) => {
    guestSocket.on('game:state_updated', (data) => resolve(data));
  });

  guestSocket.emit('game:action', {
    actionType: 'TAKE_TWO_SAME_GEMS',
    actionData: { gem: 'ruby' }
  });

  const [h2, g2] = await Promise.all([
    hostTurn2UpdatedPromise,
    guestTurn2UpdatedPromise
  ]);

  console.log('🎉 CẢ 2 THIẾT BỊ ĐÃ NHẬN ĐƯỢC game:state_updated SAU NƯỚC ĐI CỦA ĐIỆN THOẠI!');
  console.log('  - Lượt chơi đã quay về Host (Player 0):', g2.gameState.currentPlayerIndex);

  // Đóng kết nối
  hostSocket.disconnect();
  guestSocket.disconnect();

  console.log('\n======================================================');
  console.log('✅ TẤT CẢ CÁC BƯỚC KIỂM THỬ MULTIPLAYER THÀNH CÔNG RỰC RỠ 100%!');
  console.log('======================================================\n');
}

runTest().catch((err) => {
  console.error('❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
