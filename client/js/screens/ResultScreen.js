/**
 * Splendor Board Game - Màn Hình Kết Quả & Vinh Danh Chiến Thắng (ResultScreen.js)
 */

class ResultScreen {
  constructor() {
    this.initEvents();
  }

  initEvents() {
    const btnRematch = document.getElementById('btn-rematch');
    const btnHome = document.getElementById('btn-back-home-result');

    if (btnRematch) {
      btnRematch.addEventListener('click', () => {
        if (window.lastGameConfig) {
          window.SplendorApp.showGameScreen();
          window.SplendorGameScreen.startNewGame(window.lastGameConfig.players, window.lastGameConfig.mode);
        } else {
          window.SplendorApp.showScreen('home');
        }
      });
    }

    if (btnHome) {
      btnHome.addEventListener('click', () => {
        window.SplendorApp.showScreen('home');
      });
    }
  }

  showResult(gameState) {
    const winnerTitleEl = document.getElementById('winner-announcement');
    const winnerDescEl = document.getElementById('winner-desc');
    const scoreboardEl = document.getElementById('result-scoreboard');

    const winner = gameState.winner;
    if (winnerTitleEl) {
      winnerTitleEl.textContent = `👑 ${winner.name.toUpperCase()} CHIẾN THẮNG!`;
    }
    if (winnerDescEl) {
      winnerDescEl.textContent = gameState.winnerReason || `Đạt ${winner.prestigePoints} điểm uy tín!`;
    }

    // Sắp xếp thứ hạng tất cả người chơi:
    // 1. Người chiến thắng luôn đứng đầu (#1)
    // 2. Những người sạch nợ bài (đủ điều kiện thắng) xếp trên người còn nợ bài
    // 3. Trong cùng nhóm sắp xếp theo điểm uy tín giảm dần, hòa điểm thì ít thẻ bài hơn xếp trên
    const isDebtFree = (p) => !p.reservedCards || p.reservedCards.length === 0;

    const ranked = [...gameState.players].sort((a, b) => {
      if (a.id === winner.id) return -1;
      if (b.id === winner.id) return 1;

      const aClean = isDebtFree(a);
      const bClean = isDebtFree(b);
      if (aClean !== bClean) {
        return aClean ? -1 : 1;
      }

      if (b.prestigePoints !== a.prestigePoints) return b.prestigePoints - a.prestigePoints;
      return a.cards.length - b.cards.length;
    });

    if (scoreboardEl) {
      scoreboardEl.innerHTML = '';
      scoreboardEl.style.display = 'flex';
      scoreboardEl.style.flexDirection = 'column';
      scoreboardEl.style.gap = '8px';
      scoreboardEl.style.margin = '16px 0';

      ranked.forEach((p, idx) => {
        const isWin = p.id === winner.id;
        const debtCount = p.reservedCards ? p.reservedCards.length : 0;
        const hasDebt = debtCount > 0;

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.background = isWin ? 'rgba(212, 175, 55, 0.2)' : (hasDebt ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0,0,0,0.3)');
        row.style.border = isWin ? '1px solid var(--gold-bright)' : (hasDebt ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--wood-border)');
        row.style.borderRadius = 'var(--radius-sm)';
        row.style.padding = '8px 12px';

        const noblePts = (p.nobles.length) * 3;
        const cardPts = p.prestigePoints - noblePts;

        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-family:var(--font-serif-royal);font-weight:900;color:${isWin ? 'var(--gold-bright)' : 'var(--text-parchment-muted)'};font-size:16px;">#${idx + 1}</span>
            <img style="width:30px;height:30px;border-radius:50%;border:1px solid ${isWin ? 'var(--gold-primary)' : 'var(--wood-border)'};" src="${p.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%236b4423'/%3E%3Ctext x='50' y='60' font-size='40' text-anchor='middle' fill='%23e6c387'%3E👤%3C/text%3E%3C/svg%3E"}">
            <div>
              <span style="font-weight:700;color:var(--text-parchment);">${p.name} ${isWin ? '🏆' : ''}</span>
              ${hasDebt ? `<span style="display:inline-block;background:rgba(239,68,68,0.25);border:1px solid #ef4444;color:#fca5a5;font-size:10px;padding:1px 6px;border-radius:4px;margin-left:6px;font-weight:600;">⚠️ Nợ ${debtCount} thẻ</span>` : ''}
              ${hasDebt && p.prestigePoints >= 15 && !isWin ? `<div style="font-size:10px;color:#f87171;margin-top:2px;">(Không thể thắng do còn nợ bài)</div>` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--font-serif-royal);font-size:18px;font-weight:900;color:${isWin ? 'var(--gold-bright)' : 'var(--text-parchment)'};">${p.prestigePoints} Điểm</div>
            <div style="font-size:10px;color:var(--text-parchment-muted);">Thẻ: ${cardPts}đ | Quý tộc: ${noblePts}đ | Tổng ${p.cards.length} thẻ</div>
          </div>
        `;

        scoreboardEl.appendChild(row);
      });
    }

    // Cập nhật thống kê người dùng hiện tại
    const isMeWinner = gameState.players[0].id === winner.id;
    SplendorHelpers.recordGameFinished(isMeWinner, gameState.players[0].prestigePoints);
    SplendorHomeScreen.updateStats();

    window.SplendorApp.showScreen('result');
  }
}

window.SplendorResultScreen = new ResultScreen();
