/**
 * Splendor Board Game - Quản Lý Âm Thanh Chuyên Nghiệp (SoundManager.js)
 * Tự động tổng hợp âm thanh chân thực bằng Web Audio API (không cần tải file ngoài)
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('splendor_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('splendor_muted', this.isMuted);
    return this.isMuted;
  }

  /**
   * Âm thanh chạm / chọn đá quý (tiếng click gốm/đá quý trong trẻo)
   */
  playGemClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // Note A5
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  /**
   * Âm thanh mua thẻ thành công (âm trầm chắc nịch + tiếng lật bài)
   */
  playCardBuy() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
      osc1.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.15); // E5

      osc2.frequency.setValueAtTime(554.37, this.ctx.currentTime + 0.05); // C#5
      osc2.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.25); // A5

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start(this.ctx.currentTime + 0.05);
      osc1.stop(this.ctx.currentTime + 0.3);
      osc2.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  /**
   * Âm thanh Quý Tộc diện kiến (Kèn lệnh vương giả)
   */
  playNobleVisit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch (e) {}
  }

  /**
   * Âm thanh chuông báo đến lượt bạn
   */
  playTurnBell() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime); // E6
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }

  /**
   * Âm thanh Khúc Khải Hoàn Chiến Thắng
   */
  playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const chords = [
        [523.25, 659.25, 783.99], // C Major
        [587.33, 739.99, 880.00], // D Major
        [659.25, 830.61, 987.77], // E Major
        [1046.50, 1318.51, 1567.98] // High C Major
      ];

      chords.forEach((chord, step) => {
        const time = this.ctx.currentTime + step * 0.25;
        chord.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);

          gain.gain.setValueAtTime(0.15, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(time);
          osc.stop(time + 0.5);
        });
      });
    } catch (e) {}
  }
}

window.SplendorSound = new SoundManager();
