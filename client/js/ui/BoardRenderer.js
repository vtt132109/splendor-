/**
 * Splendor Board Game - Điều Phối Vẽ Bàn Chơi Toàn Diện (BoardRenderer.js)
 */

class BoardRenderer {
  constructor() {
    this.gameState = null;
    this.myPlayerIndex = 0; // Vị trí người chơi trên máy này
  }

  /**
   * Cập nhật toàn bộ bàn chơi theo GameState mới nhất
   */
  render(gameState, myPlayerIndex = 0) {
    this.gameState = gameState;
    this.myPlayerIndex = myPlayerIndex;
    window.currentGameState = gameState;

    const currentPlayer = gameState.getCurrentPlayer();
    const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex;

    // 1. Cập nhật banner thông báo lượt
    const turnAnnouncerEl = document.getElementById('turn-announcer');
    const turnTextEl = document.getElementById('turn-text');
    const roundBadgeEl = document.getElementById('round-status-badge');

    if (turnAnnouncerEl) {
      turnAnnouncerEl.classList.toggle('my-turn', isMyTurn);
    }

    if (turnTextEl) {
      if (gameState.phase === SplendorConstants.GAME_PHASES.DISCARDING) {
        const discPlayer = gameState.players[gameState.discardingPlayerIndex];
        const isMeDiscard = gameState.discardingPlayerIndex === myPlayerIndex;
        if (isMeDiscard) {
          turnTextEl.textContent = `⚠️ BẠN CẦN TRẢ ${gameState.discardExcessCount} VIÊN ĐÁ QUÝ THỪA VỀ KHO!`;
          turnTextEl.style.color = '#f59e0b';
        } else {
          turnTextEl.textContent = `⏳ Đang đợi ${discPlayer ? discPlayer.name : 'đối thủ'} trả ${gameState.discardExcessCount} đá quý thừa...`;
          turnTextEl.style.color = '#f59e0b';
        }
      } else if (gameState.phase === SplendorConstants.GAME_PHASES.SELECTING_NOBLE) {
        const selPlayer = gameState.getCurrentPlayer();
        const isMeSelect = gameState.currentPlayerIndex === myPlayerIndex;
        if (isMeSelect) {
          turnTextEl.textContent = `👑 BẠN HÃY CHỌN 1 QUÝ TỘC ĐỂ DIỆN KIẾN (+3 ĐIỂM)!`;
          turnTextEl.style.color = 'var(--gold-bright)';
        } else {
          turnTextEl.textContent = `👑 Đang đợi ${selPlayer ? selPlayer.name : 'đối thủ'} chọn Quý tộc diện kiến...`;
          turnTextEl.style.color = 'var(--gold-light)';
        }
      } else if (gameState.isFinalRound) {
        turnTextEl.textContent = `🔥 VÒNG CUỐI: Lượt của ${currentPlayer.name} ${isMyTurn ? '(✦ LƯỢT CỦA BẠN! ✦)' : ''}`;
        turnTextEl.style.color = '#ef4444';
      } else {
        turnTextEl.textContent = `Lượt của: ${currentPlayer.name} ${isMyTurn ? '(✦ LƯỢT CỦA BẠN ✦)' : ''}`;
        turnTextEl.style.color = isMyTurn ? 'var(--gold-bright)' : 'var(--gold-light)';
      }
    }

    if (roundBadgeEl) {
      roundBadgeEl.textContent = `Vòng ${gameState.round}`;
    }

    // 2. Vẽ các ô Quý tộc
    SplendorNobleRenderer.renderNobles(gameState.nobles, currentPlayer);

    // 3. Vẽ ma trận thẻ bài 3 tầng
    SplendorCardRenderer.renderBoard(
      gameState.boardCards,
      gameState.deckCounts || { 1: gameState.decks[1].length, 2: gameState.decks[2].length, 3: gameState.decks[3].length },
      gameState.players[myPlayerIndex],
      isMyTurn
    );

    // 4. Vẽ kho đá quý (Bank)
    SplendorTokenRenderer.renderBank(gameState.bank, isMyTurn);

    // 5. Vẽ bảng điều khiển người chơi ở đáy
    SplendorPlayerPanel.renderCurrentPlayerMat(gameState.players[myPlayerIndex], isMyTurn);

    // 6. Vẽ danh sách các đối thủ
    SplendorPlayerPanel.renderOpponents(gameState.players, gameState.currentPlayerIndex, myPlayerIndex);

    // 7. Kiểm tra nếu đang ở giai đoạn trả đá quý thừa
    if (gameState.phase === SplendorConstants.GAME_PHASES.DISCARDING) {
      this.handleDiscardPhase(gameState, myPlayerIndex);
    } else {
      const discardModal = document.getElementById('discard-modal');
      if (discardModal) discardModal.classList.add('hidden');
    }

    // 8. Kiểm tra nếu đang ở giai đoạn chọn quý tộc
    if (gameState.phase === SplendorConstants.GAME_PHASES.SELECTING_NOBLE && gameState.currentPlayerIndex === myPlayerIndex) {
      SplendorNobleRenderer.openNobleSelectModal(gameState.pendingNobles, (nobleId) => {
        if (window.onSelectNobleAction) {
          window.onSelectNobleAction(nobleId);
        }
      });
    }
  }

