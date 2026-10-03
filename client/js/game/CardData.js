/**
 * Splendor Board Game - Dữ Liệu 90 Thẻ Phát Triển & 10 Ô Quý Tộc
 * Chuẩn xác 100% theo bản quyền luật quốc tế Splendor (Space Cowboys)
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SplendorCardData = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {

  // Dữ liệu 10 Vị Quý Tộc Phục Hưng (Mỗi quý tộc mang lại 3 điểm uy tín)
  const NOBLE_TILES = [
    {
      id: 'noble_1',
      name: 'Henrietta Maria',
      title: 'Vương hậu nước Anh',
      points: 3,
      requirements: { diamond: 3, sapphire: 3, emerald: 3 },
      icon: '👸'
    },
    {
      id: 'noble_2',
      name: 'Francis I',
      title: 'Quốc vương nước Pháp',
      points: 3,
      requirements: { sapphire: 3, emerald: 3, ruby: 3 },
      icon: '🤴'
    },
    {
      id: 'noble_3',
      name: 'Isabella I',
      title: 'Nữ hoàng xứ Castile',
      points: 3,
      requirements: { emerald: 3, ruby: 3, onyx: 3 },
      icon: '👑'
    },
    {
      id: 'noble_4',
      name: 'Suleiman the Magnificent',
      title: 'Hoàng đế Ottoman',
      points: 3,
      requirements: { ruby: 3, onyx: 3, diamond: 3 },
      icon: '👳'
    },
    {
      id: 'noble_5',
      name: 'Charles V',
      title: 'Hoàng đế La Mã Thần thánh',
      points: 3,
      requirements: { onyx: 3, diamond: 3, sapphire: 3 },
      icon: '⚜️'
    },
    {
      id: 'noble_6',
      name: 'Mary Stuart',
      title: 'Nữ hoàng Scotland',
      points: 3,
      requirements: { diamond: 4, sapphire: 4 },
      icon: '💎'
    },
    {
      id: 'noble_7',
      name: 'Catherine de Medici',
      title: 'Thái hậu nước Pháp',
      points: 3,
      requirements: { sapphire: 4, emerald: 4 },
      icon: '🔷'
    },
    {
      id: 'noble_8',
      name: 'Anne of Brittany',
      title: 'Nữ công tước xứ Bretagne',
      points: 3,
      requirements: { emerald: 4, ruby: 4 },
      icon: '🟢'
    },
    {
      id: 'noble_9',
      name: 'Niccolò Machiavelli',
      title: 'Nhà tư tưởng Florence',
      points: 3,
      requirements: { ruby: 4, onyx: 4 },
      icon: '🔴'
    },
    {
      id: 'noble_10',
      name: 'Elisabeth of Austria',
      title: 'Vương hậu nước Pháp',
      points: 3,
      requirements: { onyx: 4, diamond: 4 },
      icon: '⚫'
    }
  ];

  // Dữ liệu 90 Thẻ Phát Triển (Development Cards)
  // Cấp 1 (Tier 1): 40 thẻ
  const TIER_1_CARDS = [
    // Thẻ cho bonus Kim cương (Diamond)
    { id: 't1_d1', tier: 1, gem: 'diamond', points: 0, cost: { sapphire: 1, emerald: 1, ruby: 1, onyx: 1 } },
    { id: 't1_d2', tier: 1, gem: 'diamond', points: 0, cost: { sapphire: 1, emerald: 2, ruby: 1, onyx: 1 } },
    { id: 't1_d3', tier: 1, gem: 'diamond', points: 0, cost: { sapphire: 2, ruby: 2, onyx: 1 } },
    { id: 't1_d4', tier: 1, gem: 'diamond', points: 0, cost: { sapphire: 2, emerald: 2 } },
    { id: 't1_d5', tier: 1, gem: 'diamond', points: 0, cost: { sapphire: 3 } },
    { id: 't1_d6', tier: 1, gem: 'diamond', points: 0, cost: { emerald: 2, ruby: 2, onyx: 1 } },
    { id: 't1_d7', tier: 1, gem: 'diamond', points: 0, cost: { ruby: 1, onyx: 2 } },
    { id: 't1_d8', tier: 1, gem: 'diamond', points: 1, cost: { sapphire: 4 } },

    // Thẻ cho bonus Sapphire
    { id: 't1_s1', tier: 1, gem: 'sapphire', points: 0, cost: { diamond: 1, emerald: 1, ruby: 1, onyx: 1 } },
    { id: 't1_s2', tier: 1, gem: 'sapphire', points: 0, cost: { diamond: 1, emerald: 1, ruby: 2, onyx: 1 } },
    { id: 't1_s3', tier: 1, gem: 'sapphire', points: 0, cost: { diamond: 1, ruby: 2, onyx: 2 } },
    { id: 't1_s4', tier: 1, gem: 'sapphire', points: 0, cost: { emerald: 2, onyx: 2 } },
    { id: 't1_s5', tier: 1, gem: 'sapphire', points: 0, cost: { ruby: 3 } },
    { id: 't1_s6', tier: 1, gem: 'sapphire', points: 0, cost: { diamond: 2, emerald: 1, ruby: 2 } },
    { id: 't1_s7', tier: 1, gem: 'sapphire', points: 0, cost: { diamond: 2, emerald: 1 } },
    { id: 't1_s8', tier: 1, gem: 'sapphire', points: 1, cost: { ruby: 4 } },

    // Thẻ cho bonus Ngọc lục bảo (Emerald)
    { id: 't1_e1', tier: 1, gem: 'emerald', points: 0, cost: { diamond: 1, sapphire: 1, ruby: 1, onyx: 1 } },
    { id: 't1_e2', tier: 1, gem: 'emerald', points: 0, cost: { diamond: 2, sapphire: 1, ruby: 1, onyx: 1 } },
    { id: 't1_e3', tier: 1, gem: 'emerald', points: 0, cost: { diamond: 2, sapphire: 2, onyx: 1 } },
    { id: 't1_e4', tier: 1, gem: 'emerald', points: 0, cost: { ruby: 2, onyx: 2 } },
    { id: 't1_e5', tier: 1, gem: 'emerald', points: 0, cost: { onyx: 3 } },
    { id: 't1_e6', tier: 1, gem: 'emerald', points: 0, cost: { sapphire: 2, ruby: 1, onyx: 2 } },
    { id: 't1_e7', tier: 1, gem: 'emerald', points: 0, cost: { diamond: 1, sapphire: 2 } },
    { id: 't1_e8', tier: 1, gem: 'emerald', points: 1, cost: { onyx: 4 } },

    // Thẻ cho bonus Ruby
    { id: 't1_r1', tier: 1, gem: 'ruby', points: 0, cost: { diamond: 1, sapphire: 1, emerald: 1, onyx: 1 } },
    { id: 't1_r2', tier: 1, gem: 'ruby', points: 0, cost: { diamond: 1, sapphire: 1, emerald: 1, onyx: 2 } },
    { id: 't1_r3', tier: 1, gem: 'ruby', points: 0, cost: { diamond: 1, sapphire: 2, emerald: 2 } },
    { id: 't1_r4', tier: 1, gem: 'ruby', points: 0, cost: { diamond: 2, sapphire: 2 } },
    { id: 't1_r5', tier: 1, gem: 'ruby', points: 0, cost: { diamond: 3 } },
    { id: 't1_r6', tier: 1, gem: 'ruby', points: 0, cost: { diamond: 2, emerald: 2, onyx: 1 } },
    { id: 't1_r7', tier: 1, gem: 'ruby', points: 0, cost: { sapphire: 2, onyx: 1 } },
    { id: 't1_r8', tier: 1, gem: 'ruby', points: 1, cost: { diamond: 4 } },

    // Thẻ cho bonus Mã não (Onyx)
    { id: 't1_o1', tier: 1, gem: 'onyx', points: 0, cost: { diamond: 1, sapphire: 1, emerald: 1, ruby: 1 } },
    { id: 't1_o2', tier: 1, gem: 'onyx', points: 0, cost: { diamond: 1, sapphire: 2, emerald: 1, ruby: 1 } },
    { id: 't1_o3', tier: 1, gem: 'onyx', points: 0, cost: { diamond: 2, sapphire: 1, emerald: 2 } },
    { id: 't1_o4', tier: 1, gem: 'onyx', points: 0, cost: { diamond: 2, ruby: 2 } },
    { id: 't1_o5', tier: 1, gem: 'onyx', points: 0, cost: { emerald: 3 } },
    { id: 't1_o6', tier: 1, gem: 'onyx', points: 0, cost: { diamond: 1, sapphire: 2, ruby: 2 } },
    { id: 't1_o7', tier: 1, gem: 'onyx', points: 0, cost: { emerald: 2, ruby: 1 } },
    { id: 't1_o8', tier: 1, gem: 'onyx', points: 1, cost: { emerald: 4 } }
  ];

  // Cấp 2 (Tier 2): 30 thẻ
  const TIER_2_CARDS = [
    // Bonus Kim cương
    { id: 't2_d1', tier: 2, gem: 'diamond', points: 1, cost: { sapphire: 2, emerald: 3, ruby: 3 } },
    { id: 't2_d2', tier: 2, gem: 'diamond', points: 1, cost: { diamond: 2, sapphire: 2, ruby: 3 } },
    { id: 't2_d3', tier: 2, gem: 'diamond', points: 2, cost: { diamond: 4, ruby: 2, onyx: 1 } },
    { id: 't2_d4', tier: 2, gem: 'diamond', points: 2, cost: { emerald: 5 } },
    { id: 't2_d5', tier: 2, gem: 'diamond', points: 2, cost: { ruby: 5 } },
    { id: 't2_d6', tier: 2, gem: 'diamond', points: 3, cost: { diamond: 6 } },

    // Bonus Sapphire
    { id: 't2_s1', tier: 2, gem: 'sapphire', points: 1, cost: { diamond: 3, emerald: 2, onyx: 3 } },
    { id: 't2_s2', tier: 2, gem: 'sapphire', points: 1, cost: { sapphire: 2, emerald: 3, onyx: 2 } },
    { id: 't2_s3', tier: 2, gem: 'sapphire', points: 2, cost: { sapphire: 5 } },
    { id: 't2_s4', tier: 2, gem: 'sapphire', points: 2, cost: { sapphire: 4, emerald: 2, ruby: 1 } },
    { id: 't2_s5', tier: 2, gem: 'sapphire', points: 2, cost: { diamond: 5 } },
    { id: 't2_s6', tier: 2, gem: 'sapphire', points: 3, cost: { sapphire: 6 } },

    // Bonus Emerald
    { id: 't2_e1', tier: 2, gem: 'emerald', points: 1, cost: { diamond: 2, sapphire: 3, ruby: 2 } },
    { id: 't2_e2', tier: 2, gem: 'emerald', points: 1, cost: { diamond: 3, sapphire: 2, ruby: 3 } },
    { id: 't2_e3', tier: 2, gem: 'emerald', points: 2, cost: { emerald: 4, ruby: 2, onyx: 1 } },
    { id: 't2_e4', tier: 2, gem: 'emerald', points: 2, cost: { diamond: 4, sapphire: 2, onyx: 1 } },
    { id: 't2_e5', tier: 2, gem: 'emerald', points: 2, cost: { emerald: 5 } },
    { id: 't2_e6', tier: 2, gem: 'emerald', points: 3, cost: { emerald: 6 } },

    // Bonus Ruby
    { id: 't2_r1', tier: 2, gem: 'ruby', points: 1, cost: { diamond: 2, emerald: 2, onyx: 3 } },
    { id: 't2_r2', tier: 2, gem: 'ruby', points: 1, cost: { sapphire: 3, emerald: 2, onyx: 3 } },
    { id: 't2_r3', tier: 2, gem: 'ruby', points: 2, cost: { diamond: 1, sapphire: 4, emerald: 2 } },
    { id: 't2_r4', tier: 2, gem: 'ruby', points: 2, cost: { ruby: 4, onyx: 2, diamond: 1 } },
    { id: 't2_r5', tier: 2, gem: 'ruby', points: 2, cost: { onyx: 5 } },
    { id: 't2_r6', tier: 2, gem: 'ruby', points: 3, cost: { ruby: 6 } },

    // Bonus Onyx
    { id: 't2_o1', tier: 2, gem: 'onyx', points: 1, cost: { diamond: 3, ruby: 3, onyx: 2 } },
    { id: 't2_o2', tier: 2, gem: 'onyx', points: 1, cost: { diamond: 2, sapphire: 3, emerald: 3 } },
    { id: 't2_o3', tier: 2, gem: 'onyx', points: 2, cost: { diamond: 3, emerald: 1, onyx: 4 } },
    { id: 't2_o4', tier: 2, gem: 'onyx', points: 2, cost: { sapphire: 1, ruby: 4, onyx: 2 } },
    { id: 't2_o5', tier: 2, gem: 'onyx', points: 2, cost: { diamond: 5 } },
    { id: 't2_o6', tier: 2, gem: 'onyx', points: 3, cost: { onyx: 6 } }
  ];

  // Cấp 3 (Tier 3): 20 thẻ
  const TIER_3_CARDS = [
    // Bonus Kim cương
    { id: 't3_d1', tier: 3, gem: 'diamond', points: 3, cost: { diamond: 3, sapphire: 3, emerald: 5, ruby: 3 } },
    { id: 't3_d2', tier: 3, gem: 'diamond', points: 4, cost: { onyx: 7 } },
    { id: 't3_d3', tier: 3, gem: 'diamond', points: 4, cost: { diamond: 3, ruby: 3, onyx: 6 } },
    { id: 't3_d4', tier: 3, gem: 'diamond', points: 5, cost: { diamond: 7, onyx: 3 } },

    // Bonus Sapphire
    { id: 't3_s1', tier: 3, gem: 'sapphire', points: 3, cost: { sapphire: 3, emerald: 3, ruby: 5, onyx: 3 } },
    { id: 't3_s2', tier: 3, gem: 'sapphire', points: 4, cost: { diamond: 7 } },
    { id: 't3_s3', tier: 3, gem: 'sapphire', points: 4, cost: { diamond: 6, sapphire: 3, onyx: 3 } },
    { id: 't3_s4', tier: 3, gem: 'sapphire', points: 5, cost: { sapphire: 7, diamond: 3 } },

    // Bonus Emerald
    { id: 't3_e1', tier: 3, gem: 'emerald', points: 3, cost: { diamond: 5, sapphire: 3, ruby: 3, onyx: 3 } },
    { id: 't3_e2', tier: 3, gem: 'emerald', points: 4, cost: { sapphire: 7 } },
    { id: 't3_e3', tier: 3, gem: 'emerald', points: 4, cost: { diamond: 3, sapphire: 6, emerald: 3 } },
    { id: 't3_e4', tier: 3, gem: 'emerald', points: 5, cost: { emerald: 7, sapphire: 3 } },

    // Bonus Ruby
    { id: 't3_r1', tier: 3, gem: 'ruby', points: 3, cost: { diamond: 3, sapphire: 5, emerald: 3, onyx: 3 } },
    { id: 't3_r2', tier: 3, gem: 'ruby', points: 4, cost: { emerald: 7 } },
    { id: 't3_r3', tier: 3, gem: 'ruby', points: 4, cost: { sapphire: 3, emerald: 6, ruby: 3 } },
    { id: 't3_r4', tier: 3, gem: 'ruby', points: 5, cost: { ruby: 7, emerald: 3 } },

    // Bonus Onyx
    { id: 't3_o1', tier: 3, gem: 'onyx', points: 3, cost: { diamond: 3, emerald: 3, ruby: 3, onyx: 5 } },
    { id: 't3_o2', tier: 3, gem: 'onyx', points: 4, cost: { ruby: 7 } },
    { id: 't3_o3', tier: 3, gem: 'onyx', points: 4, cost: { emerald: 3, ruby: 6, onyx: 3 } },
    { id: 't3_o4', tier: 3, gem: 'onyx', points: 5, cost: { onyx: 7, ruby: 3 } }
  ];

  return {
    NOBLE_TILES,
    TIER_1_CARDS,
    TIER_2_CARDS,
    TIER_3_CARDS,
    // Hàm trợ giúp tạo bản sao bộ bài đã xáo
    getFreshDecks: function() {
      const shuffle = arr => {
        const copy = arr.map(c => ({ ...c, cost: { ...c.cost } }));
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };

      return {
        1: shuffle(TIER_1_CARDS),
        2: shuffle(TIER_2_CARDS),
        3: shuffle(TIER_3_CARDS),
        nobles: shuffle(NOBLE_TILES)
      };
    }
  };
}));
