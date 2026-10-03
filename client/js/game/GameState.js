/**
 * Splendor Board Game - Mô Hình Trạng Thái (GameState)
 * Dùng chung cho Client (Local & AI) và Server (Online)
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    const CardData = require('./CardData');
    const Constants = require('../shared/constants');
    module.exports = factory(CardData, Constants);
  } else {
    root.SplendorGameState = factory(root.SplendorCardData, root.SplendorConstants);
  }
}(typeof self !== 'undefined' ? self : this, function(CardData, Constants) {

  const {
    BASE_GEMS,
    ALL_TOKENS,
    SETUP_BY_PLAYERS,
    GAME_RULES,
    GAME_PHASES
  } = Constants;

  class GameState {
    constructor(config = {}) {
      this.id = config.id || ('game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
      this.mode = config.mode || 'LOCAL'; // LOCAL, AI, ONLINE
      this.phase = config.phase || GAME_PHASES.PLAYING;
      this.round = config.round || 1;
      this.currentPlayerIndex = config.currentPlayerIndex || 0;
      this.isFinalRound = config.isFinalRound || false;
      this.finalRoundTriggerPlayerIndex = config.finalRoundTriggerPlayerIndex !== undefined ? config.finalRoundTriggerPlayerIndex : -1;
      this.winner = config.winner || null;
      this.winnerReason = config.winnerReason || '';

      // Trạng thái phụ
      this.discardingPlayerIndex = config.discardingPlayerIndex !== undefined ? config.discardingPlayerIndex : -1;
      this.discardExcessCount = config.discardExcessCount || 0;
      this.pendingNobles = config.pendingNobles || []; // Danh sách quý tộc cùng đủ điều kiện

      // Thiết lập danh sách người chơi
      this.players = (config.players || []).map(p => ({
        id: p.id || 'p_' + Math.random().toString(36).substr(2, 6),
        name: p.name || 'Người chơi',
        avatar: p.avatar || null,
        isAI: !!p.isAI,
        aiDifficulty: p.aiDifficulty || null,
        tokens: p.tokens ? { ...p.tokens } : { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 },
        bonuses: p.bonuses ? { ...p.bonuses } : { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 },
        cards: p.cards ? [...p.cards] : [],
        reservedCards: p.reservedCards ? [...p.reservedCards] : [],
        nobles: p.nobles ? [...p.nobles] : [],
        prestigePoints: p.prestigePoints || 0
      }));

      // Thiết lập kho đá quý (Bank)
      this.bank = config.bank ? { ...config.bank } : { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 };

      // Thiết lập bộ bài và bàn thẻ
      this.decks = config.decks ? {
        1: [...config.decks[1]],
        2: [...config.decks[2]],
        3: [...config.decks[3]]
      } : { 1: [], 2: [], 3: [] };

      this.boardCards = config.boardCards ? {
        1: [...config.boardCards[1]],
        2: [...config.boardCards[2]],
        3: [...config.boardCards[3]]
      } : { 1: [], 2: [], 3: [] };

      // Ô Quý Tộc trên bàn
      this.nobles = config.nobles ? [...config.nobles] : [];

      // Lịch sử lượt chơi
      this.turnHistory = config.turnHistory ? [...config.turnHistory] : [];
    }

    /**
     * Khởi tạo trận đấu mới từ danh sách người chơi
     */
    static createNewGame(playerConfigs, mode = 'LOCAL') {
      const playerCount = playerConfigs.length;
      if (playerCount < GAME_RULES.MIN_PLAYERS || playerCount > GAME_RULES.MAX_PLAYERS) {
        throw new Error(`Số lượng người chơi phải từ ${GAME_RULES.MIN_PLAYERS} đến ${GAME_RULES.MAX_PLAYERS}.`);
      }

      const setup = SETUP_BY_PLAYERS[playerCount];
      const fresh = CardData.getFreshDecks();

      // Nguồn đá quý ban đầu theo số người chơi
      const bank = {
        diamond: setup.gemsPerColor,
        sapphire: setup.gemsPerColor,
        emerald: setup.gemsPerColor,
        ruby: setup.gemsPerColor,
        onyx: setup.gemsPerColor,
        gold: setup.goldCount
      };

      // Rút quý tộc theo số người (số người + 1)
      const nobles = fresh.nobles.slice(0, setup.nobleCount);

      // Rút 4 thẻ mở trên bàn cho mỗi tầng (3 tầng × 4 thẻ = 12 thẻ)
      const boardCards = {
        1: fresh[1].splice(0, GAME_RULES.CARDS_PER_TIER_ON_BOARD),
        2: fresh[2].splice(0, GAME_RULES.CARDS_PER_TIER_ON_BOARD),
        3: fresh[3].splice(0, GAME_RULES.CARDS_PER_TIER_ON_BOARD)
      };

      const game = new GameState({
        mode,
        players: playerConfigs,
        bank,
        nobles,
        decks: {
          1: fresh[1],
          2: fresh[2],
          3: fresh[3]
        },
        boardCards,
        phase: GAME_PHASES.PLAYING,
        currentPlayerIndex: 0,
        round: 1
      });

      return game;
    }

    getCurrentPlayer() {
      return this.players[this.currentPlayerIndex];
    }

    getPlayerTotalTokens(player) {
      return ALL_TOKENS.reduce((sum, gem) => sum + (player.tokens[gem] || 0), 0);
    }

    /**
     * Tính toán chi phí thực và lượng vàng cần dùng khi mua thẻ
     * @returns { canAfford: boolean, costTokens: Object, goldNeeded: number }
     */
    calculateCardPayment(player, card) {
      const costTokens = {};
      let goldNeeded = 0;
      let canAfford = true;

      for (const gem of BASE_GEMS) {
        const required = card.cost[gem] || 0;
        const discount = player.bonuses[gem] || 0;
        const netCost = Math.max(0, required - discount);

        const playerHas = player.tokens[gem] || 0;
        if (playerHas >= netCost) {
          costTokens[gem] = netCost;
        } else {
          costTokens[gem] = playerHas;
          goldNeeded += (netCost - playerHas);
        }
      }

      if (goldNeeded > (player.tokens.gold || 0)) {
        canAfford = false;
      }

      costTokens.gold = goldNeeded;

      return { canAfford, costTokens, goldNeeded };
    }

    isCardAffordable(player, card) {
      return this.calculateCardPayment(player, card).canAfford;
    }

    /**
     * Chuyển lượt sang người chơi tiếp theo
     */
    advanceTurn() {
      const prevIndex = this.currentPlayerIndex;
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

      // Khi quay lại người chơi đầu tiên, tăng vòng chơi
      if (this.currentPlayerIndex === 0) {
        this.round++;

        // Nếu đã ở vòng cuối và tất cả người chơi đã hoàn thành lượt có số vòng bằng nhau -> Kết thúc game
        if (this.isFinalRound) {
          this.endGame();
          return;
        }
      }
    }

    /**
     * Kết thúc game và tính toán người chiến thắng
     */
    endGame() {
      this.phase = GAME_PHASES.FINISHED;

      // Sắp xếp người chơi theo điểm uy tín (cao xuống thấp), hòa thì ít thẻ hơn thắng
      const ranked = [...this.players].sort((a, b) => {
        if (b.prestigePoints !== a.prestigePoints) {
          return b.prestigePoints - a.prestigePoints;
        }
        return a.cards.length - b.cards.length;
      });

      this.winner = ranked[0];
      const isTiebreak = ranked.length > 1 && ranked[0].prestigePoints === ranked[1].prestigePoints;

      if (isTiebreak) {
        this.winnerReason = `Cùng đạt ${this.winner.prestigePoints} điểm uy tín, chiến thắng nhờ sở hữu ít thẻ hơn (${this.winner.cards.length} thẻ)!`;
      } else {
        this.winnerReason = `Đạt số điểm uy tín cao nhất: ${this.winner.prestigePoints} điểm!`;
      }
    }

    /**
     * Serialize trạng thái sang JSON an toàn
     */
    toJSON() {
      return {
        id: this.id,
        mode: this.mode,
        phase: this.phase,
        round: this.round,
        currentPlayerIndex: this.currentPlayerIndex,
        isFinalRound: this.isFinalRound,
        finalRoundTriggerPlayerIndex: this.finalRoundTriggerPlayerIndex,
        winner: this.winner,
        winnerReason: this.winnerReason,
        discardingPlayerIndex: this.discardingPlayerIndex,
        discardExcessCount: this.discardExcessCount,
        pendingNobles: this.pendingNobles,
        players: this.players,
        bank: this.bank,
        nobles: this.nobles,
        boardCards: this.boardCards,
        deckCounts: {
          1: this.decks[1].length,
          2: this.decks[2].length,
          3: this.decks[3].length
        },
        decks: this.decks,
        turnHistory: this.turnHistory.slice(-20) // Lưu 20 lượt gần nhất
      };
    }

    static fromJSON(json) {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return new GameState(json);
    }
  }

  return GameState;
}));
