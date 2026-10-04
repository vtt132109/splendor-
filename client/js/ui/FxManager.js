/**
 * Splendor Board Game - Quản Lý Hiệu Ứng Hoạt Họa Đá Bay & Thẻ Bay 60 FPS (FxManager.js)
 */

class FxManager {
  constructor() {
    this.container = null;
  }

  ensureContainer() {
    if (!this.container || !document.body.contains(this.container)) {
      let el = document.getElementById('game-fx-overlay');
      if (!el) {
        el = document.createElement('div');
        el.id = 'game-fx-overlay';
        el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;overflow:hidden;';
        document.body.appendChild(el);
      }
      this.container = el;
    }
    return this.container;
  }

  /**
   * Bay đá quý từ Kho (Bank) về phía người chơi
   */
  flyGems(gems, isForMe = true, targetEl = null) {
    if (!gems || !Array.isArray(gems) || gems.length === 0) return;
    const container = this.ensureContainer();

    const destEl = targetEl || (isForMe
      ? (document.getElementById('mat-tokens-row') || document.getElementById('mat-mobile-token-pill') || document.getElementById('current-player-mat'))
      : (document.querySelector('.opponent-card.active-turn') || document.getElementById('other-players-container')));

    const destRect = destEl
      ? destEl.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight - 50, width: 30, height: 30 };
    const destX = destRect.left + destRect.width / 2;
    const destY = destRect.top + destRect.height / 2;

    const { GEM_INFO_VI } = SplendorConstants;

    gems.forEach((gem, idx) => {
      setTimeout(() => {
        const sourceChip = document.querySelector(`#gem-bank-container [data-gem="${gem}"]`);
        const sourceRect = sourceChip
          ? sourceChip.getBoundingClientRect()
          : { left: window.innerWidth - 60, top: window.innerHeight / 2, width: 30, height: 30 };
        const startX = sourceRect.left + sourceRect.width / 2;
        const startY = sourceRect.top + sourceRect.height / 2;

        const info = GEM_INFO_VI[gem] || { icon: '💎' };
        const particle = document.createElement('div');
        particle.className = `fx-flying-gem gem-bg-${gem}`;
        particle.innerHTML = info.icon;
        particle.style.cssText = `
          position: absolute;
          left: ${startX}px;
          top: ${startY}px;
          transform: translate(-50%, -50%) scale(1.1);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.85), 0 0 10px rgba(255,215,0,0.8);
          z-index: 10000;
          transition: transform 0.42s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.42s ease;
        `;

        container.appendChild(particle);

        // Kích hoạt bay
        requestAnimationFrame(() => {
          particle.style.transform = `translate(${destX - startX}px, ${destY - startY}px) scale(0.65)`;
          particle.style.opacity = '0.92';
        });

        // Tạo tia sáng lấp lánh trên đường bay
        this.createSparkle((startX + destX) / 2 + (Math.random() * 20 - 10), (startY + destY) / 2 + (Math.random() * 20 - 10));

        setTimeout(() => {
          particle.remove();
          this.createSparkle(destX, destY, '#ffd700');
        }, 440);
      }, idx * 70);
    });
  }

  /**
   * Bay thẻ bài khi mua về khu vực bonus của người chơi
   */
  flyCard(cardId, isForMe = true, cardData = null) {
    const container = this.ensureContainer();

    const cardEl = cardId ? document.querySelector(`.dev-card[data-card-id="${cardId}"]`) : null;
    const destEl = isForMe
      ? (document.getElementById('mat-bonuses-row') || document.getElementById('current-player-mat'))
      : (document.querySelector('.opponent-card.active-turn') || document.getElementById('other-players-container'));

    const startRect = cardEl
      ? cardEl.getBoundingClientRect()
      : { left: window.innerWidth / 2 - 40, top: window.innerHeight / 2 - 50, width: 80, height: 110 };
    const destRect = destEl
      ? destEl.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight - 60, width: 60, height: 40 };

    const startX = startRect.left;
    const startY = startRect.top;
    const destX = destRect.left + destRect.width / 2 - startRect.width / 2;
    const destY = destRect.top + destRect.height / 2 - startRect.height / 2;

    const ghost = document.createElement('div');
    ghost.className = 'fx-flying-card';
    if (cardData && cardData.gem) {
      ghost.classList.add(`gem-bg-${cardData.gem}`);
    }
    ghost.style.cssText = `
      position: absolute;
      left: ${startX}px;
      top: ${startY}px;
      width: ${startRect.width}px;
      height: ${startRect.height}px;
      border: 2px solid var(--gold-bright);
      border-radius: 8px;
      background: rgba(35, 20, 12, 0.95);
      box-shadow: 0 8px 24px rgba(0,0,0,0.9), 0 0 20px rgba(255,215,0,0.9);
      z-index: 10001;
      transform: scale(1.05);
      transition: transform 0.52s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.52s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    `;
    ghost.innerHTML = '✨';

    container.appendChild(ghost);

    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${destX - startX}px, ${destY - startY}px) scale(0.35)`;
      ghost.style.opacity = '0.75';
    });

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const factor = (i + 1) / 5;
        this.createSparkle(
          startX + (destX - startX) * factor + (Math.random() * 30 - 15),
          startY + (destY - startY) * factor + (Math.random() * 30 - 15)
        );
      }, i * 85);
    }

    setTimeout(() => {
      ghost.remove();
      this.createSparkle(destRect.left + destRect.width / 2, destRect.top + destRect.height / 2, '#4ade80');
    }, 540);
  }

  /**
   * Tạo hạt ánh sáng lấp lánh (Sparkle)
   */
  createSparkle(x, y, color = '#ffd700') {
    const container = this.ensureContainer();
    const sp = document.createElement('div');
    sp.innerHTML = '✦';
    sp.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      color: ${color};
      font-size: ${Math.floor(Math.random() * 8 + 10)}px;
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 1;
      transition: transform 0.4s ease-out, opacity 0.4s ease-out;
      pointer-events: none;
      z-index: 10002;
      text-shadow: 0 0 6px ${color};
    `;
    container.appendChild(sp);

    requestAnimationFrame(() => {
      sp.style.transform = `translate(-50%, -50%) scale(1.4) translateY(-10px)`;
      sp.style.opacity = '0';
    });

    setTimeout(() => sp.remove(), 420);
  }
}

window.SplendorFx = new FxManager();
