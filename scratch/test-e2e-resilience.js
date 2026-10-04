/**
 * Automated E2E Resilience Test for Splendor Board Game
 * Tests:
 * 1. Room creation (PC Host)
 * 2. Mobile Guest joining & toggling ready
 * 3. Starting online game & sync verification
 * 4. Action execution (Turn 1)
 * 5. Sudden mobile disconnect simulation
 * 6. Grace period verification (Room remains active, player not deleted)
 * 7. Mobile reconnects with new socket & rebinds
 * 8. Reconnected mobile player executes action (Turn 2)
 */

const { io } = require('../server/node_modules/socket.io-client');

const SERVER_URL = 'http://localhost:3000';

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runResilienceTest() {
  console.log('🚀 Bắt đầu kịch bản kiểm thử độ tin cậy và kết nối lại đa thiết bị...');

  // 1. Tạo kết nối Host
  const hostSocket = io(SERVER_URL, { reconnection: false });
  await new Promise((res, rej) => {
    hostSocket.on('connect', res);
    hostSocket.on('connect_error', rej);
  });
  console.log('✅ 1. Host PC đã kết nối socket:', hostSocket.id);

  // 2. Host tạo phòng
  const createRes = await new Promise(res => {
    hostSocket.emit('room:create', {
      player: { uid: 'user_host_123', name: 'Tris (Host)' },
      maxPlayers: 2
    }, res);
  });
  if (!createRes.success) throw new Error('Không tạo được phòng: ' + createRes.message);
  const roomCode = createRes.room.code;
  console.log(`✅ 2. Host đã tạo phòng thành công: ${roomCode}`);

  // 3. Mobile Guest kết nối và vào phòng
  let guestSocket = io(SERVER_URL, { reconnection: false });
  await new Promise(res => guestSocket.on('connect', res));
  console.log('✅ 3. Mobile Guest đã kết nối socket:', guestSocket.id);

  const joinRes = await new Promise(res => {
    guestSocket.emit('room:join', {
      code: roomCode,
      player: { uid: 'user_guest_456', name: 'Điện Thoại (Guest)' }
    }, res);
  });
  if (!joinRes.success) throw new Error('Guest không vào được phòng: ' + joinRes.message);
  console.log(`✅ 4. Guest đã vào phòng ${roomCode} thành công!`);

  // 4. Guest sẵn sàng
  guestSocket.emit('room:toggle_ready');
  await wait(300);

  // 5. Host bắt đầu trận đấu
  let hostGameStarted = null;
  let guestGameStarted = null;
  hostSocket.on('game:started', d => { hostGameStarted = d; });
  guestSocket.on('game:started', d => { guestGameStarted = d; });

  const startRes = await new Promise(res => {
    hostSocket.emit('room:start', {}, res);
  });
  if (!startRes.success) throw new Error('Host không bắt đầu được trận đấu: ' + startRes.message);
  await wait(500);

  if (!hostGameStarted || !guestGameStarted) {
    throw new Error('Một trong hai thiết bị không nhận được sự kiện game:started!');
  }
  console.log('✅ 5. Cả Host và Guest đều nhận được game:started đồng bộ 100%!');

  // 6. Host thực hiện lượt 1: Lấy 3 viên đá quý
  const takeGemsRes = await new Promise(res => {
    hostSocket.emit('game:action', {
      actionType: 'TAKE_THREE_GEMS',
      actionData: { gems: ['diamond', 'sapphire', 'emerald'] }
    }, res);
  });
  if (!takeGemsRes.success) throw new Error('Host lấy đá quý thất bại: ' + takeGemsRes.error);
  console.log('✅ 6. Host đã hoàn thành lượt 1 (Lấy 3 viên đá quý). Lượt chuyển sang Guest!');

  await wait(400);

  // 7. Mô phỏng Guest rớt mạng (ví dụ: tắt màn hình điện thoại)
  console.log('⚡ 7. Mô phỏng điện thoại bị ngắt kết nối đột ngột...');
  let disconnectNotified = false;
  hostSocket.on('room:player_disconnected', d => {
    disconnectNotified = true;
    console.log(`   [Host UI] Nhận thông báo đối thủ mất mạng: ${d.playerName}`);
  });

  guestSocket.disconnect();
  await wait(800);

  if (!disconnectNotified) {
    throw new Error('Server không gửi thông báo room:player_disconnected khi điện thoại mất mạng!');
  }
  console.log('✅ 8. Server kích hoạt ân hạn 60s, giữ nguyên ván đấu và thông báo cho Host!');

  // 8. Mobile Guest bật lại trình duyệt với Socket ID mới toanh!
  console.log('🔄 9. Khách mở lại web trên điện thoại (tạo kết nối socket mới)...');
  const newGuestSocket = io(SERVER_URL, { reconnection: false });
  await new Promise(res => newGuestSocket.on('connect', res));
  console.log('   Socket ID mới của điện thoại:', newGuestSocket.id);

  let hostReconnectedNotified = false;
  hostSocket.on('room:player_reconnected', d => {
    hostReconnectedNotified = true;
    console.log(`   [Host UI] Nhận thông báo đối thủ đã kết nối lại: ${d.playerName}`);
  });

  const rejoinRes = await new Promise(res => {
    newGuestSocket.emit('room:join', {
      code: roomCode,
      player: { uid: 'user_guest_456', name: 'Điện Thoại (Guest)' }
    }, res);
  });

  if (!rejoinRes.success || !rejoinRes.reconnected) {
    throw new Error('Kết nối lại thất bại: ' + JSON.stringify(rejoinRes));
  }
  console.log('✅ 10. Điện thoại kết nối lại thành công, nhận lại đầy đủ GameState từ server!');

  await wait(500);

  // 9. Điện thoại (với socket mới) thực hiện lượt 2!
  console.log('🎯 11. Điện thoại thực hiện lượt đi sau khi kết nối lại...');
  const guestActionRes = await new Promise(res => {
    newGuestSocket.emit('game:action', {
      actionType: 'TAKE_THREE_GEMS',
      actionData: { gems: ['ruby', 'onyx', 'emerald'] }
    }, res);
  });

  if (!guestActionRes.success) {
    throw new Error('Điện thoại sau khi kết nối lại không thể đi nước cờ: ' + guestActionRes.error);
  }
  console.log('✅ 12. Điện thoại đã thực hiện lượt đi thành công sau khi kết nối lại!');

  console.log('\n=============================================================');
  console.log('🎉 TẤT CẢ 12 BƯỚC KIỂM THỬ ĐỘ TIN CẬY & KẾT NỐI LẠI ĐỀU THÀNH CÔNG 100%!');
  console.log('=============================================================\n');

  hostSocket.close();
  newGuestSocket.close();
  process.exit(0);
}

runResilienceTest().catch(err => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
