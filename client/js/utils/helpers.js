/**
 * Splendor Board Game - Các Hàm Tiện Ích Trợ Giúp (helpers.js)
 */

const SplendorHelpers = {
  /**
   * Hiển thị thông báo Toast nổi trên màn hình
   */
  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✨';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '🔔';

    toast.innerHTML = `<span style="margin-right: 6px;">${icon}</span>${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Sao chép văn bản vào Clipboard kèm thông báo
   */
  async copyToClipboard(text, successMsg = 'Đã sao chép vào bộ nhớ tạm!') {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      this.showToast(successMsg, 'success');
      return true;
    } catch (err) {
      console.error('Lỗi sao chép:', err);
      this.showToast('Không thể sao chép tự động, vui lòng chọn thủ công.', 'error');
      return false;
    }
  },

  /**
   * Quản lý thống kê người chơi trên LocalStorage
   */
  getUserStats() {
    const defaultStats = {
      totalGames: 0,
      totalWins: 0,
      winRate: 0,
      highestScore: 0
    };
    try {
      const data = localStorage.getItem('splendor_user_stats');
      return data ? JSON.parse(data) : defaultStats;
    } catch (e) {
      return defaultStats;
    }
  },

  saveUserStats(stats) {
    try {
      localStorage.setItem('splendor_user_stats', JSON.stringify(stats));
    } catch (e) {}
  },

  recordGameFinished(isWinner, finalScore) {
    const stats = this.getUserStats();
    stats.totalGames++;
    if (isWinner) stats.totalWins++;
    stats.winRate = Math.round((stats.totalWins / stats.totalGames) * 100);
    if (finalScore > (stats.highestScore || 0)) {
      stats.highestScore = finalScore;
    }
    this.saveUserStats(stats);
    return stats;
  }
};
