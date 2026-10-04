/**
 * Splendor Board Game - Xác Thực Google OAuth Phía Server (server/auth.js)
 * Cung cấp xác minh ID Token với máy chủ Google và quản lý cấu hình OAuth
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dotenv').config(); // Fallback nếu có file .env trong server/

class ServerAuth {
  constructor() {
    this.googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  }

  getGoogleClientId() {
    return this.googleClientId || process.env.GOOGLE_CLIENT_ID || '';
  }

  setGoogleClientId(clientId) {
    this.googleClientId = (clientId || '').trim();
    process.env.GOOGLE_CLIENT_ID = this.googleClientId;
  }

  /**
   * Xác minh Google ID Token trực tiếp với endpoint chính thức của Google:
   * https://oauth2.googleapis.com/tokeninfo?id_token=...
   */
  async verifyIdToken(idToken) {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('ID Token không hợp lệ.');
    }

    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || 'Xác thực ID Token với máy chủ Google thất bại.');
      }

      const payload = await response.json();

      // Kiểm tra audience nếu đã cấu hình Client ID
      const expectedClientId = this.getGoogleClientId();
      if (expectedClientId && payload.aud !== expectedClientId) {
        console.warn(`[Auth] Cảnh báo: Token aud (${payload.aud}) khác expected Client ID (${expectedClientId})`);
      }

      // Đảm bảo email đã được xác minh bởi Google
      if (payload.email_verified === 'false' || payload.email_verified === false) {
        throw new Error('Email chưa được xác thực trên tài khoản Google.');
      }

      return {
        success: true,
        user: {
          uid: 'google_' + payload.sub,
          sub: payload.sub,
          email: payload.email,
          name: payload.name || payload.given_name || 'Thương Gia Google',
          avatar: payload.picture || null,
          isGoogle: true
        }
      };
    } catch (err) {
      console.error('[Auth Server] Lỗi xác minh Google Token:', err.message);
      throw err;
    }
  }

  /**
   * Xác minh Google Access Token với endpoint userinfo chính thức của Google:
   * https://www.googleapis.com/oauth2/v3/userinfo
   */
  async verifyAccessToken(accessToken) {
    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('Access Token không hợp lệ.');
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || 'Xác thực Access Token với máy chủ Google thất bại.');
      }

      const payload = await response.json();
      return {
        success: true,
        user: {
          uid: 'google_' + payload.sub,
          sub: payload.sub,
          email: payload.email,
          name: payload.name || payload.given_name || 'Thương Gia Google',
          avatar: payload.picture || null,
          isGoogle: true
        }
      };
    } catch (err) {
      console.error('[Auth Server] Lỗi xác minh Access Token:', err.message);
      throw err;
    }
  }

  /**
   * Phương thức hợp nhất: chấp nhận idToken hoặc accessToken
   */
  async verifyGoogleToken({ idToken, accessToken }) {
    if (idToken) {
      return await this.verifyIdToken(idToken);
    }
    if (accessToken) {
      return await this.verifyAccessToken(accessToken);
    }
    throw new Error('Vui lòng cung cấp Google id_token hoặc access_token.');
  }

  /**
   * Giải mã nhanh payload JWT (không xác minh chữ ký, dùng cho fallback)
   */
  decodeJwtPayload(jwtToken) {
    try {
      const parts = jwtToken.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}

module.exports = new ServerAuth();
