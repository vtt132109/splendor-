/**
 * Splendor Board Game - Hằng số dùng chung (Client & Server)
 */

const GEM_TYPES = {
  DIAMOND: 'diamond',   // Trắng / Kim cương 💎
  SAPPHIRE: 'sapphire', // Xanh dương / Sapphire 🔵
  EMERALD: 'emerald',   // Xanh lục / Ngọc lục bảo 🟢
  RUBY: 'ruby',         // Đỏ / Ruby 🔴
  ONYX: 'onyx',         // Đen / Mã não ⚫
  GOLD: 'gold'          // Vàng / Joker 🟡
};

const BASE_GEMS = [
  GEM_TYPES.DIAMOND,
  GEM_TYPES.SAPPHIRE,
  GEM_TYPES.EMERALD,
  GEM_TYPES.RUBY,
  GEM_TYPES.ONYX
];

const ALL_TOKENS = [...BASE_GEMS, GEM_TYPES.GOLD];

const GEM_INFO_VI = {
  [GEM_TYPES.DIAMOND]: {
    name: 'Kim cương',
    colorHex: '#e8f4f8',
    icon: '💎',
    accentColor: '#b9e2f5'
  },
  [GEM_TYPES.SAPPHIRE]: {
    name: 'Sapphire',
    colorHex: '#1d5fa8',
    icon: '🔷',
    accentColor: '#3d8be6'
  },
  [GEM_TYPES.EMERALD]: {
    name: 'Ngọc lục bảo',
    colorHex: '#1e7b42',
    icon: '🟢',
    accentColor: '#34b368'
  },
  [GEM_TYPES.RUBY]: {
    name: 'Ruby',
    colorHex: '#b31d28',
    icon: '🔴',
    accentColor: '#e63946'
  },
  [GEM_TYPES.ONYX]: {
    name: 'Mã não',
    colorHex: '#252120',
    icon: '⚫',
    accentColor: '#4a4441'
  },
  [GEM_TYPES.GOLD]: {
    name: 'Vàng đa năng',
    colorHex: '#d4af37',
    icon: '🟡',
    accentColor: '#ffd700'
  }
};

const SETUP_BY_PLAYERS = {
  2: {
    gemsPerColor: 4,
    goldCount: 5,
    nobleCount: 3
  },
  3: {
    gemsPerColor: 5,
    goldCount: 5,
    nobleCount: 4
  },
  4: {
    gemsPerColor: 7,
    goldCount: 5,
    nobleCount: 5
  }
};

const GAME_RULES = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  MAX_RESERVED_CARDS: 3,
  MAX_TOKENS_IN_HAND: 10,
  WINNING_PRESTIGE_POINTS: 15,
  NOBLE_PRESTIGE_POINTS: 3,
  CARDS_PER_TIER_ON_BOARD: 4,
  MIN_TOKENS_FOR_DOUBLE_TAKE: 4,
  TOTAL_CARD_TIERS: 3
};

const ACTION_TYPES = {
  TAKE_THREE_GEMS: 'TAKE_THREE_GEMS',
  TAKE_TWO_SAME_GEMS: 'TAKE_TWO_SAME_GEMS',
  RESERVE_CARD: 'RESERVE_CARD',
  RESERVE_DECK_TOP: 'RESERVE_DECK_TOP',
  PURCHASE_CARD: 'PURCHASE_CARD',
  DISCARD_TOKENS: 'DISCARD_TOKENS',
  SELECT_NOBLE: 'SELECT_NOBLE'
};

const GAME_PHASES = {
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  DISCARDING: 'DISCARDING',
  SELECTING_NOBLE: 'SELECTING_NOBLE',
  FINAL_ROUND: 'FINAL_ROUND',
  FINISHED: 'FINISHED'
};

const GAME_MODES = {
  ONLINE: 'ONLINE',
  LOCAL: 'LOCAL',
  AI: 'AI'
};

const AI_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const AI_LABELS_VI = {
  [AI_DIFFICULTIES.EASY]: 'Máy Tập Sự (Dễ)',
  [AI_DIFFICULTIES.MEDIUM]: 'Máy Chiến Thuật (Trung Bình)',
  [AI_DIFFICULTIES.HARD]: 'Máy Bậc Thầy (Khó)'
};

// Export cho cả Node.js (CommonJS) và Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GEM_TYPES,
    BASE_GEMS,
    ALL_TOKENS,
    GEM_INFO_VI,
    SETUP_BY_PLAYERS,
    GAME_RULES,
    ACTION_TYPES,
    GAME_PHASES,
    GAME_MODES,
    AI_DIFFICULTIES,
    AI_LABELS_VI
  };
} else if (typeof window !== 'undefined') {
  window.SplendorConstants = {
    GEM_TYPES,
    BASE_GEMS,
    ALL_TOKENS,
    GEM_INFO_VI,
    SETUP_BY_PLAYERS,
    GAME_RULES,
    ACTION_TYPES,
    GAME_PHASES,
    GAME_MODES,
    AI_DIFFICULTIES,
    AI_LABELS_VI
  };
}
