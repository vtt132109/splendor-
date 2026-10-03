/**
 * Splendor Board Game - Trình Hiển Thị Thẻ Phát Triển (CardRenderer.js)
 */

class CardRenderer {
  constructor() {
    this.onPurchaseCard = null;
    this.onReserveCard = null;
    this.selectedInspectCard = null;
    this.selectedInspectFromReserved = false;
    this.initInspectModalEvents();
  }

  initInspectModalEvents() {
    const closeBtn = document.getElementById('btn-close-inspect');
    const modal = document.getElementById('card-inspect-modal');
    const buyBtn = document.getElementById('btn-inspect-buy');
    const reserveBtn = document.getElementById('btn-inspect-reserve');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        if (this.selectedInspectCard && typeof this.onPurchaseCard === 'function') {
          modal.classList.add('hidden');
          this.onPurchaseCard(this.selectedInspectCard.id, this.selectedInspectFromReserved);
        }
      });
    }

    if (reserveBtn) {
      reserveBtn.addEventListener('click', () => {
        if (this.selectedInspectCard && typeof this.onReserveCard === 'function') {
          modal.classList.add('hidden');
          this.onReserveCard(this.selectedInspectCard.tier, this.selectedInspectCard.id);
        }
      });
    }
  }

  /**
   * Tạo element HTML cho một thẻ phát triển
   */
  createCardElement(card, player, isCurrentTurn) {
    const { GEM_INFO_VI } = SplendorConstants;
    const cardEl = document.createElement('div');
    cardEl.className = 'dev-card';
    cardEl.dataset.cardId = card.id;

    // Kiểm tra khả năng mua được
    let canAfford = false;
    if (player && isCurrentTurn) {
      const payment = window.currentGameState?.calculateCardPayment(player, card);
      canAfford = payment?.canAfford || false;
      if (canAfford) {
        cardEl.classList.add('affordable');
      }
    }

    const gemInfo = GEM_INFO_VI[card.gem];

    // Tạo cột chi phí góc dưới
    let costPipsHtml = '';
    for (const [costGem, count] of Object.entries(card.cost)) {
      if (count > 0) {
        costPipsHtml += `
          <div class="cost-pip">
            <span class="cost-pip-circle cost-${costGem}">${count}</span>
          </div>
        `;
      }
    }

    // Biểu tượng tranh minh họa tùy theo tier và gem
    const illustrations = {
      diamond: '💎',
      sapphire: '⛵',
      emerald: '⛏️',
      ruby: '🏛️',
      onyx: '🏰'
    };

    cardEl.innerHTML = `
      <div class="card-header-row">
        <span class="card-prestige-points">${card.points > 0 ? card.points : ''}</span>
        <div class="card-gem-bonus bonus-${card.gem}" title="Bonus vĩnh viễn: ${gemInfo.name}">
          ${gemInfo.icon}
        </div>
      </div>
      <div class="card-artwork-frame">
        <span class="artwork-illustration">${illustrations[card.gem] || '💎'}</span>
      </div>
      <div class="card-costs-column">
        ${costPipsHtml}
      </div>
    `;

    cardEl.addEventListener('click', () => {
      this.openInspectModal(card, player, isCurrentTurn, false);
    });

    return cardEl;
  }

  /**
   * Vẽ toàn bộ ma trận 12 thẻ trên bàn cờ
   */
  renderBoard(boardCards, deckCounts, player, isCurrentTurn) {
    for (let t = 1; t <= 3; t++) {
      // Cập nhật số thẻ còn lại trong bộ bài
      const countEl = document.getElementById(`deck-count-${t}`);
      if (countEl) {
        countEl.textContent = deckCounts[t] !== undefined ? deckCounts[t] : 0;
      }

      // Vẽ 4 ô thẻ bài trên bàn
      const container = document.getElementById(`tier-${t}-cards`);
      if (container) {
        container.innerHTML = '';
        const cards = boardCards[t] || [];

        for (let i = 0; i < 4; i++) {
          const card = cards[i];
          if (card) {
            const cardEl = this.createCardElement(card, player, isCurrentTurn);
            container.appendChild(cardEl);
          } else {
            // Ô trống khi bộ bài hết thẻ
            const emptyEl = document.createElement('div');
            emptyEl.className = 'dev-card empty-slot';
            emptyEl.style.opacity = '0.2';
            emptyEl.style.border = '1px dashed #6d462b';
            emptyEl.style.cursor = 'default';
            container.appendChild(emptyEl);
          }
        }
      }
    }
  }

  /**
   * Mở modal xem chi tiết thẻ và xác nhận mua/giữ
   */
  openInspectModal(card, player, isCurrentTurn, fromReserved = false) {
    const modal = document.getElementById('card-inspect-modal');
    const previewContainer = document.getElementById('inspect-card-display');
    const titleEl = document.getElementById('inspect-tier-name');
    const costBreakdownEl = document.getElementById('inspect-cost-breakdown');
    const buyBtn = document.getElementById('btn-inspect-buy');
    const reserveBtn = document.getElementById('btn-inspect-reserve');
    const msgEl = document.getElementById('inspect-action-msg');

    if (!modal) return;

    this.selectedInspectCard = card;
    this.selectedInspectFromReserved = fromReserved;

    previewContainer.innerHTML = '';
    previewContainer.appendChild(this.createCardElement(card, player, false));

    const { GEM_INFO_VI } = SplendorConstants;
    titleEl.textContent = `Thẻ Phát Triển Tầng ${card.tier} (Bonus: ${GEM_INFO_VI[card.gem].name})`;

    // Tính toán chi phí thực tế sau giảm giá
    const payment = window.currentGameState?.calculateCardPayment(player, card);
    let breakdownHtml = '<div style="margin-top: 8px;"><strong>Chi phí thanh toán:</strong></div>';

    for (const [gem, needed] of Object.entries(card.cost)) {
      if (needed > 0) {
        const bonus = player?.bonuses[gem] || 0;
        const discount = Math.min(needed, bonus);
        const netCost = needed - discount;
        const tokenOwn = player?.tokens[gem] || 0;

        breakdownHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin: 4px 0; color: #fff;">
            <span>${GEM_INFO_VI[gem].icon} ${GEM_INFO_VI[gem].name}:</span>
            <span>Gốc: ${needed} | Bonus: -${discount} ➔ <strong>Phải trả: ${netCost}</strong> (Bạn có: ${tokenOwn})</span>
          </div>
        `;
      }
    }

    if (payment?.goldNeeded > 0) {
      breakdownHtml += `
        <div style="font-size: 11px; color: var(--gold-bright); margin-top: 6px;">
          🟡 Dùng ${payment.goldNeeded} Vàng đa năng thay thế cho ngọc còn thiếu.
        </div>
      `;
    }

    costBreakdownEl.innerHTML = breakdownHtml;

    // Kích hoạt/vô hiệu hóa các nút
    if (isCurrentTurn) {
      buyBtn.disabled = !payment?.canAfford;
      if (fromReserved) {
        reserveBtn.classList.add('hidden');
      } else {
        reserveBtn.classList.remove('hidden');
        reserveBtn.disabled = (player?.reservedCards?.length || 0) >= 3;
      }

      if (!payment?.canAfford) {
        msgEl.textContent = 'Bạn chưa đủ tài nguyên đá quý để mua thẻ bài này.';
      } else {
        msgEl.textContent = 'Bạn đủ điều kiện mua thẻ bài này!';
      }
    } else {
      buyBtn.disabled = true;
      reserveBtn.disabled = true;
      msgEl.textContent = 'Chưa đến lượt của bạn.';
    }

    modal.classList.remove('hidden');
  }

  /**
   * Vẽ danh sách thẻ đã giữ chỗ trên bảng người chơi
   */
  renderReservedCards(reservedCards, player, isCurrentTurn, containerId = 'mat-reserved-slots') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < 3; i++) {
      const card = reservedCards[i];
      if (card) {
        const miniCard = document.createElement('div');
        miniCard.className = 'dev-card mini-card';
        miniCard.style.width = '38px';
        miniCard.style.height = '52px';
        miniCard.style.cursor = 'pointer';

        const payment = window.currentGameState?.calculateCardPayment(player, card);
        if (payment?.canAfford && isCurrentTurn) {
          miniCard.classList.add('affordable');
        }

        const gemInfo = SplendorConstants.GEM_INFO_VI[card.gem];
        miniCard.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:10px;font-weight:900;color:#fff;">${card.points || ''}</span>
            <span style="font-size:10px;">${gemInfo.icon}</span>
          </div>
          <div style="font-size:8px;text-align:center;color:var(--gold-light);margin-top:8px;">
            T${card.tier}
          </div>
        `;

        miniCard.addEventListener('click', () => {
          this.openInspectModal(card, player, isCurrentTurn, true);
        });

        container.appendChild(miniCard);
      } else {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'reserved-empty-slot';
        emptySlot.textContent = '+';
        container.appendChild(emptySlot);
      }
    }
  }
}

window.SplendorCardRenderer = new CardRenderer();
