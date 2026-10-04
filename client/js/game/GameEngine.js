/**
 * Splendor Board Game - Động Cơ Luật Chơi Chính (GameEngine)
 * Xử lý mọi thao tác: Lấy ngọc, giữ thẻ, mua thẻ, trả ngọc thừa, quý tộc ghé thăm, vòng cuối
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    const GameState = require('./GameState');
    const Validator = require('./Validator');
    const Constants = require('../shared/constants');
    module.exports = factory(GameState, Validator, Constants);
  } else {
    root.SplendorGameEngine = factory(root.SplendorGameState, root.SplendorValidator, root.SplendorConstants);
  }
}(typeof self !== 'undefined' ? self : this, function(GameState, Validator, Constants) {

  const {
    BASE_GEMS,
    ALL_TOKENS,
    GAME_RULES,
    GAME_PHASES,
    ACTION_TYPES
  } = Constants;

  class GameEngine {
    constructor(gameState) {
      this.state = gameState;
    }

    /**
     * 1. LẤY 3 VIÊN ĐÁ QUÝ KHÁC MÀU
     */
    takeThreeGems(playerIndex, gems) {
      const validation = Validator.validateTakeThreeGems(this.state, playerIndex, gems);
      if (!validation.valid) return validation;

      const player = this.state.players[playerIndex];

      // Thực hiện trừ kho và cộng cho người chơi
      for (const g of gems) {
        this.state.bank[g]--;
        player.tokens[g] = (player.tokens[g] || 0) + 1;
      }

      this.logTurn(player, `đã lấy 3 viên đá quý: ${gems.join(', ')}`);

      return this.handlePostAction(playerIndex, ACTION_TYPES.TAKE_THREE_GEMS, { gems });
    }

    /**
     * 2. LẤY 2 VIÊN ĐÁ QUÝ CÙNG MÀU
     */
    takeTwoSameGems(playerIndex, gem) {
      const validation = Validator.validateTakeTwoSameGems(this.state, playerIndex, gem);
      if (!validation.valid) return validation;

      const player = this.state.players[playerIndex];

      this.state.bank[gem] -= 2;
      player.tokens[gem] = (player.tokens[gem] || 0) + 2;

      this.logTurn(player, `đã lấy 2 viên đá quý cùng màu: ${gem}`);

      return this.handlePostAction(playerIndex, ACTION_TYPES.TAKE_TWO_SAME_GEMS, { gem });
    }

    /**
     * 3. GIỮ CHỖ THẺ BÀI (+ 1 VÀNG NẾU CÒN)
     */
    reserveCard(playerIndex, { tier, cardId, isDeckTop = false }) {
      const validation = Validator.validateReserveCard(this.state, playerIndex, { tier, cardId, isDeckTop });
      if (!validation.valid) return validation;

      const player = this.state.players[playerIndex];
      tier = parseInt(tier);
      let reservedCard = null;

      if (isDeckTop) {
        reservedCard = this.state.decks[tier].shift();
        this.logTurn(player, `đã giữ chỗ thẻ ẩn từ đầu bộ bài Tầng ${tier}`);
      } else {
        const boardRow = this.state.boardCards[tier];
        const cardIdx = boardRow.findIndex(c => c && c.id === cardId);
        reservedCard = boardRow[cardIdx];

        // Lấp chỗ trống từ bộ bài nếu còn thẻ
        if (this.state.decks[tier].length > 0) {
          boardRow[cardIdx] = this.state.decks[tier].shift();
        } else {
          boardRow[cardIdx] = null;
        }

        this.logTurn(player, `đã giữ chỗ thẻ Tầng ${tier} (cho bonus ${reservedCard.gem})`);
      }

      player.reservedCards.push(reservedCard);

      // Thưởng 1 viên Vàng đại diện nếu trong kho còn
      let goldReceived = false;
      if (this.state.bank.gold > 0) {
        this.state.bank.gold--;
        player.tokens.gold = (player.tokens.gold || 0) + 1;
        goldReceived = true;
      }

      return this.handlePostAction(playerIndex, ACTION_TYPES.RESERVE_CARD, {
        tier,
        card: reservedCard,
        goldReceived
      });
    }

    /**
     * 4. MUA THẺ BÀI (TỪ BÀN HOẶC TỪ DANH SÁCH GIỮ CHỖ)
     */
    purchaseCard(playerIndex, { cardId, fromReserved = false }) {
      const validation = Validator.validatePurchaseCard(this.state, playerIndex, { cardId, fromReserved });
      if (!validation.valid) return validation;

      const player = this.state.players[playerIndex];
      const { card, cardTier, payment } = validation;

      // Trả token đá quý và vàng vào lại kho
      for (const gem of BASE_GEMS) {
        const spent = payment.costTokens[gem] || 0;
        if (spent > 0) {
          player.tokens[gem] -= spent;
          this.state.bank[gem] += spent;
        }
      }
      if (payment.goldNeeded > 0) {
        player.tokens.gold -= payment.goldNeeded;
        this.state.bank.gold += payment.goldNeeded;
      }

      // Gỡ thẻ khỏi bàn hoặc danh sách giữ chỗ
      if (fromReserved) {
        const resIdx = player.reservedCards.findIndex(c => c.id === cardId);
        player.reservedCards.splice(resIdx, 1);
      } else {
        const boardRow = this.state.boardCards[cardTier];
        const cardIdx = boardRow.findIndex(c => c && c.id === cardId);
        if (this.state.decks[cardTier].length > 0) {
          boardRow[cardIdx] = this.state.decks[cardTier].shift();
        } else {
          boardRow[cardIdx] = null;
        }
      }

      // Thêm thẻ vào tài sản người chơi
      player.cards.push(card);
      player.bonuses[card.gem] = (player.bonuses[card.gem] || 0) + 1;
      player.prestigePoints += (card.points || 0);

      this.logTurn(player, `đã mua thẻ ${card.points} điểm (bonus ${card.gem})`);

      return this.handlePostAction(playerIndex, ACTION_TYPES.PURCHASE_CARD, { card, fromReserved, payment });
    }

    /**
     * 5. TRẢ ĐÁ QUÝ THỪA
     */
    discardTokens(playerIndex, tokensToDiscard) {
      const validation = Validator.validateDiscardTokens(this.state, playerIndex, tokensToDiscard);
      if (!validation.valid) return validation;

      const player = this.state.players[playerIndex];

      for (const [gem, count] of Object.entries(tokensToDiscard)) {
        const c = parseInt(count) || 0;
        if (c > 0) {
          player.tokens[gem] -= c;
          this.state.bank[gem] += c;
        }
      }

      this.logTurn(player, `đã trả lại kho ${this.state.discardExcessCount} viên đá quý`);

      this.state.phase = GAME_PHASES.PLAYING;
      this.state.discardingPlayerIndex = -1;
      this.state.discardExcessCount = 0;

      return this.checkNoblesAndFinishTurn(playerIndex);
    }

    /**
     * 6. CHỌN QUÝ TỘC
     */
    selectNoble(playerIndex, nobleId) {
      const validation = Validator.validateSelectNoble(this.state, playerIndex, nobleId);
      if (!validation.valid) return validation;

      const player = this.state.players[playerIndex];
      const { noble } = validation;

      // Nhận quý tộc
      player.nobles.push(noble);
      player.prestigePoints += GAME_RULES.NOBLE_PRESTIGE_POINTS;

      // Xóa khỏi bàn
      const nobleIdx = this.state.nobles.findIndex(n => n.id === nobleId);
      if (nobleIdx !== -1) {
        this.state.nobles.splice(nobleIdx, 1);
      }

      this.logTurn(player, `được Quý tộc ${noble.name} diện kiến (+3 điểm uy tín)!`);

      this.state.phase = GAME_PHASES.PLAYING;
      this.state.pendingNobles = [];

      return this.checkWinAndAdvanceTurn(playerIndex);
    }

    /**
     * Xử lý sau hành động: Kiểm tra giới hạn 10 token -> Kiểm tra quý tộc -> Kiểm tra thắng
     */
    handlePostAction(playerIndex, actionType, actionData) {
      const player = this.state.players[playerIndex];
      const totalTokens = this.state.getPlayerTotalTokens(player);

      // Kiểm tra vượt quá giới hạn 10 token
      if (totalTokens > GAME_RULES.MAX_TOKENS_IN_HAND) {
        const excess = totalTokens - GAME_RULES.MAX_TOKENS_IN_HAND;
        this.state.phase = GAME_PHASES.DISCARDING;
        this.state.discardingPlayerIndex = playerIndex;
        this.state.discardExcessCount = excess;

        return {
          success: true,
          actionType,
          actionData,
          mustDiscard: true,
          excessCount: excess,
          gameState: this.state
        };
      }

      return this.checkNoblesAndFinishTurn(playerIndex, actionType, actionData);
    }

    /**
     * Kiểm tra quý tộc ghé thăm
     */
    checkNoblesAndFinishTurn(playerIndex, actionType = null, actionData = null) {
      const player = this.state.players[playerIndex];

      // Tìm tất cả quý tộc mà người chơi này đủ điều kiện thu hút
      const eligibleNobles = this.state.nobles.filter(noble => {
        for (const [gem, needed] of Object.entries(noble.requirements)) {
          if ((player.bonuses[gem] || 0) < needed) {
            return false;
          }
        }
        return true;
      });

      if (eligibleNobles.length === 1) {
        // Tự động nhận quý tộc duy nhất
        const noble = eligibleNobles[0];
        player.nobles.push(noble);
        player.prestigePoints += GAME_RULES.NOBLE_PRESTIGE_POINTS;

        const nobleIdx = this.state.nobles.findIndex(n => n.id === noble.id);
        if (nobleIdx !== -1) {
          this.state.nobles.splice(nobleIdx, 1);
        }

        this.logTurn(player, `được Quý tộc ${noble.name} diện kiến (+3 điểm uy tín)!`);

        return this.checkWinAndAdvanceTurn(playerIndex, { nobleVisit: noble, actionType, actionData });
      } else if (eligibleNobles.length > 1) {
        // Có nhiều hơn 1 quý tộc đủ điều kiện -> Cho người chơi tự chọn 1
        this.state.phase = GAME_PHASES.SELECTING_NOBLE;
        this.state.pendingNobles = eligibleNobles;

        return {
          success: true,
          actionType,
          actionData,
          mustSelectNoble: true,
          selectableNobles: eligibleNobles,
          gameState: this.state
        };
      }

      return this.checkWinAndAdvanceTurn(playerIndex, { actionType, actionData });
    }

    /**
     * Kiểm tra điều kiện thắng 15 điểm uy tín & Chuyển lượt
     */
    checkWinAndAdvanceTurn(playerIndex, extra = {}) {
      const player = this.state.players[playerIndex];

      // LUẬT: Còn nợ bài (reservedCards > 0) thì KHÔNG được phép thắng dù điểm vượt hay đủ!
      // Chỉ người chơi đạt >= 15 điểm VÀ sạch nợ bài (0 thẻ nợ) mới đủ tư cách kích hoạt Vòng Cuối Cùng!
      const isDebtFree = !player.reservedCards || player.reservedCards.length === 0;
      if (player.prestigePoints >= GAME_RULES.WINNING_PRESTIGE_POINTS && isDebtFree && !this.state.isFinalRound) {
        this.state.isFinalRound = true;
        this.state.finalRoundTriggerPlayerIndex = playerIndex;
        this.logTurn(player, `đã đạt ${player.prestigePoints} điểm và sạch nợ bài! VÒNG CUỐI CÙNG ĐƯỢC KÍCH HOẠT!`);
      } else if (player.prestigePoints >= GAME_RULES.WINNING_PRESTIGE_POINTS && !isDebtFree && !this.state.isFinalRound) {
        this.logTurn(player, `đã đạt ${player.prestigePoints} điểm nhưng chưa thể kích hoạt chiến thắng vì còn nợ ${player.reservedCards.length} thẻ đặt cọc!`);
      }

      // Chuyển lượt
      this.state.advanceTurn();

      return {
        success: true,
        ...extra,
        isGameOver: this.state.phase === GAME_PHASES.FINISHED,
        winner: this.state.winner,
        gameState: this.state
      };
    }

    logTurn(player, message) {
      this.state.turnHistory.push({
        time: Date.now(),
        playerName: player.name,
        message: `${player.name} ${message}`
      });
    }
  }

  return GameEngine;
}));
