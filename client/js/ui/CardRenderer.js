/**
 * Splendor Board Game - Trình Hiển Thị Thẻ Phát Triển Chuẩn Bản Gốc (CardRenderer.js)
 */

class CardRenderer {
  constructor() {
    this.onPurchaseCard = null;
    this.onReserveCard = null;
    this.selectedInspectCard = null;
    this.selectedInspectFromReserved = false;
    this.initInspectModalEvents();
  }

  /**
   * Chọn tranh minh họa chuẩn xác nhất theo Tier và Loại Đá Quý
   */
  getCardArtworkUrl(card) {
    if (card.tier === 1) {
      switch (card.gem) {
        case 'diamond': return 'assets/cards/diamond_mine.jpg';
        case 'sapphire': return 'assets/cards/sapphire_mine.jpg';
        case 'emerald': return 'assets/cards/emerald_mine.jpg';
        case 'ruby': return 'assets/cards/ruby_mine.jpg';
        case 'onyx': return 'assets/cards/onyx_mine.jpg';
      }
    } else if (card.tier === 2) {
      if (card.gem === 'sapphire') return 'assets/cards/trade_ship.jpg';
      if (card.gem === 'emerald' || card.gem === 'onyx') return 'assets/cards/caravan.jpg';
      return 'assets/cards/workshop.jpg';
    } else if (card.tier === 3) {
      if (card.points >= 4) return 'assets/cards/crown_jewels.jpg';
      return 'assets/cards/palace.jpg';
    }
    return 'assets/cards/diamond_mine.jpg';
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
   * Tạo element HTML cho một thẻ phát triển chuẩn bản gốc Splendor
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
    const artworkUrl = this.getCardArtworkUrl(card);

    // Tạo các chấm chi phí đá quý hình đĩa tròn góc dưới
    let costPipsHtml = '';
    for (const [costGem, count] of Object.entries(card.cost)) {
      if (count > 0) {
        costPipsHtml += `
          <div class="cost-token-disc cost-${costGem}" title="${count} ${GEM_INFO_VI[costGem].name}">
            ${count}
          </div>
        `;
      }
    }

    cardEl.innerHTML = `
      <!-- Tranh minh họa nền 64% thẻ -->
      <div class="card-artwork-bg" style="background-image: url('${artworkUrl}');"></div>

      <!-- Header: Điểm uy tín & Bonus đá quý -->
      <div class="card-top-overlay">
        <span class="card-prestige-points">${card.points > 0 ? card.points : ''}</span>
        <div class="card-gem-facet-badge bonus-${card.gem}" title="Bonus vĩnh viễn: ${gemInfo.name}">
          ${gemInfo.icon}
        </div>
      </div>

      <!-- Khay đáy: Danh sách chi phí đá quý -->
      <div class="card-bottom-tray">
        <div class="card-costs-grid">
          ${costPipsHtml}
        </div>
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
    const inspectCard = this.createCardElement(card, player, false);
    inspectCard.style.transform = 'scale(1.2)';
    inspectCard.style.margin = '10px auto';
    previewContainer.appendChild(inspectCard);

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
        const miniCard = this.createCardElement(card, player, isCurrentTurn);
        miniCard.classList.add('mini-card');
        miniCard.style.width = '40px';
        miniCard.style.height = '54px';
        miniCard.style.cursor = 'pointer';

        // Thu nhỏ các thành phần trên thẻ giữ
        const pointsEl = miniCard.querySelector('.card-prestige-points');
        if (pointsEl) pointsEl.style.fontSize = '12px';

        const facetEl = miniCard.querySelector('.card-gem-facet-badge');
        if (facetEl) {
          facetEl.style.width = '14px';
          facetEl.style.height = '14px';
          facetEl.style.fontSize = '9px';
        }

        const tray = miniCard.querySelector('.card-bottom-tray');
        if (tray) tray.style.display = 'none';

        miniCard.addEventListener('click', (e) => {
          e.stopPropagation();
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
