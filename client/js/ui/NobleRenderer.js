/**
 * Splendor Board Game - Trình Hiển Thị Ô Quý Tộc (NobleRenderer.js)
 */

class NobleRenderer {
  constructor() {
    this.onSelectNoble = null;
  }

  /**
   * Tạo element hiển thị cho 1 ô quý tộc
   */
  createNobleElement(noble, player) {
    const { GEM_INFO_VI } = SplendorConstants;
    const tile = document.createElement('div');
    tile.className = 'noble-tile';
    tile.dataset.nobleId = noble.id;
    tile.title = `${noble.name} - ${noble.title} (+3 điểm uy tín)`;

    let reqsHtml = '';
    let isFullyQualified = true;

    for (const [gem, needed] of Object.entries(noble.requirements)) {
      const current = player?.bonuses[gem] || 0;
      const isMet = current >= needed;
      if (!isMet) isFullyQualified = false;

      reqsHtml += `
        <div class="noble-req-pip" title="${needed} thẻ bonus ${GEM_INFO_VI[gem].name}">
          <span class="cost-pip-circle cost-${gem}">${needed}</span>
          <span style="font-size: 8px; color: ${isMet ? '#4ade80' : '#d1d5db'}">(${current})</span>
        </div>
      `;
    }

    if (isFullyQualified) {
      tile.style.borderColor = 'var(--gold-bright)';
      tile.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.6)';
    }

    tile.innerHTML = `
      <div class="noble-header">
        <span class="noble-points">${noble.points}</span>
        <span class="noble-avatar-icon">${noble.icon || '👑'}</span>
      </div>
      <div style="font-size: 9px; font-weight: 700; color: var(--gold-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${noble.name}
      </div>
      <div class="noble-requirements-row">
        ${reqsHtml}
      </div>
    `;

    return tile;
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
    container.style.gap = '12px';
    container.style.justifyContent = 'center';
    container.style.padding = '14px 0';

    for (const noble of nobles) {
      const el = this.createNobleElement(noble, null);
      el.style.cursor = 'pointer';
      el.style.transform = 'scale(1.1)';
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
