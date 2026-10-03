/**
 * Splendor Board Game - Bộ Điều Khiển Trận Đấu Game (GameScreen.js)
 */

class GameScreen {
  constructor() {
    this.gameState = null;
    this.gameEngine = null;
    this.myPlayerIndex = 0;
    this.initActionHooks();
  }

  initActionHooks() {
    // 1. Lấy đá quý từ kho
    const confirmBtn = document.getElementById('btn-confirm-take-gems');
    const cancelBtn = document.getElementById('btn-cancel-gem-select');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const selected = SplendorTokenRenderer.selectedGems;
        if (!this.gameEngine || selected.length === 0) return;

        let result = null;
        if (selected.length === 2 && selected[0] === selected[1]) {
          result = this.gameEngine.takeTwoSameGems(this.gameState.currentPlayerIndex, selected[0]);
        } else {
          result = this.gameEngine.takeThreeGems(this.gameState.currentPlayerIndex, selected);
        }

        if (result?.valid === false) {
          SplendorHelpers.showToast(result.error, 'error');
          return;
        }

        SplendorTokenRenderer.clearSelection();
        this.onAfterAction(result);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        SplendorTokenRenderer.clearSelection();
      });
    }

    // 2. Mua thẻ bài
    SplendorCardRenderer.onPurchaseCard = (cardId, fromReserved) => {
      if (!this.gameEngine) return;
      const result = this.gameEngine.purchaseCard(this.gameState.currentPlayerIndex, { cardId, fromReserved });
      if (result?.valid === false) {
        SplendorHelpers.showToast(result.error, 'error');
        return;
      }
      SplendorSound.playCardBuy();
      this.onAfterAction(result);
    };

    // 3. Giữ chỗ thẻ bài
    SplendorCardRenderer.onReserveCard = (tier, cardId) => {
      if (!this.gameEngine) return;
      const result = this.gameEngine.reserveCard(this.gameState.currentPlayerIndex, { tier, cardId, isDeckTop: false });
      if (result?.valid === false) {
        SplendorHelpers.showToast(result.error, 'error');
        return;
      }
      SplendorHelpers.showToast('Đã giữ chỗ thẻ bài vào tay!', 'info');
      this.onAfterAction(result);
    };

    // 4. Hook trả đá quý thừa
    window.onConfirmDiscardAction = (tokensToDiscard) => {
      if (!this.gameEngine) return;
      const result = this.gameEngine.discardTokens(this.gameState.discardingPlayerIndex, tokensToDiscard);
      if (result?.valid === false) {
        SplendorHelpers.showToast(result.error, 'error');
        return;
      }
      this.onAfterAction(result);
    };

    // 5. Hook chọn quý tộc khi có nhiều vị đủ điều kiện
    window.onSelectNobleAction = (nobleId) => {
      if (!this.gameEngine) return;
      const result = this.gameEngine.selectNoble(this.gameState.currentPlayerIndex, nobleId);
      if (result?.valid === false) {
        SplendorHelpers.showToast(result.error, 'error');
        return;
      }
      SplendorSound.playNobleVisit();
      this.onAfterAction(result);
    };
  }

  /**
   * Khởi chạy trận đấu mới
   */
  startNewGame(playerConfigs, mode = 'LOCAL', myIndex = 0) {
    this.myPlayerIndex = myIndex;
    this.gameState = SplendorGameState.createNewGame(playerConfigs, mode);
    this.gameEngine = new SplendorGameEngine(this.gameState);

    // Vẽ bàn chơi
    this.render();

    SplendorHelpers.showToast(`Bắt đầu trận đấu Splendor! Lượt đầu tiên: ${this.gameState.getCurrentPlayer().name}`, 'info');

    // Nếu người chơi đầu tiên là AI
    this.checkAndRunAITurn();
  }

  render() {
    if (!this.gameState) return;
    SplendorBoardRenderer.render(this.gameState, this.myPlayerIndex);
  }

  /**
   * Xử lý sau mỗi hành động thành công
   */
  onAfterAction(result) {
    // Nếu có Quý tộc ghé thăm
    if (result?.nobleVisit) {
      SplendorSound.playNobleVisit();
      SplendorHelpers.showToast(`Quý tộc ${result.nobleVisit.name} đã ghé thăm (+3 điểm uy tín)!`, 'success');
    }

    this.render();

    // Kiểm tra kết thúc game
    if (this.gameState.phase === SplendorConstants.GAME_PHASES.FINISHED) {
      SplendorSound.playVictory();
      window.SplendorResultScreen.showResult(this.gameState);
      return;
    }

    // Nếu ở chế độ Chuyền tay (Local) giữa nhiều người chơi người thật
    if (this.gameState.mode === 'LOCAL') {
      this.myPlayerIndex = this.gameState.currentPlayerIndex;
      this.render();
      SplendorSound.playTurnBell();
    }

    // Kiểm tra nếu đến lượt của AI
    this.checkAndRunAITurn();
  }

  /**
   * Kiểm tra và tự động thực thi lượt của AI Bot
   */
  checkAndRunAITurn() {
    if (!this.gameState || this.gameState.phase === SplendorConstants.GAME_PHASES.FINISHED) return;

    const currentPlayer = this.gameState.getCurrentPlayer();
    if (currentPlayer && currentPlayer.isAI) {
      SplendorAIPlayer.executeTurn(this.gameState, this.gameState.currentPlayerIndex, this.gameEngine, (res) => {
        this.onAfterAction(res);
      });
    }
  }
}

window.SplendorGameScreen = new GameScreen();
