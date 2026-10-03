/**
 * Splendor Board Game - Trình Hiển Thị & Tương Tác Đá Quý (TokenRenderer.js)
 */

class TokenRenderer {
  constructor() {
    this.selectedGems = []; // Danh sách đá quý đang được chọn: ['diamond', ...]
    this.onConfirmTakeGems = null;
  }

  /**
   * Vẽ kho đá quý (Bank) và gắn sự kiện click
   */
  renderBank(bank, isCurrentPlayerTurn, containerId = 'gem-bank-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const { ALL_TOKENS, GEM_INFO_VI, GAME_RULES } = SplendorConstants;

    for (const gem of ALL_TOKENS) {
      const count = bank[gem] || 0;
      const info = GEM_INFO_VI[gem];
      const isGold = gem === 'gold';
      const isDisabled = count === 0 || isGold || !isCurrentPlayerTurn;

      const chip = document.createElement('div');
      chip.className = `gem-chip type-${gem} ${isDisabled ? 'disabled' : ''}`;
      chip.dataset.gem = gem;
      chip.title = `${info.name}: còn ${count} viên trong kho`;

      chip.innerHTML = `
        <span class="chip-icon">${info.icon}</span>
        <span class="chip-count-badge">${count}</span>
      `;

      if (!isDisabled) {
        chip.addEventListener('click', () => {
          this.handleGemClick(gem, bank);
        });
      }

      container.appendChild(chip);
    }

    this.updatePreviewAndConfirmButton(bank);
  }

  /**
   * Xử lý tương tác khi người chơi nhấn vào viên đá quý trong kho
   */
  handleGemClick(gem, bank) {
    if (gem === 'gold') {
      SplendorHelpers.showToast('Vàng đa năng chỉ nhận được khi bạn chọn Giữ Thẻ.', 'warning');
      return;
    }

    SplendorSound.playGemClick();

    const currentCountOfGem = this.selectedGems.filter(g => g === gem).length;

    // Trường hợp 1: Đang chọn 2 viên cùng màu
    if (this.selectedGems.length === 1 && this.selectedGems[0] === gem) {
      // Nếu kho có >= 4 viên thì cho phép chọn viên thứ 2 cùng màu
      if ((bank[gem] || 0) >= 4) {
        this.selectedGems.push(gem);
      } else {
        // Nếu không đủ 4 viên thì bỏ chọn
        this.selectedGems = [];
        SplendorHelpers.showToast(`Chỉ được lấy 2 viên ${SplendorConstants.GEM_INFO_VI[gem].name} khi kho còn từ 4 viên trở lên!`, 'warning');
      }
    }
    // Trường hợp 2: Đã chọn 2 viên cùng màu rồi, nhấn tiếp -> Bỏ chọn
    else if (this.selectedGems.length === 2 && this.selectedGems[0] === this.selectedGems[1] && this.selectedGems[0] === gem) {
      this.selectedGems = [];
    }
    // Trường hợp 3: Đang chọn khác màu
    else {
      // Nếu đã có viên này trong danh sách khác màu -> Hủy chọn nó
      if (this.selectedGems.includes(gem)) {
        this.selectedGems = this.selectedGems.filter(g => g !== gem);
      } else {
        // Nếu đã có 2 viên cùng màu trong danh sách thì reset trước khi thêm viên khác
        if (this.selectedGems.length === 2 && this.selectedGems[0] === this.selectedGems[1]) {
          this.selectedGems = [gem];
        } else if (this.selectedGems.length < 3) {
          this.selectedGems.push(gem);
        } else {
          SplendorHelpers.showToast('Bạn chỉ được chọn tối đa 3 viên đá quý khác màu!', 'warning');
        }
      }
    }

    this.highlightBankChips();
    this.updatePreviewAndConfirmButton(bank);
  }

  highlightBankChips() {
    const chips = document.querySelectorAll('#gem-bank-container .gem-chip');
    chips.forEach(chip => {
      const gem = chip.dataset.gem;
      const count = this.selectedGems.filter(g => g === gem).length;
      if (count > 0) {
        chip.classList.add('selected');
      } else {
        chip.classList.remove('selected');
      }
    });
  }

  clearSelection() {
    this.selectedGems = [];
    this.highlightBankChips();
    this.updatePreviewAndConfirmButton({});
  }

  /**
   * Cập nhật thanh preview và kích hoạt nút xác nhận
   */
  updatePreviewAndConfirmButton(bank) {
    const previewContainer = document.getElementById('selected-gems-preview');
    const confirmBtn = document.getElementById('btn-confirm-take-gems');
    const cancelBtn = document.getElementById('btn-cancel-gem-select');

    if (!previewContainer || !confirmBtn) return;

    if (this.selectedGems.length === 0) {
      previewContainer.innerHTML = '<span class="preview-hint">Chọn 3 viên khác màu hoặc 2 viên cùng màu (nguồn ≥4)</span>';
      confirmBtn.disabled = true;
      if (cancelBtn) cancelBtn.classList.add('hidden');
      return;
    }

    if (cancelBtn) cancelBtn.classList.remove('hidden');

    previewContainer.innerHTML = '';
    for (const gem of this.selectedGems) {
      const info = SplendorConstants.GEM_INFO_VI[gem];
      const mini = document.createElement('div');
      mini.className = `gem-chip mini-chip type-${gem}`;
      mini.innerHTML = `<span class="chip-icon">${info.icon}</span>`;
      previewContainer.appendChild(mini);
    }

    // Kiểm tra tính hợp lệ
    let isValid = false;
    const { BASE_GEMS } = SplendorConstants;
    const availableColors = BASE_GEMS.filter(g => (bank[g] || 0) > 0);
    const maxCanTake = Math.min(3, availableColors.length);

    if (this.selectedGems.length === 2 && this.selectedGems[0] === this.selectedGems[1]) {
      isValid = (bank[this.selectedGems[0]] || 0) >= 4;
    } else if (this.selectedGems.length === maxCanTake) {
      isValid = true;
    }

    confirmBtn.disabled = !isValid;
  }

  /**
   * Vẽ số đá quý trên tay người chơi
   */
  renderPlayerTokens(tokens, containerId = 'mat-tokens-row') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const { ALL_TOKENS, GEM_INFO_VI } = SplendorConstants;

    for (const gem of ALL_TOKENS) {
      const count = tokens[gem] || 0;
      const info = GEM_INFO_VI[gem];

      const chip = document.createElement('div');
      chip.className = `gem-chip mini-chip type-${gem} ${count === 0 ? 'disabled' : ''}`;
      chip.title = `${info.name}: sở hữu ${count} viên`;

      chip.innerHTML = `
        <span class="chip-icon">${info.icon}</span>
        <span class="chip-count-badge">${count}</span>
      `;

      container.appendChild(chip);
    }
  }
}

window.SplendorTokenRenderer = new TokenRenderer();
