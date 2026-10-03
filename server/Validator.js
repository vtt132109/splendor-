/**
 * Splendor Board Game - Trình Kiểm Tra Tính Hợp Lệ Của Hành Động (Validator)
 * Đảm bảo mọi nước đi đều tuân thủ 100% luật chơi Splendor
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    const Constants = require('../shared/constants');
    module.exports = factory(Constants);
  } else {
    root.SplendorValidator = factory(root.SplendorConstants);
  }
}(typeof self !== 'undefined' ? self : this, function(Constants) {

  const {
    BASE_GEMS,
    ALL_TOKENS,
    GAME_RULES,
    GAME_PHASES
  } = Constants;

  class Validator {
    /**
     * Kiểm tra lượt của người chơi và giai đoạn game
     */
    static checkTurnAndPhase(gameState, playerIndex) {
      if (gameState.phase === GAME_PHASES.FINISHED) {
        return { valid: false, error: 'Trận đấu đã kết thúc!' };
      }
      if (gameState.currentPlayerIndex !== playerIndex && gameState.phase === GAME_PHASES.PLAYING) {
        return { valid: false, error: 'Chưa đến lượt của bạn!' };
      }
      return { valid: true };
    }

    /**
     * 1. Kiểm tra hành động Lấy 3 viên đá quý khác màu
     */
    static validateTakeThreeGems(gameState, playerIndex, gems) {
      const basic = this.checkTurnAndPhase(gameState, playerIndex);
      if (!basic.valid) return basic;

      if (!Array.isArray(gems) || gems.length === 0) {
        return { valid: false, error: 'Vui lòng chọn ít nhất 1 viên đá quý.' };
      }

      // Không được chọn vàng
      if (gems.includes('gold')) {
        return { valid: false, error: 'Không thể lấy Vàng đại diện bằng hành động này (Vàng chỉ nhận khi Giữ Thẻ).' };
      }

      // Các loại ngọc phải thuộc 5 loại cơ bản
      for (const g of gems) {
        if (!BASE_GEMS.includes(g)) {
          return { valid: false, error: `Loại đá quý không hợp lệ: ${g}` };
        }
      }

      // Phải khác màu nhau
      const uniqueGems = new Set(gems);
      if (uniqueGems.size !== gems.length) {
        return { valid: false, error: 'Các viên đá quý lấy phải khác màu nhau.' };
      }

      // Đếm số loại ngọc còn trong kho
      const availableColors = BASE_GEMS.filter(g => (gameState.bank[g] || 0) > 0);
      const maxCanTake = Math.min(3, availableColors.length);

      if (gems.length > 3) {
        return { valid: false, error: 'Chỉ được lấy tối đa 3 viên đá quý khác màu.' };
      }

      if (gems.length < maxCanTake) {
        return { valid: false, error: `Kho còn ${availableColors.length} loại đá quý, bạn phải chọn đủ ${maxCanTake} viên khác màu.` };
      }

      // Kiểm tra kho có đủ số lượng từng viên không
      for (const g of gems) {
        if ((gameState.bank[g] || 0) < 1) {
          return { valid: false, error: `Đá quý màu ${g} trong kho đã hết!` };
        }
      }

      return { valid: true };
    }

    /**
     * 2. Kiểm tra hành động Lấy 2 viên đá quý cùng màu
     */
    static validateTakeTwoSameGems(gameState, playerIndex, gem) {
      const basic = this.checkTurnAndPhase(gameState, playerIndex);
      if (!basic.valid) return basic;

      if (!BASE_GEMS.includes(gem)) {
        return { valid: false, error: 'Chỉ được lấy 2 viên đá quý từ 5 loại màu cơ bản (không áp dụng cho Vàng).' };
      }

      const countInBank = gameState.bank[gem] || 0;
      if (countInBank < GAME_RULES.MIN_TOKENS_FOR_DOUBLE_TAKE) {
        return {
          valid: false,
          error: `Chỉ được lấy 2 viên cùng màu khi kho còn từ 4 viên trở lên (hiện chỉ còn ${countInBank} viên).`
        };
      }

      return { valid: true };
    }

    /**
     * 3. Kiểm tra hành động Giữ chỗ thẻ (Reserve Card)
     */
    static validateReserveCard(gameState, playerIndex, { tier, cardId, isDeckTop = false }) {
      const basic = this.checkTurnAndPhase(gameState, playerIndex);
      if (!basic.valid) return basic;

      const player = gameState.players[playerIndex];
      if (player.reservedCards.length >= GAME_RULES.MAX_RESERVED_CARDS) {
        return { valid: false, error: `Bạn chỉ được giữ tối đa ${GAME_RULES.MAX_RESERVED_CARDS} thẻ bài cùng lúc.` };
      }

      tier = parseInt(tier);
      if (![1, 2, 3].includes(tier)) {
        return { valid: false, error: 'Cấp độ thẻ không hợp lệ (phải là 1, 2 hoặc 3).' };
      }

      if (isDeckTop) {
        if (gameState.decks[tier].length === 0) {
          return { valid: false, error: `Bộ bài tầng ${tier} đã hết, không thể rút úp!` };
        }
      } else {
        const boardTierCards = gameState.boardCards[tier] || [];
        const cardExists = boardTierCards.some(c => c && c.id === cardId);
        if (!cardExists) {
          return { valid: false, error: 'Thẻ bài này không tồn tại trên bàn chơi!' };
        }
      }

      return { valid: true };
    }

    /**
     * 4. Kiểm tra hành động Mua thẻ bài (Purchase Card)
     */
    static validatePurchaseCard(gameState, playerIndex, { cardId, fromReserved = false }) {
      const basic = this.checkTurnAndPhase(gameState, playerIndex);
      if (!basic.valid) return basic;

      const player = gameState.players[playerIndex];
      let targetCard = null;
      let cardTier = null;

      if (fromReserved) {
        targetCard = player.reservedCards.find(c => c.id === cardId);
        if (!targetCard) {
          return { valid: false, error: 'Thẻ bài không nằm trong danh sách đã giữ chỗ của bạn!' };
        }
      } else {
        for (let t = 1; t <= 3; t++) {
          const found = (gameState.boardCards[t] || []).find(c => c && c.id === cardId);
          if (found) {
            targetCard = found;
            cardTier = t;
            break;
          }
        }
        if (!targetCard) {
          return { valid: false, error: 'Thẻ bài không còn trên bàn chơi!' };
        }
      }

      // Kiểm tra khả năng thanh toán (tính cả bonus và vàng đa năng)
      const payment = gameState.calculateCardPayment(player, targetCard);
      if (!payment.canAfford) {
        return {
          valid: false,
          error: 'Bạn không đủ đá quý và vàng để mua thẻ bài này!',
          payment
        };
      }

      return { valid: true, card: targetCard, cardTier, payment };
    }

    /**
     * 5. Kiểm tra việc Trả đá quý thừa (khi > 10 viên)
     */
    static validateDiscardTokens(gameState, playerIndex, tokensToDiscard) {
      if (gameState.phase !== GAME_PHASES.DISCARDING) {
        return { valid: false, error: 'Hiện không ở giai đoạn trả đá quý thừa.' };
      }

      if (gameState.discardingPlayerIndex !== playerIndex) {
        return { valid: false, error: 'Chưa đến lượt bạn trả đá quý.' };
      }

      const player = gameState.players[playerIndex];
      let totalDiscard = 0;

      for (const [gem, count] of Object.entries(tokensToDiscard)) {
        if (!ALL_TOKENS.includes(gem)) {
          return { valid: false, error: `Loại token không hợp lệ: ${gem}` };
        }
        const c = parseInt(count) || 0;
        if (c < 0) {
          return { valid: false, error: 'Số lượng trả không thể âm.' };
        }
        if (c > (player.tokens[gem] || 0)) {
          return { valid: false, error: `Bạn không có đủ ${c} viên ${gem} để trả.` };
        }
        totalDiscard += c;
      }

      if (totalDiscard !== gameState.discardExcessCount) {
        return {
          valid: false,
          error: `Bạn cần trả đúng ${gameState.discardExcessCount} viên đá quý (hiện đã chọn ${totalDiscard} viên).`
        };
      }

      return { valid: true };
    }

    /**
     * 6. Kiểm tra việc Chọn Quý Tộc
     */
    static validateSelectNoble(gameState, playerIndex, nobleId) {
      if (gameState.phase !== GAME_PHASES.SELECTING_NOBLE) {
        return { valid: false, error: 'Hiện không ở giai đoạn chọn quý tộc.' };
      }
      if (gameState.currentPlayerIndex !== playerIndex) {
        return { valid: false, error: 'Chưa đến lượt bạn chọn quý tộc.' };
      }

      const noble = gameState.pendingNobles.find(n => n.id === nobleId);
      if (!noble) {
        return { valid: false, error: 'Vị quý tộc này không nằm trong danh sách đủ điều kiện!' };
      }

      return { valid: true, noble };
    }
  }

  return Validator;
}));
