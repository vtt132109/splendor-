/**
 * Splendor Board Game - Trình Hiển Thị Ô Quý Tộc Chuẩn Bản Gốc (NobleRenderer.js)
 */

class NobleRenderer {
  constructor() {
    this.onSelectNoble = null;
  }

  getNoblePortraitUrl(noble) {
    const queenIds = ['noble_1', 'noble_3', 'noble_6', 'noble_7', 'noble_8', 'noble_10'];
    if (queenIds.includes(noble.id)) {
      return 'assets/nobles/queen.jpg';
    }
    return 'assets/nobles/king.jpg';
  }

  /**
   * Tạo element hiển thị cho 1 ô quý tộc với tranh chân dung Phục Hưng
   */
  createNobleElement(noble, player) {
    const { GEM_INFO_VI } = SplendorConstants;
    const tile = document.createElement('div');
    tile.className = 'noble-tile';
    tile.dataset.nobleId = noble.id;
    tile.title = `${noble.name} - ${noble.title} (+3 điểm uy tín)`;

    const portraitUrl = this.getNoblePortraitUrl(noble);
    tile.style.backgroundImage = `url('${portraitUrl}')`;

    let reqsHtml = '';
    let isFullyQualified = true;

    for (const [gem, needed] of Object.entries(noble.requirements)) {
      const current = player?.bonuses[gem] || 0;
      const isMet = current >= needed;
      if (!isMet) isFullyQualified = false;

      reqsHtml += `
        <div class="noble-req-badge" title="${needed} thẻ bonus ${GEM_INFO_VI[gem].name}">
          <span class="cost-token-disc cost-${gem}">${needed}</span>
          <span style="font-size: 8px; font-weight:800; color: ${isMet ? '#4ade80' : '#e5e7eb'}">${current}/${needed}</span>
        </div>
      `;
    }

    if (isFullyQualified) {
      tile.style.borderColor = 'var(--gold-bright)';
      tile.style.boxShadow = '0 0 14px rgba(255, 215, 0, 0.8)';
    }

    tile.innerHTML = `
      <div class="noble-header">
        <span class="noble-points">${noble.points}</span>
        <span class="noble-name">${noble.name}</span>
      </div>
      <div class="noble-requirements-col">
        ${reqsHtml}
      </div>
    `;

    // Bấm vào để xem luật nhận Quý tộc & tiến độ thẻ bài của người chơi
    tile.addEventListener('click', () => {
      if (tile.closest('#noble-select-modal')) return;
      this.showNobleInfoModal(noble, player);
    });

    return tile;
  }

  /**
   * Hiển thị Modal chi tiết Quý Tộc / Thương Gia giải thích luật chơi tự động ghé thăm
   */
  showNobleInfoModal(noble, player) {
    if (window.SplendorSound) SplendorSound.playClick();
    const modal = document.getElementById('noble-detail-modal');
    if (!modal) return;

    const nameEl = document.getElementById('noble-detail-name');
    const portraitEl = document.getElementById('noble-detail-portrait');
    const reqsContainer = document.getElementById('noble-detail-reqs-list');
    const closeBtn = document.getElementById('btn-close-noble-detail');
    const understandBtn = document.getElementById('btn-understand-noble');

    if (nameEl) nameEl.textContent = `${noble.name} - ${noble.title}`;
    if (portraitEl) {
      portraitEl.style.backgroundImage = `url('${this.getNoblePortraitUrl(noble)}')`;
    }

    if (reqsContainer) {
      reqsContainer.innerHTML = '';
      const { GEM_INFO_VI } = SplendorConstants;

      for (const [gem, needed] of Object.entries(noble.requirements)) {
        const current = player?.bonuses ? (player.bonuses[gem] || 0) : 0;
        const isMet = current >= needed;
        const info = GEM_INFO_VI[gem] || { name: gem, icon: '💎' };

        const card = document.createElement('div');
        card.className = `noble-req-status-card ${isMet ? 'met' : ''}`;
        card.innerHTML = `
          <span class="noble-req-card-icon">${info.icon}</span>
          <div class="noble-req-card-info">
            <span class="noble-req-card-name">${info.name}</span>
            <span class="noble-req-card-progress" style="color: ${isMet ? '#4ade80' : '#f59e0b'}">
              ${isMet ? '✓ Đã đạt ' : 'Tiến độ: '}${current}/${needed} Thẻ Bài
            </span>
          </div>
        `;
        reqsContainer.appendChild(card);
      }
    }

    const closeModal = () => modal.classList.add('hidden');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (understandBtn) understandBtn.onclick = closeModal;

    modal.classList.remove('hidden');
  }

  /**
   * Vẽ danh sách quý tộc trên bàn cờ
   */
  renderNobles(nobles, currentPlayer, containerId = 'noble-tiles-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    for (const noble of nobles) {
      const el = this.createNobleElement(noble, currentPlayer);
      container.appendChild(el);
    }
  }

  /**
   * Mở modal lựa chọn Quý tộc khi đủ điều kiện nhiều vị cùng lúc
   */
  openNobleSelectModal(nobles, onSelect) {
    const modal = document.getElementById('noble-select-modal');
    const container = document.getElementById('noble-candidates-container');
    if (!modal || !container) return;

    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.gap = '14px';
    container.style.justifyContent = 'center';
    container.style.padding = '14px 0';

    for (const noble of nobles) {
      const el = this.createNobleElement(noble, null);
      el.style.cursor = 'pointer';
      el.style.transform = 'scale(1.2)';
      el.style.margin = '10px';
      el.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (typeof onSelect === 'function') {
          onSelect(noble.id);
        }
      });
      container.appendChild(el);
    }

    modal.classList.remove('hidden');
  }
}

window.SplendorNobleRenderer = new NobleRenderer();
