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
        if (selected.length === 0) return;

        // Nếu đang trong trận đấu Online
        if (this.gameState && this.gameState.mode === 'ONLINE') {
          if (this.gameState.currentPlayerIndex !== this.myPlayerIndex) {
            SplendorHelpers.showToast('Chưa đến lượt của bạn!', 'warning');
            return;
          }

          const actionType = (selected.length === 2 && selected[0] === selected[1])
            ? 'TAKE_TWO_SAME_GEMS'
            : 'TAKE_THREE_GEMS';
          const actionData = (actionType === 'TAKE_TWO_SAME_GEMS')
            ? { gem: selected[0] }
            : { gems: selected };

          SplendorSocket.sendGameAction(actionType, actionData).then(res => {
            if (res && res.success === false) {
              SplendorHelpers.showToast(res.error || 'Hành động không hợp lệ!', 'error');
            } else {
              SplendorTokenRenderer.clearSelection();
            }
          });
          return;
        }

        // Chế độ Local / AI
        if (!this.gameEngine) return;
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

        SplendorSound.playTakeChip();
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
      // Nếu đang trong trận đấu Online
      if (this.gameState && this.gameState.mode === 'ONLINE') {
        if (this.gameState.currentPlayerIndex !== this.myPlayerIndex) {
          SplendorHelpers.showToast('Chưa đến lượt của bạn!', 'warning');
          return;
        }

        SplendorSocket.sendGameAction('PURCHASE_CARD', { cardId, fromReserved }).then(res => {
          if (res && res.success === false) {
            SplendorHelpers.showToast(res.error || 'Không thể mua thẻ bài!', 'error');
          }
        });
        return;
      }

      // Chế độ Local / AI
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
      // Nếu đang trong trận đấu Online
      if (this.gameState && this.gameState.mode === 'ONLINE') {
        if (this.gameState.currentPlayerIndex !== this.myPlayerIndex) {
          SplendorHelpers.showToast('Chưa đến lượt của bạn!', 'warning');
          return;
        }

        SplendorSocket.sendGameAction('RESERVE_CARD', { tier, cardId, isDeckTop: false }).then(res => {
          if (res && res.success === false) {
            SplendorHelpers.showToast(res.error || 'Không thể giữ chỗ thẻ bài!', 'error');
          } else {
            SplendorHelpers.showToast('Đã giữ chỗ thẻ bài vào tay!', 'info');
          }
        });
        return;
      }

      // Chế độ Local / AI
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
      // Nếu đang trong trận đấu Online
      if (this.gameState && this.gameState.mode === 'ONLINE') {
        SplendorSocket.sendGameAction('DISCARD_TOKENS', { tokens: tokensToDiscard }).then(res => {
          if (res && res.success === false) {
            SplendorHelpers.showToast(res.error || 'Lỗi trả đá quý!', 'error');
          }
        });
        return;
      }

      // Chế độ Local / AI
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
      // Nếu đang trong trận đấu Online
      if (this.gameState && this.gameState.mode === 'ONLINE') {
        SplendorSocket.sendGameAction('SELECT_NOBLE', { nobleId }).then(res => {
          if (res && res.success === false) {
            SplendorHelpers.showToast(res.error || 'Lỗi chọn quý tộc!', 'error');
          }
        });
        return;
      }

      // Chế độ Local / AI
      if (!this.gameEngine) return;
      const result = this.gameEngine.selectNoble(this.gameState.currentPlayerIndex, nobleId);
      if (result?.valid === false) {
        SplendorHelpers.showToast(result.error, 'error');
        return;
      }
      SplendorSound.playNobleVisit();
      this.onAfterAction(result);
    };

    // 6. Lắng nghe cập nhật trạng thái bàn cờ từ máy chủ (Online Multiplayer)
    SplendorSocket.on('game:state_updated', (data) => {
      if (!this.gameState || this.gameState.mode !== 'ONLINE') return;
      this.onServerStateUpdated(data);
    });
  }

  /**
   * Khởi chạy trận đấu mới (Chế độ Local hoặc AI)
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

  /**
   * Khởi tạo bàn chơi Online trực tiếp từ GameState có thẩm quyền của Server
   */
  initFromOnlineState(serverGameState, myIndex = 0) {
    this.myPlayerIndex = myIndex;
    this.gameState = SplendorGameState.fromJSON(serverGameState);
    this.gameEngine = new SplendorGameEngine(this.gameState);

    // Vẽ bàn chơi
    this.render();

    const currentP = this.gameState.getCurrentPlayer();
    const isMe = this.gameState.currentPlayerIndex === this.myPlayerIndex;
    SplendorHelpers.showToast(`Bắt đầu trận đấu Online! Lượt đầu: ${currentP ? currentP.name : 'Người chơi'} ${isMe ? '(✦ Lượt của bạn! ✦)' : ''}`, 'info');

    if (isMe) {
      SplendorSound.playTurnBell();
    }
  }

  /**
   * Cập nhật trạng thái trận đấu Online khi nhận dữ liệu từ server
   */
  onServerStateUpdated(data) {
    if (!data || !data.gameState) return;

    const prevPlayerIdx = this.gameState ? this.gameState.currentPlayerIndex : -1;
    this.gameState = SplendorGameState.fromJSON(data.gameState);
    this.gameEngine = new SplendorGameEngine(this.gameState);

    const lastAction = data.lastAction;
    if (lastAction) {
      if (lastAction.actionType === 'PURCHASE_CARD') {
        SplendorSound.playCardBuy();
      } else if (lastAction.actionType === 'TAKE_THREE_GEMS' || lastAction.actionType === 'TAKE_TWO_SAME_GEMS') {
        SplendorSound.playTakeChip();
      } else if (lastAction.result?.nobleVisit) {
        SplendorSound.playNobleVisit();
        SplendorHelpers.showToast(`Quý tộc ${lastAction.result.nobleVisit.name} đã ghé thăm!`, 'success');
      }
    }

    this.render();

    // Kiểm tra kết thúc game
    if (this.gameState.phase === SplendorConstants.GAME_PHASES.FINISHED) {
      SplendorSound.playVictory();
      window.SplendorResultScreen.showResult(this.gameState);
      return;
    }

    // Thông báo chuông khi lượt vừa chuyển sang mình
    if (this.gameState.currentPlayerIndex === this.myPlayerIndex && prevPlayerIdx !== this.myPlayerIndex) {
      SplendorSound.playTurnBell();
      SplendorHelpers.showToast('✨ Đến lượt của bạn!', 'info');
    }
  }

  render() {
    if (!this.gameState) return;
    SplendorBoardRenderer.render(this.gameState, this.myPlayerIndex);
  }

  /**
   * Xử lý sau mỗi hành động thành công (Local / AI)
   */
  onAfterAction(result) {
    if (!result) return;

    // Xác định người chơi vừa thực hiện hành động
    let actingPlayerIndex = -1;
    if (result.playerIndex !== undefined) {
      actingPlayerIndex = result.playerIndex;
    } else {
      // Sau khi kết thúc lượt, currentPlayerIndex đã chuyển sang người tiếp theo
      actingPlayerIndex = (this.gameState.currentPlayerIndex - 1 + this.gameState.players.length) % this.gameState.players.length;
    }
    const actingPlayer = this.gameState.players[actingPlayerIndex];

    // Phát âm thanh và hiển thị thông báo hành động
    if (result.actionType === 'TAKE_THREE_GEMS' || result.actionType === 'TAKE_TWO_SAME_GEMS') {
      SplendorSound.playTakeChip();
    } else if (result.actionType === 'PURCHASE_CARD') {
      SplendorSound.playCardBuy();
    }

    // Nếu người vừa đi là Máy (AI), thông báo rõ ràng cho người chơi biết máy vừa làm gì
    if (actingPlayer && actingPlayer.isAI) {
      const { GEM_INFO_VI } = SplendorConstants;
      let aiDesc = '';

      if (result.actionType === 'TAKE_THREE_GEMS' && result.actionData?.gems) {
        const names = result.actionData.gems.map(g => GEM_INFO_VI[g]?.name || g).join(', ');
        aiDesc = `🤖 ${actingPlayer.name} đã lấy 3 đá quý: ${names}`;
      } else if (result.actionType === 'TAKE_TWO_SAME_GEMS' && result.actionData?.gem) {
        aiDesc = `🤖 ${actingPlayer.name} đã lấy 2 viên ${GEM_INFO_VI[result.actionData.gem]?.name || result.actionData.gem}`;
      } else if (result.actionType === 'PURCHASE_CARD') {
        const pts = result.card?.points || result.actionData?.card?.points || 0;
        aiDesc = `🤖 ${actingPlayer.name} đã mua 1 thẻ phát triển${pts > 0 ? ` (+${pts} điểm)` : ''}!`;
      } else if (result.actionType === 'RESERVE_CARD') {
        aiDesc = `🤖 ${actingPlayer.name} đã giữ chỗ 1 thẻ bài vào tay!`;
      } else if (result.mustDiscard) {
        aiDesc = `🤖 ${actingPlayer.name} đang trả lại ${result.excessCount} đá quý thừa...`;
      }

      if (aiDesc) {
        SplendorHelpers.showToast(aiDesc, 'info', 2800);
      }
    }

    // Nếu có Quý tộc ghé thăm
    if (result?.nobleVisit) {
      SplendorSound.playNobleVisit();
      SplendorHelpers.showToast(`Quý tộc ${result.nobleVisit.name} đã ghé thăm ${actingPlayer?.name || ''} (+3 điểm uy tín)!`, 'success', 3000);
    }

    // Cập nhật giao diện bàn chơi
    this.render();

    // Kiểm tra kết thúc game
    if (this.gameState.phase === SplendorConstants.GAME_PHASES.FINISHED) {
      SplendorSound.playVictory();
      window.SplendorResultScreen.showResult(this.gameState);
      return;
    }

    // Nếu ở chế độ Chuyền tay (Local)
    if (this.gameState.mode === 'LOCAL') {
      this.myPlayerIndex = this.gameState.currentPlayerIndex;
      this.render();
      SplendorSound.playTurnBell();
    }
    // Nếu ở chế độ Đấu với Máy (AI) và lượt vừa quay trở lại Người chơi thật
    else if (this.gameState.mode === 'AI' && this.gameState.currentPlayerIndex === this.myPlayerIndex) {
      SplendorSound.playTurnBell();
      SplendorHelpers.showToast('✨ Đến lượt của bạn!', 'info', 2000);
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
      // Hiển thị trạng thái máy đang suy nghĩ trên banner thông báo
      const turnTextEl = document.getElementById('turn-text');
      if (turnTextEl) {
        turnTextEl.textContent = `🤖 ${currentPlayer.name} đang suy nghĩ chiến thuật...`;
        turnTextEl.style.color = '#f59e0b';
      }

      // Làm nổi bật thẻ của bot đang đi
      const allOppCards = document.querySelectorAll('#opponents-container .opponent-card');
      allOppCards.forEach(card => card.classList.remove('ai-thinking'));
      const activeBotCard = document.querySelector(`#opponents-container .opponent-card.active-turn`);
      if (activeBotCard) activeBotCard.classList.add('ai-thinking');

      SplendorAIPlayer.executeTurn(this.gameState, this.gameState.currentPlayerIndex, this.gameEngine, (res) => {
        this.onAfterAction(res);
      });
    }
  }
}

window.SplendorGameScreen = new GameScreen();
