/**
 * Splendor Board Game - Bảng Thông Tin Người Chơi & Đối Thủ (PlayerPanel.js)
 */

class PlayerPanel {
  /**
   * Cập nhật Bảng điều khiển người chơi hiện tại ở đáy màn hình
   */
  renderCurrentPlayerMat(player, isCurrentTurn) {
    if (!player) return;

    // Tên & Avatar & Điểm Uy Tín
    const nameEl = document.getElementById('mat-player-name');
    const avatarEl = document.getElementById('mat-avatar');
    const avatarBox = avatarEl?.parentElement;
    const pointsEl = document.getElementById('mat-points-value');
    const tokenTagEl = document.getElementById('mat-token-count-tag');
    const reservedTagEl = document.getElementById('mat-reserved-count-tag');

    if (nameEl) nameEl.textContent = player.name;
    if (avatarEl && player.avatar) avatarEl.src = player.avatar;
    if (avatarBox) avatarBox.classList.toggle('active-turn-glow', !!isCurrentTurn);
    if (pointsEl) pointsEl.textContent = player.prestigePoints;

    const totalTokens = ALL_TOKENS.reduce((s, g) => s + (player.tokens[g] || 0), 0);
    if (tokenTagEl) tokenTagEl.textContent = `${totalTokens}/10`;
    if (reservedTagEl) reservedTagEl.textContent = `${player.reservedCards.length}/3`;

    // Vẽ dãy Bonus giảm giá vĩnh viễn (5 màu)
    const bonusesRow = document.getElementById('mat-bonuses-row');
    if (bonusesRow) {
      bonusesRow.innerHTML = '';
      const { BASE_GEMS, GEM_INFO_VI } = SplendorConstants;

      for (const gem of BASE_GEMS) {
        const count = player.bonuses[gem] || 0;
        const info = GEM_INFO_VI[gem];

        const box = document.createElement('div');
        box.className = 'bonus-box';
        box.title = `Giảm giá vĩnh viễn: ${count} ${info.name}`;
        box.innerHTML = `
          <span>${info.icon}</span>
          <span class="bonus-count">${count}</span>
        `;
        bonusesRow.appendChild(box);
      }
    }

    // Vẽ đá quý trong tay
    SplendorTokenRenderer.renderPlayerTokens(player.tokens);

    // Vẽ thẻ đã giữ chỗ
    SplendorCardRenderer.renderReservedCards(player.reservedCards, player, isCurrentTurn);
  }

  /**
   * Vẽ danh sách đối thủ ở cột bên trái
   */
  renderOpponents(players, activePlayerIndex, myPlayerIndex, containerId = 'other-players-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const { BASE_GEMS, GEM_INFO_VI } = SplendorConstants;

    for (let i = 0; i < players.length; i++) {
      if (i === myPlayerIndex) continue; // Bỏ qua chính mình vì đã vẽ ở đáy màn hình

      const opp = players[i];
      const isTurn = i === activePlayerIndex;

      const oppCard = document.createElement('div');
      oppCard.className = `opponent-card ${isTurn ? 'active-turn' : ''}`;

      const totalTokens = ALL_TOKENS.reduce((s, g) => s + (opp.tokens[g] || 0), 0);
      const totalCards = opp.cards.length;

      // Hiển thị tóm tắt bonus của đối thủ
      let bonusSummaryHtml = '';
      for (const g of BASE_GEMS) {
        const bCount = opp.bonuses[g] || 0;
        if (bCount > 0) {
          bonusSummaryHtml += `<span title="${GEM_INFO_VI[g].name}: ${bCount}">${GEM_INFO_VI[g].icon}${bCount}</span>`;
        }
      }

      oppCard.innerHTML = `
        <div class="opp-header">
          <div class="opp-name-box ${isTurn ? 'active-turn-glow' : ''}">
            <img class="opp-avatar" src="${opp.avatar || "assets/nobles/king.jpg"}" alt="">
            <span class="opp-name" title="${opp.name}">${opp.name}</span>
          </div>
          <div class="opp-pts-badge">${opp.prestigePoints}đ</div>
        </div>
        <div class="opp-assets-row">
          <span>🪙 ${totalTokens}/10 viên</span>
          <span>🃏 ${totalCards} thẻ</span>
          <span>📌 ${opp.reservedCards.length} giữ</span>
        </div>
        ${bonusSummaryHtml ? `<div style="display:flex;gap:4px;font-size:9px;margin-top:2px;">${bonusSummaryHtml}</div>` : ''}
      `;

      container.appendChild(oppCard);
    }
  }
}

window.SplendorPlayerPanel = new PlayerPanel();
