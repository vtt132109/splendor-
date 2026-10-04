const puppeteer = require('../server/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'desktop-1080p', width: 1920, height: 1080, isMobile: false },
  { name: 'desktop-720p', width: 1280, height: 720, isMobile: false },
  { name: 'mobile-landscape-390p', width: 844, height: 390, isMobile: true },
  { name: 'mobile-landscape-375p', width: 667, height: 375, isMobile: true }
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runVerification() {
  console.log('💎 Bắt đầu kiểm thử xác thực tự động: Bàn cờ Splendor vừa khít 100% không che lấp...');

  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error('Không tìm thấy Chrome tại: ' + CHROME_PATH);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const results = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n======================================================`);
      console.log(`📱 Kiểm tra độ phân giải: ${vp.name} (${vp.width} x ${vp.height})`);
      console.log(`======================================================`);

      const page = await browser.newPage();
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        isLandscape: true,
        hasTouch: vp.isMobile
      });

      await page.goto(URL, { waitUntil: 'networkidle0' });

      // Nhấn nút Chơi Local
      await page.waitForSelector('#btn-mode-local', { visible: true });
      await page.click('#btn-mode-local');
      await sleep(300);

      // Ở màn hình thiết lập, nhấn Vào Bàn Chơi Ngay
      await page.waitForSelector('#btn-start-game-now', { visible: true });
      await page.click('#btn-start-game-now');
      await sleep(1000); // Đợi bàn chơi render và chuyển cảnh hoàn tất

      // Đo đạc tọa độ và kiểm tra va chạm
      const metrics = await page.evaluate(() => {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        const screenGame = document.getElementById('screen-game');
        const screenGameRect = screenGame ? screenGame.getBoundingClientRect() : null;

        const playerMat = document.getElementById('current-player-mat');
        const matRect = playerMat ? playerMat.getBoundingClientRect() : null;

        const header = document.querySelector('.game-header');
        const headerRect = header ? header.getBoundingClientRect() : null;

        // Tier 1 cards
        const tier1Cards = Array.from(document.querySelectorAll('#tier-1-cards .dev-card')).map((el, i) => {
          const r = el.getBoundingClientRect();
          const costDiscs = Array.from(el.querySelectorAll('.cost-token-disc')).map(d => {
            const dr = d.getBoundingClientRect();
            return { top: dr.top, bottom: dr.bottom, height: dr.height };
          });
          return {
            index: i,
            top: r.top,
            bottom: r.bottom,
            height: r.height,
            width: r.width,
            costDiscs
          };
        });

        // Bank chips
        const bankChips = Array.from(document.querySelectorAll('#gem-bank-container .gem-chip')).map(el => {
          const r = el.getBoundingClientRect();
          return {
            gem: el.dataset.gem,
            top: r.top,
            bottom: r.bottom,
            left: r.left,
            right: r.right,
            width: r.width,
            height: r.height
          };
        });

        // Nút Lấy Đá Quý
        const takeGemsBtn = document.getElementById('btn-confirm-take-gems');
        const takeGemsBtnRect = takeGemsBtn ? takeGemsBtn.getBoundingClientRect() : null;

        // Quý tộc
        const nobleTiles = Array.from(document.querySelectorAll('.noble-tile')).map((el, i) => {
          const r = el.getBoundingClientRect();
          return { index: i, top: r.top, bottom: r.bottom, height: r.height };
        });

        return {
          windowWidth,
          windowHeight,
          screenGameRect: screenGameRect ? { top: screenGameRect.top, bottom: screenGameRect.bottom, height: screenGameRect.height } : null,
          headerRect: headerRect ? { height: headerRect.height, bottom: headerRect.bottom } : null,
          matRect: matRect ? { top: matRect.top, bottom: matRect.bottom, height: matRect.height } : null,
          tier1Cards,
          bankChips,
          takeGemsBtnRect: takeGemsBtnRect ? { top: takeGemsBtnRect.top, bottom: takeGemsBtnRect.bottom, height: takeGemsBtnRect.height } : null,
          nobleTiles
        };
      });

      // Chụp ảnh màn hình lưu lại
      const screenshotPath = path.join(__dirname, `viewport_${vp.name}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`📸 Đã lưu ảnh chụp bàn cờ: ${screenshotPath}`);

      // Kiểm tra các điều kiện an toàn
      let hasError = false;
      const checks = [];

      // Check 1: Khung game không tràn màn hình
      if (metrics.screenGameRect) {
        const fitsHeight = metrics.screenGameRect.bottom <= metrics.windowHeight + 1.5;
        checks.push({
          desc: `Khung #screen-game nằm trọn trong viewport (${metrics.screenGameRect.bottom.toFixed(1)}px <= ${metrics.windowHeight}px)`,
          pass: fitsHeight
        });
        if (!fitsHeight) hasError = true;
      }

      // Check 2: Thẻ Tầng 1 KHÔNG bị Player Mat đè lên
      if (metrics.matRect && metrics.tier1Cards.length > 0) {
        let maxCardBottom = Math.max(...metrics.tier1Cards.map(c => c.bottom));
        let cardFits = maxCardBottom <= metrics.matRect.top + 1.0;
        checks.push({
          desc: `Cạnh đáy thẻ Tầng 1 không bị Bảng người chơi đè lên (${maxCardBottom.toFixed(1)}px <= ${metrics.matRect.top.toFixed(1)}px)`,
          pass: cardFits
        });
        if (!cardFits) hasError = true;

        // Check 2b: Chấm chi phí đá quý của thẻ Tầng 1 100% hiển thị
        let allDiscs = metrics.tier1Cards.flatMap(c => c.costDiscs);
        if (allDiscs.length > 0) {
          let maxDiscBottom = Math.max(...allDiscs.map(d => d.bottom));
          let discFits = maxDiscBottom <= metrics.matRect.top + 1.0;
          checks.push({
            desc: `Các chấm chi phí đá quý thẻ Tầng 1 nằm 100% phía trên bảng người chơi (${maxDiscBottom.toFixed(1)}px <= ${metrics.matRect.top.toFixed(1)}px)`,
            pass: discFits
          });
          if (!discFits) hasError = true;
        }
      }

      // Check 3: Toàn bộ 6 loại đá quý trong kho đều hiển thị
      if (metrics.bankChips.length === 6) {
        let maxChipBottom = Math.max(...metrics.bankChips.map(c => c.bottom));
        let chipsFit = maxChipBottom <= metrics.windowHeight + 1.0;
        checks.push({
          desc: `Toàn bộ 6 viên đá quý trong kho đều hiển thị đầy đủ (${maxChipBottom.toFixed(1)}px <= ${metrics.windowHeight}px)`,
          pass: chipsFit
        });
        if (!chipsFit) hasError = true;
      } else {
        checks.push({
          desc: `Tìm thấy đủ 6 chip trong kho (hiện tại: ${metrics.bankChips.length})`,
          pass: false
        });
        hasError = true;
      }

      // Check 4: Nút "Lấy Đá Quý" nằm trọn trong viewport
      if (metrics.takeGemsBtnRect) {
        let btnFits = metrics.takeGemsBtnRect.bottom <= metrics.windowHeight + 1.0;
        checks.push({
          desc: `Nút 'Lấy Đá Quý' hiển thị trọn vẹn trong màn hình (${metrics.takeGemsBtnRect.bottom.toFixed(1)}px <= ${metrics.windowHeight}px)`,
          pass: btnFits
        });
        if (!btnFits) hasError = true;
      } else {
        checks.push({ desc: "Tìm thấy nút 'Lấy Đá Quý'", pass: false });
        hasError = true;
      }

      // Check 5: Quý tộc trên cùng không bị xén đỉnh
      if (metrics.nobleTiles.length > 0) {
        let topNoble = metrics.nobleTiles[0];
        let nobleFitsTop = topNoble.top >= (metrics.headerRect ? metrics.headerRect.bottom : 0) - 2;
        checks.push({
          desc: `Quý tộc trên cùng không bị xén đỉnh (${topNoble.top.toFixed(1)}px >= ${metrics.headerRect ? metrics.headerRect.bottom.toFixed(1) : 0}px)`,
          pass: nobleFitsTop
        });
        if (!nobleFitsTop) hasError = true;
      }

      for (const c of checks) {
        console.log(`  ${c.pass ? '✅' : '❌'} ${c.desc}`);
      }

      results.push({ viewport: vp.name, pass: !hasError });
      await page.close();
    }

    console.log(`\n======================================================`);
    console.log(`🎉 TỔNG KẾT KIỂM THỬ XÁC THỰC BỐ CỤC ĐA MÀN HÌNH`);
    console.log(`======================================================`);
    let allPassed = true;
    for (const r of results) {
      console.log(`  ${r.pass ? '✅ ĐẠT' : '❌ KHÔNG ĐẠT'}: ${r.viewport}`);
      if (!r.pass) allPassed = false;
    }

    if (!allPassed) {
      throw new Error('Một số độ phân giải chưa đạt yêu cầu vừa khít 100%!');
    }

    console.log('\n🌟 XÁC THỰC HOÀN HẢO: Toàn bộ các thành phần bàn cờ hiển thị 100%, không bị che lấp!');
  } finally {
    await browser.close();
  }
}

runVerification().catch(err => {
  console.error('\n❌ Lỗi kiểm thử:', err.message);
  process.exit(1);
});
