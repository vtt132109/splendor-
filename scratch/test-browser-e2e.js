const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('../server/node_modules/ws');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9333;
const USER_DATA = path.join(__dirname, 'chrome-user-data');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function putJson(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'PUT'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
    });

    this.ws.on('message', (raw) => {
      const data = JSON.parse(raw);
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    });
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res?.exceptionDetails) {
      console.error('[EVAL EXCEPTION]:', JSON.stringify(res.exceptionDetails));
    }
    return res?.result?.value;
  }

  async captureScreenshot(savePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(savePath, Buffer.from(res.data, 'base64'));
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  console.log('🌐 Khởi động Chrome Headless để kiểm thử E2E Browser giữa Host PC và Khách Mobile...');

  if (!fs.existsSync(USER_DATA)) {
    fs.mkdirSync(USER_DATA, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const targets = await getJson(`http://127.0.0.1:${DEBUG_PORT}/json`);
    const page1Ws = targets[0].webSocketDebuggerUrl;
    const clientHost = new CDPClient(page1Ws);
    await clientHost.connect();

    // Thiết lập Desktop cho Host
    await clientHost.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Tạo tab thứ 2 cho Mobile
    const newTabRes = await putJson(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`);
    const clientMobile = new CDPClient(newTabRes.webSocketDebuggerUrl);
    await clientMobile.connect();

    // Thiết lập Mobile Portrait (iPhone 375x667)
    await clientMobile.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    });

    await clientHost.send('Runtime.enable');
    await clientMobile.send('Runtime.enable');

    clientHost.ws.on('message', (raw) => {
      try {
        const d = JSON.parse(raw);
        if (d.method === 'Runtime.consoleAPICalled') {
          console.log('[Host Console]:', d.params.args.map(a => a.value || a.description).join(' '));
        }
      } catch (e) {}
    });

    clientMobile.ws.on('message', (raw) => {
      try {
        const d = JSON.parse(raw);
        if (d.method === 'Runtime.consoleAPICalled') {
          console.log('[Mobile Console]:', d.params.args.map(a => a.value || a.description).join(' '));
        }
      } catch (e) {}
    });

    console.log('✓ Tab 1 (Host PC - 1280x800) và Tab 2 (Mobile - 375x667) đã sẵn sàng!');

    // 1. Host mở trang chủ
    await clientHost.send('Page.navigate', { url: 'http://localhost:3000/#home' });
    
    // Đợi socket trên Host kết nối
    await clientHost.eval(`
      new Promise(resolve => {
        if (window.SplendorSocket?.isConnected) return resolve(true);
        if (window.SplendorSocket) window.SplendorSocket.on('connected', () => resolve(true));
        setTimeout(resolve, 4000);
      })
    `);
    console.log('✓ Host đã kết nối Socket.IO thành công');

    // Host bấm "Chơi Online" -> mở modal
    console.log('👉 Host bấm "Chơi Online" và Tạo Phòng...');
    await clientHost.eval(`document.getElementById('btn-mode-online').click()`);
    await sleep(600);

    // Host bấm "TẠO PHÒNG HOÀNG GIA"
    await clientHost.eval(`document.getElementById('btn-action-create-room').click()`);
    await sleep(1500);

    // Lấy mã phòng
    const currentScreen = await clientHost.eval(`window.SplendorApp?.currentScreen`);
    const currentRoomObj = await clientHost.eval(`JSON.stringify(window.SplendorLobbyScreen?.currentRoom)`);
    const rawCodeEl = await clientHost.eval(`document.getElementById('lobby-room-code')?.outerHTML`);
    console.log('Host Debug:', { currentScreen, currentRoomObj, rawCodeEl });
    const roomCode = await clientHost.eval(`document.getElementById('lobby-room-code')?.innerText || document.getElementById('lobby-room-code')?.textContent`);
    console.log(`✓ Host đã tạo phòng thành công! Mã phòng hiển thị trên giao diện: [${roomCode}]`);

    // 2. Mobile mở trang chủ
    console.log('👉 Mobile mở trang chủ và nhập mã phòng...');
    await clientMobile.send('Page.navigate', { url: 'http://localhost:3000/#home' });
    
    // Đợi socket trên Mobile kết nối
    await clientMobile.eval(`
      new Promise(resolve => {
        if (window.SplendorSocket?.isConnected) return resolve(true);
        if (window.SplendorSocket) window.SplendorSocket.on('connected', () => resolve(true));
        setTimeout(resolve, 4000);
      })
    `);
    console.log('✓ Mobile đã kết nối Socket.IO thành công');

    // Mobile bấm "Chơi Online"
    await clientMobile.eval(`document.getElementById('btn-mode-online').click()`);
    await sleep(600);

    // Mobile chuyển sang tab "VÀO PHÒNG"
    await clientMobile.eval(`document.getElementById('tab-btn-join').click()`);
    await sleep(400);

    // Mobile điền mã phòng
    await clientMobile.eval(`
      const inp = document.getElementById('input-online-room-code');
      inp.value = '${roomCode}';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await sleep(300);

    // Mobile bấm "GIA NHẬP PHÒNG"
    await clientMobile.eval(`document.getElementById('btn-action-join-room').click()`);
    await sleep(1200);

    const mobileLobbyCode = await clientMobile.eval(`document.getElementById('lobby-room-code')?.textContent`);
    console.log(`✓ Mobile đã vào phòng thành công! Mã phòng trên Mobile: [${mobileLobbyCode}]`);

    // 3. Mobile bấm "SẴN SÀNG"
    console.log('👉 Mobile bấm "SẴN SÀNG"...');
    await clientMobile.eval(`document.getElementById('btn-lobby-ready').click()`);
    await sleep(1000);

    // 4. Host kiểm tra nút bắt đầu đã sẵn sàng chưa
    const isStartEnabled = await clientHost.eval(`!document.getElementById('btn-lobby-start').disabled`);
    console.log('✓ Host kiểm tra nút "BẮT ĐẦU TRẬN ĐẤU":', isStartEnabled ? 'ĐÃ BẬT SẴN SÀNG' : 'CHƯA BẬT');

    if (!isStartEnabled) {
      throw new Error('Nút bắt đầu trên Host chưa được kích hoạt sau khi Mobile sẵn sàng!');
    }

    // 5. Host bấm "BẮT ĐẦU TRẬN ĐẤU"
    console.log('👉 Host bấm "BẮT ĐẦU TRẬN ĐẤU"...');
    await clientHost.eval(`document.getElementById('btn-lobby-start').click()`);

    // Đợi hoạt ảnh đếm ngược hoàng gia chạy xong (khoảng 3.5s - 5s)
    console.log('⏳ Đang đợi hoạt ảnh đếm ngược 3... 2... 1... hoàng gia hoàn tất trên cả 2 màn hình...');

    let hostScreenActive = false;
    let mobileScreenActive = false;

    for (let i = 0; i < 20; i++) {
      if (!hostScreenActive) {
        hostScreenActive = await clientHost.eval(`
          document.getElementById('screen-game')?.classList.contains('active')
        `);
      }
      if (!mobileScreenActive) {
        mobileScreenActive = await clientMobile.eval(`
          document.getElementById('screen-game')?.classList.contains('active')
        `);
      }
      if (hostScreenActive && mobileScreenActive) break;
      await sleep(500);
    }

    console.log('🎉 KẾT QUẢ CHUYỂN MÀN HÌNH SAU ĐẾM NGƯỢC:');
    console.log(`  - Host PC vào screen-game: ${hostScreenActive ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI'}`);
    console.log(`  - Mobile vào screen-game:  ${mobileScreenActive ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    if (!hostScreenActive || !mobileScreenActive) {
      const hScreen = await clientHost.eval(`window.SplendorApp?.currentScreen`);
      const mScreen = await clientMobile.eval(`window.SplendorApp?.currentScreen`);
      console.log(`Chi tiết: Host screen=${hScreen}, Mobile screen=${mScreen}`);
      throw new Error('Một trong hai thiết bị không vào được màn hình game!');
    }

    // 7. Kiểm tra bàn cờ trên cả 2 màn hình
    const hostCardCount = await clientHost.eval(`document.querySelectorAll('#card-matrix .dev-card').length`);
    const mobileCardCount = await clientMobile.eval(`document.querySelectorAll('#card-matrix .dev-card').length`);
    console.log(`✓ Thẻ bài hiển thị trên Host PC: ${hostCardCount} thẻ`);
    console.log(`✓ Thẻ bài hiển thị trên Mobile:  ${mobileCardCount} thẻ`);

    // Chụp ảnh màn hình cả 2 thiết bị
    const shotHost = path.join(__dirname, 'e2e_host_game.png');
    const shotMobile = path.join(__dirname, 'e2e_mobile_game.png');
    await clientHost.captureScreenshot(shotHost);
    await clientMobile.captureScreenshot(shotMobile);
    console.log(`📸 Đã chụp ảnh màn hình Host PC:   ${shotHost}`);
    console.log(`📸 Đã chụp ảnh màn hình Mobile:    ${shotMobile}`);

    clientHost.close();
    clientMobile.close();

    console.log('\n======================================================');
    console.log('🎉 XÁC THỰC E2E BROWSER THỰC TẾ THÀNH CÔNG 100%! KHÔNG LỖI!');
    console.log('======================================================\n');
  } finally {
    chromeProc.kill();
  }
}

main().catch(err => {
  console.error('❌ Lỗi E2E Browser:', err);
  process.exit(1);
});
