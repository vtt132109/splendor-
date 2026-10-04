const { io } = require('../server/node_modules/socket.io-client');

const SERVER_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ XÁC THỰC GOOGLE VÀ CHỐNG TRÙNG THIẾT BỊ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Kiểm tra API Config
  console.log('▶ Test 1: Kiểm tra API /api/auth/config (GET & POST)...');
  try {
    const postRes = await fetch(`${SERVER_URL}/api/auth/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleClientId: '123456789-mockclient.apps.googleusercontent.com' })
    });
    const postData = await postRes.json();
    assert(postData.success && postData.googleClientId === '123456789-mockclient.apps.googleusercontent.com', 'POST /api/auth/config cập nhật thành công');

    const getRes = await fetch(`${SERVER_URL}/api/auth/config`);
    const getData = await getRes.json();
    assert(getData.success && getData.googleClientId === '123456789-mockclient.apps.googleusercontent.com', 'GET /api/auth/config trả về đúng Client ID');
  } catch (err) {
    assert(false, 'Lỗi API config: ' + err.message);
  }

  // 2. Kiểm tra API Verify Token
  console.log('\n▶ Test 2: Kiểm tra API /api/auth/google/verify...');
  try {
    const emptyVerify = await fetch(`${SERVER_URL}/api/auth/google/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(emptyVerify.status === 400, 'Verify token rỗng phải trả về HTTP 400');
  } catch (err) {
    assert(false, 'Lỗi API verify: ' + err.message);
  }

  // 3. Kết nối Socket Device 1 & Device 2
  console.log('\n▶ Test 3: Kết nối 2 thiết bị socket độc lập...');
  const socket1 = io(SERVER_URL, { reconnection: false, forceNew: true });
  const socket2 = io(SERVER_URL, { reconnection: false, forceNew: true });

  await new Promise(r => {
    let count = 0;
    const check = () => { if (++count === 2) r(); };
    socket1.on('connect', check);
    socket2.on('connect', check);
  });
  assert(socket1.connected && socket2.connected, 'Cả 2 socket (thiết bị 1 và 2) đã kết nối thành công');

  const googleUser1 = {
    uid: 'google_sub_111111111',
    email: 'tris.master@gmail.com',
    name: 'Tris Chủ Phòng',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tris',
    isGoogle: true
  };

  const googleUserSameAccount = {
    uid: 'google_sub_111111111',
    email: 'tris.master@gmail.com',
    name: 'Tris Thiết Bị 2',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tris2',
    isGoogle: true
  };

  const googleUser2 = {
    uid: 'google_sub_222222222',
    email: 'opponent.friend@gmail.com',
    name: 'Người Chơi Bạn',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Friend',
    isGoogle: true
  };

  // 4. Thiết bị 1 tạo phòng với tài khoản Google
  console.log('\n▶ Test 4: Thiết bị 1 tạo phòng mới bằng tài khoản Google 1...');
  let createdRoomCode = null;
  await new Promise(resolve => {
    socket1.emit('room:create', { player: googleUser1, maxPlayers: 4 }, (res) => {
      assert(res.success && res.room && res.room.code, `Thiết bị 1 tạo phòng ${res.room?.code} thành công`);
      assert(res.room?.players[0]?.email === 'tris.master@gmail.com', 'Email Google được gắn đúng vào player');
      createdRoomCode = res.room?.code;
      resolve();
    });
  });

  // 5. Thiết bị 2 cố tình VÀO phòng CÙNG mã phòng với CÙNG tài khoản Google
  console.log('\n▶ Test 5: Thiết bị 2 dùng CÙNG tài khoản Google cố vào phòng của Thiết bị 1...');
  await new Promise(resolve => {
    socket2.emit('room:join', { code: createdRoomCode, player: googleUserSameAccount }, (res) => {
      assert(res.success === false, 'Thiết bị 2 bị CHẶN không cho vào phòng vì trùng tài khoản Google');
      assert(res.message.includes('hiện đang hoạt động trên một thiết bị khác'), `Thông báo lỗi chính xác: "${res.message}"`);
      resolve();
    });
  });

  // 6. Thiết bị 2 cố tình TẠO phòng mới khi tài khoản Google đang ở phòng cũ
  console.log('\n▶ Test 6: Thiết bị 2 cố tạo phòng khác bằng tài khoản đang hoạt động...');
  await new Promise(resolve => {
    socket2.emit('room:create', { player: googleUserSameAccount, maxPlayers: 4 }, (res) => {
      assert(res.success === false, 'Thiết bị 2 bị CHẶN không cho tạo phòng mới khi tài khoản đang ở phòng khác');
      assert(res.message.includes('hiện đang ở trong phòng'), `Thông báo lỗi tạo phòng chuẩn: "${res.message}"`);
      resolve();
    });
  });

  // 7. Thiết bị 2 đăng nhập tài khoản Google KHÁC (chính chủ khác) và vào phòng
  console.log('\n▶ Test 7: Thiết bị 2 đăng nhập tài khoản Google KHÁC và vào phòng...');
  await new Promise(resolve => {
    socket2.emit('room:join', { code: createdRoomCode, player: googleUser2 }, (res) => {
      assert(res.success === true, 'Thiết bị 2 với tài khoản Google riêng biệt vào phòng THÀNH CÔNG');
      assert(res.room.players.length === 2, 'Phòng hiện có đủ 2 người chơi phân biệt');
      assert(res.room.players[0].email === 'tris.master@gmail.com', 'Người chơi 1 giữ đúng email');
      assert(res.room.players[1].email === 'opponent.friend@gmail.com', 'Người chơi 2 có đúng email riêng');
      resolve();
    });
  });

  // 8. Đóng kết nối
  socket1.disconnect();
  socket2.disconnect();

  console.log('\n====================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Lỗi ngoại lệ:', err);
  process.exit(1);
});