  /**
   * Xử lý hiển thị modal trả đá quý thừa khi vượt 10 viên
   */
  handleDiscardPhase(gameState, myPlayerIndex) {
    const modal = document.getElementById('discard-modal');
    if (!modal) return;

    if (gameState.discardingPlayerIndex !== myPlayerIndex) {
      modal.classList.add('hidden');
      return;
    }

    const player = gameState.players[myPlayerIndex];
    const excess = gameState.discardExcessCount;
    const totalNow = gameState.getPlayerTotalTokens(player);

    const totalNowEl = document.getElementById('discard-total-now');
    const neededEl = document.getElementById('discard-needed-count');
    const container = document.getElementById('discard-selection-container');
    const confirmBtn = document.getElementById('btn-confirm-discard');

    if (totalNowEl) totalNowEl.textContent = totalNow;
    if (neededEl) neededEl.textContent = excess;

    const selectedDiscard = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 };

    const updateDiscardUI = () => {
      let currentSelectedCount = Object.values(selectedDiscard).reduce((a, b) => a + b, 0);
      confirmBtn.disabled = currentSelectedCount !== excess;

      container.innerHTML = '';
      container.style.display = 'flex';
      container.style.gap = '10px';
      container.style.justifyContent = 'center';
      container.style.margin = '14px 0';

      const { ALL_TOKENS, GEM_INFO_VI } = SplendorConstants;

      for (const gem of ALL_TOKENS) {
        const playerHas = player.tokens[gem] || 0;
        if (playerHas === 0) continue;

        const info = GEM_INFO_VI[gem];
        const countToDiscard = selectedDiscard[gem];

        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'center';
        item.style.gap = '4px';

        item.innerHTML = `
          <div class="gem-chip mini-chip type-${gem}">
            <span class="chip-icon">${info.icon}</span>
            <span class="chip-count-badge">${playerHas}</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <button class="btn-wood-small btn-dec" style="padding:2px 6px;">-</button>
            <span style="font-weight:800;color:var(--gold-bright);min-width:14px;text-align:center;">${countToDiscard}</span>
            <button class="btn-wood-small btn-inc" style="padding:2px 6px;">+</button>
          </div>
        `;

        item.querySelector('.btn-dec').addEventListener('click', () => {
          if (selectedDiscard[gem] > 0) {
            selectedDiscard[gem]--;
            updateDiscardUI();
          }
        });

        item.querySelector('.btn-inc').addEventListener('click', () => {
          if (selectedDiscard[gem] < playerHas && currentSelectedCount < excess) {
            selectedDiscard[gem]++;
            updateDiscardUI();
          }
        });

        container.appendChild(item);
      }
    };

    updateDiscardUI();

    confirmBtn.onclick = () => {
      modal.classList.add('hidden');
      if (window.onConfirmDiscardAction) {
        window.onConfirmDiscardAction(selectedDiscard);
      }
    };

    modal.classList.remove('hidden');
  }
}

window.SplendorBoardRenderer = new BoardRenderer();
