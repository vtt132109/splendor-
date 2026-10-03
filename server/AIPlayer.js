/**
 * Splendor Board Game - Trí Tuệ Nhân Tạo AI Bot (AIPlayer)
 * 3 cấp độ: Dễ (Tập Sự), Trung Bình (Chiến Thuật), Khó (Bậc Thầy)
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    const Constants = require('../shared/constants');
    const Validator = require('./Validator');
    module.exports = factory(Constants, Validator);
  } else {
    root.SplendorAIPlayer = factory(root.SplendorConstants, root.SplendorValidator);
  }
}(typeof self !== 'undefined' ? self : this, function(Constants, Validator) {

  const {
    BASE_GEMS,
    ALL_TOKENS,
    ACTION_TYPES,
    AI_DIFFICULTIES
  } = Constants;

  class AIPlayer {
    /**
     * Lựa chọn hành động tốt nhất cho AI tùy theo độ khó
     */
    static chooseAction(gameState, playerIndex) {
      const player = gameState.players[playerIndex];
      const difficulty = player.aiDifficulty || AI_DIFFICULTIES.MEDIUM;

      if (difficulty === AI_DIFFICULTIES.EASY) {
        return this.chooseEasyAction(gameState, playerIndex);
      } else if (difficulty === AI_DIFFICULTIES.HARD) {
        return this.chooseHardAction(gameState, playerIndex);
      } else {
        return this.chooseMediumAction(gameState, playerIndex);
      }
    }

    /**
     * Liệt kê tất cả các hành động hợp lệ có thể thực hiện lúc này
     */
    static getPossibleActions(gameState, playerIndex) {
      const actions = [];
      const player = gameState.players[playerIndex];

      // 1. Mua thẻ từ danh sách giữ chỗ
      for (const card of player.reservedCards) {
        const val = Validator.validatePurchaseCard(gameState, playerIndex, { cardId: card.id, fromReserved: true });
        if (val.valid) {
          actions.push({
            type: ACTION_TYPES.PURCHASE_CARD,
            data: { cardId: card.id, fromReserved: true },
            card,
            score: (card.points || 0) * 12 + 15
          });
        }
      }

      // 2. Mua thẻ từ bàn chơi (ưu tiên tầng cao)
      for (let t = 3; t >= 1; t--) {
        for (const card of (gameState.boardCards[t] || [])) {
          if (!card) continue;
          const val = Validator.validatePurchaseCard(gameState, playerIndex, { cardId: card.id, fromReserved: false });
          if (val.valid) {
            actions.push({
              type: ACTION_TYPES.PURCHASE_CARD,
              data: { cardId: card.id, fromReserved: false },
              card,
              score: (card.points || 0) * 12 + t * 4
            });
          }
        }
      }

      // 3. Lấy 2 viên cùng màu
      for (const gem of BASE_GEMS) {
        const val = Validator.validateTakeTwoSameGems(gameState, playerIndex, gem);
        if (val.valid) {
          actions.push({
            type: ACTION_TYPES.TAKE_TWO_SAME_GEMS,
            data: { gem },
            gem,
            score: 8
          });
        }
      }

      // 4. Lấy 3 viên khác màu
      const availableGems = BASE_GEMS.filter(g => (gameState.bank[g] || 0) > 0);
      if (availableGems.length >= 3) {
        // Sinh các tổ hợp 3 màu
        for (let i = 0; i < availableGems.length; i++) {
          for (let j = i + 1; j < availableGems.length; j++) {
            for (let k = j + 1; k < availableGems.length; k++) {
              const combo = [availableGems[i], availableGems[j], availableGems[k]];
              actions.push({
                type: ACTION_TYPES.TAKE_THREE_GEMS,
                data: { gems: combo },
                gems: combo,
                score: 6
              });
            }
          }
        }
      } else if (availableGems.length > 0) {
        actions.push({
          type: ACTION_TYPES.TAKE_THREE_GEMS,
          data: { gems: availableGems },
          gems: availableGems,
          score: 5
        });
      }

      // 5. Giữ chỗ thẻ (nếu chưa giữ đủ 3 thẻ)
      if (player.reservedCards.length < 3) {
        for (let t = 3; t >= 1; t--) {
          for (const card of (gameState.boardCards[t] || [])) {
            if (!card) continue;
            actions.push({
              type: ACTION_TYPES.RESERVE_CARD,
              data: { tier: t, cardId: card.id, isDeckTop: false },
              card,
              score: (card.points || 0) * 4 + (gameState.bank.gold > 0 ? 3 : 0)
            });
          }
        }
      }

      return actions;
    }

    /**
     * AI Dễ: Chọn ngẫu nhiên một hành động hợp lệ
     */
    static chooseEasyAction(gameState, playerIndex) {
      const actions = this.getPossibleActions(gameState, playerIndex);
      if (actions.length === 0) return null;

      // Ưu tiên mua thẻ nếu mua được thẻ có điểm
      const purchases = actions.filter(a => a.type === ACTION_TYPES.PURCHASE_CARD);
      if (purchases.length > 0 && Math.random() < 0.6) {
        return purchases[Math.floor(Math.random() * purchases.length)];
      }

      return actions[Math.floor(Math.random() * actions.length)];
    }

    /**
     * AI Trung Bình: Tính điểm có trọng số (điểm uy tín, quý tộc, tiết kiệm token)
     */
    static chooseMediumAction(gameState, playerIndex) {
      const actions = this.getPossibleActions(gameState, playerIndex);
      if (actions.length === 0) return null;

      const player = gameState.players[playerIndex];

      for (const act of actions) {
        if (act.type === ACTION_TYPES.PURCHASE_CARD) {
          // Thưởng điểm mạnh cho thẻ có điểm uy tín
          act.score += (act.card.points || 0) * 15;

          // Thưởng điểm nếu bonus thẻ giúp tiến gần đến Quý tộc
          for (const noble of gameState.nobles) {
            const needed = noble.requirements[act.card.gem] || 0;
            const current = player.bonuses[act.card.gem] || 0;
            if (current < needed) {
              act.score += 8;
            }
          }
        } else if (act.type === ACTION_TYPES.TAKE_THREE_GEMS || act.type === ACTION_TYPES.TAKE_TWO_SAME_GEMS) {
          // Xem các viên ngọc này có khớp với chi phí của thẻ trên bàn mà AI muốn mua không
          const wantedGems = this.getMostWantedGems(gameState, player);
          const gemsInAction = act.gems || [act.gem, act.gem];
          for (const g of gemsInAction) {
            act.score += (wantedGems[g] || 0) * 3;
          }
        }
      }

      // Sắp xếp điểm cao nhất
      actions.sort((a, b) => b.score - a.score);

      // Thêm chút biến thiên (top 2 hành động tốt nhất)
      const topCount = Math.min(2, actions.length);
      return actions[Math.floor(Math.random() * topCount)];
    }

    /**
     * AI Khó (Bậc Thầy): Đánh giá sâu, chặn đối thủ, tối ưu hoá vòng quay kinh tế
     */
    static chooseHardAction(gameState, playerIndex) {
      const actions = this.getPossibleActions(gameState, playerIndex);
      if (actions.length === 0) return null;

      const player = gameState.players[playerIndex];

      // 1. Nếu có nước đi đưa điểm lên >= 15 thắng ngay lập tức -> MUA NGAY!
      const winningMove = actions.find(a =>
        a.type === ACTION_TYPES.PURCHASE_CARD &&
        (player.prestigePoints + (a.card.points || 0) >= 15)
      );
      if (winningMove) return winningMove;

      // 2. Chấm điểm hành động chiến lược
      const targetCard = this.findBestStrategicCard(gameState, player);

      for (const act of actions) {
        if (act.type === ACTION_TYPES.PURCHASE_CARD) {
          act.score += (act.card.points || 0) * 20;

          // Hướng tới quý tộc
          for (const noble of gameState.nobles) {
            const needed = noble.requirements[act.card.gem] || 0;
            const current = player.bonuses[act.card.gem] || 0;
            if (current < needed) {
              act.score += 12;
            }
          }

          // Tiết kiệm token trong tay
          if (act.fromReserved) act.score += 6;
        } else if (act.type === ACTION_TYPES.RESERVE_CARD) {
          // Chặn đối thủ nếu đối thủ sắp mua thẻ nhiều điểm
          const opponentThreat = this.checkOpponentsThreat(gameState, playerIndex, act.card);
          if (opponentThreat) {
            act.score += 25;
          } else if (targetCard && act.card.id === targetCard.id) {
            act.score += 15;
          }
        } else if (act.type === ACTION_TYPES.TAKE_THREE_GEMS || act.type === ACTION_TYPES.TAKE_TWO_SAME_GEMS) {
          const wantedGems = this.getMostWantedGems(gameState, player, targetCard);
          const gemsInAction = act.gems || [act.gem, act.gem];
          let matchScore = 0;
          for (const g of gemsInAction) {
            matchScore += (wantedGems[g] || 0) * 5;
          }
          act.score += matchScore;
        }
      }

      actions.sort((a, b) => b.score - a.score);
      return actions[0];
    }

    /**
     * Tìm loại đá quý AI đang cần nhất để mua thẻ mục tiêu
     */
    static getMostWantedGems(gameState, player, targetCard = null) {
      const counts = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };

      const cardsToCheck = targetCard ? [targetCard] : [];
      if (cardsToCheck.length === 0) {
        // Lấy các thẻ trên bàn có điểm uy tín cao
        for (let t = 3; t >= 1; t--) {
          for (const c of (gameState.boardCards[t] || [])) {
            if (c) cardsToCheck.push(c);
          }
        }
      }

      for (const card of cardsToCheck.slice(0, 6)) {
        for (const gem of BASE_GEMS) {
          const needed = card.cost[gem] || 0;
          const have = (player.bonuses[gem] || 0) + (player.tokens[gem] || 0);
          if (have < needed) {
            counts[gem] += (needed - have);
          }
        }
      }

      return counts;
    }

    /**
     * Tìm thẻ bài chiến lược nhất trên bàn
     */
    static findBestStrategicCard(gameState, player) {
      let best = null;
      let highestVal = -1;

      for (let t = 3; t >= 1; t--) {
        for (const card of (gameState.boardCards[t] || [])) {
          if (!card) continue;
          let val = (card.points || 0) * 10;
          for (const noble of gameState.nobles) {
            if ((noble.requirements[card.gem] || 0) > (player.bonuses[card.gem] || 0)) {
              val += 8;
            }
          }
          if (val > highestVal) {
            highestVal = val;
            best = card;
          }
        }
      }
      return best;
    }

    /**
     * Kiểm tra xem có đối thủ nào sắp mua thẻ này không
     */
    static checkOpponentsThreat(gameState, myIndex, card) {
      for (let i = 0; i < gameState.players.length; i++) {
        if (i === myIndex) continue;
        const opp = gameState.players[i];
        if (card.points >= 3 && gameState.isCardAffordable(opp, card)) {
          return true;
        }
      }
      return false;
    }

    /**
     * Lựa chọn ngọc để trả khi quá 10 viên
     */
    static chooseTokensToDiscard(player, excessCount) {
      const discard = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 };
      let remaining = excessCount;

      // Ưu tiên giữ lại vàng (gold)
      // Trả các loại ngọc có số lượng nhiều nhất trước
      const gemEntries = BASE_GEMS.map(g => ({ gem: g, count: player.tokens[g] || 0 }))
        .sort((a, b) => b.count - a.count);

      while (remaining > 0) {
        let discardedAny = false;
        for (const entry of gemEntries) {
          if (entry.count > 0 && remaining > 0) {
            discard[entry.gem] = (discard[entry.gem] || 0) + 1;
            entry.count--;
            remaining--;
            discardedAny = true;
          }
        }
        if (!discardedAny) {
          // Bắt buộc phải trả vàng nếu không còn ngọc nào khác
          if ((player.tokens.gold || 0) > 0 && remaining > 0) {
            discard.gold = (discard.gold || 0) + 1;
            remaining--;
          } else {
            break;
          }
        }
      }

      return discard;
    }

    /**
     * Thực thi lượt chơi cho AI kèm độ trễ giả lập tư duy
     */
    static executeTurn(gameState, playerIndex, engine, onComplete) {
      const delay = Math.floor(Math.random() * 500) + 800; // 800ms - 1300ms

      setTimeout(() => {
        // Kiểm tra nếu đang phải trả đá quý thừa
        if (gameState.phase === Constants.GAME_PHASES.DISCARDING && gameState.discardingPlayerIndex === playerIndex) {
          const tokensToDiscard = this.chooseTokensToDiscard(gameState.players[playerIndex], gameState.discardExcessCount);
          const result = engine.discardTokens(playerIndex, tokensToDiscard);
          if (typeof onComplete === 'function') onComplete(result);
          return;
        }

        // Kiểm tra nếu đang phải chọn quý tộc
        if (gameState.phase === Constants.GAME_PHASES.SELECTING_NOBLE && gameState.currentPlayerIndex === playerIndex) {
          const chosenNoble = gameState.pendingNobles[0];
          const result = engine.selectNoble(playerIndex, chosenNoble.id);
          if (typeof onComplete === 'function') onComplete(result);
          return;
        }

        const action = this.chooseAction(gameState, playerIndex);
        if (!action) {
          console.warn('[AI] Không tìm được hành động hợp lệ!');
          if (typeof onComplete === 'function') onComplete({ success: false });
          return;
        }

        let result = null;
        switch (action.type) {
          case ACTION_TYPES.TAKE_THREE_GEMS:
            result = engine.takeThreeGems(playerIndex, action.data.gems);
            break;
          case ACTION_TYPES.TAKE_TWO_SAME_GEMS:
            result = engine.takeTwoSameGems(playerIndex, action.data.gem);
            break;
          case ACTION_TYPES.RESERVE_CARD:
            result = engine.reserveCard(playerIndex, action.data);
            break;
          case ACTION_TYPES.PURCHASE_CARD:
            result = engine.purchaseCard(playerIndex, action.data);
            break;
        }

        if (typeof onComplete === 'function') {
          onComplete(result);
        }
      }, delay);
    }
  }

  return AIPlayer;
}));
