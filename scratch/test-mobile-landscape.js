const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('../server/node_modules/ws');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9555;
const USER_DATA = path.join(__dirname, 'chrome-user-data-ls');

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
  console.log('📱 Khởi động kiểm thử Mobile Landscape (iPhone 12/13/14 xoay ngang: 844x390)...');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const targets = await getJson(`http://127.0.0.1:${DEBUG_PORT}/json`);
    const page1Ws = targets[0].webSocketDebuggerUrl;
    const client = new CDPClient(page1Ws);
    await client.connect();

    // Mobile Landscape: 844 x 390
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { type: 'landscapePrimary', angle: 90 }
    });

    await client.send('Page.navigate', { url: 'http://localhost:3000/#home' });
    await sleep(1500);

    // Bắt đầu game AI để xem bàn cờ trên landscape
    await client.eval(`
      document.getElementById('btn-mode-ai').click();
    `);
    await sleep(500);

    await client.eval(`
      document.getElementById('btn-start-game-now').click();
    `);
    await sleep(1000);

    const shotLandscape = path.join(__dirname, 'mobile_landscape_game.png');
    await client.captureScreenshot(shotLandscape);
    console.log('📸 Đã chụp ảnh màn hình Mobile Landscape:', shotLandscape);

    client.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
