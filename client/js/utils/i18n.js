/**
 * Splendor Board Game - Ngôn Ngữ & Văn Bản Tiếng Việt Toàn Diện (i18n.js)
 */

const SplendorI18n = {
  appName: 'Splendor',
  tagline: 'Kiệt Tác Đá Quý Phục Hưng',

  gems: {
    diamond: 'Kim cương',
    sapphire: 'Sapphire',
    emerald: 'Ngọc lục bảo',
    ruby: 'Ruby',
    onyx: 'Mã não',
    gold: 'Vàng đa năng'
  },

  tiers: {
    1: 'Cấp 1 (Cơ Bản)',
    2: 'Cấp 2 (Trung Cấp)',
    3: 'Cấp 3 (Cao Cấp)'
  },

  actions: {
    takeThreeGems: 'Lấy 3 viên đá quý khác màu',
    takeTwoSameGems: 'Lấy 2 viên đá quý cùng màu',
    reserveCard: 'Giữ chỗ thẻ phát triển (+1 Vàng)',
    purchaseCard: 'Mua thẻ phát triển',
    discardTokens: 'Trả đá quý thừa về kho',
    selectNoble: 'Chọn vị quý tộc ghé thăm'
  },

  rulesHtml: `
    <div class="rules-section">
      <h3 style="color: var(--gold-bright); margin-bottom: 8px;">1. MỤC TIÊU TRẬN ĐẤU</h3>
      <p>Trong Splendor, bạn vào vai một đại thương gia giàu có thời kỳ Phục Hưng. Bạn thu thập các viên đá quý thô, mua các tuyến mỏ, tàu vận chuyển và các nghệ nhân kim hoàn lành nghề. Người chơi đầu tiên đạt <strong>15 điểm uy tín</strong> sẽ kích hoạt vòng chơi cuối cùng. Kết thúc vòng, ai sở hữu nhiều điểm uy tín nhất sẽ giành chiến thắng!</p>
    </div>

    <div class="rules-section" style="margin-top: 14px;">
      <h3 style="color: var(--gold-bright); margin-bottom: 8px;">2. BỐN HÀNH ĐỘNG MỖI LƯỢT (CHỌN ĐÚNG 1)</h3>
      <ul style="padding-left: 20px; line-height: 1.6; color: var(--text-parchment-muted);">
        <li><strong style="color: #fff;">Lấy 3 viên đá quý khác màu:</strong> Chọn 3 viên khác loại từ kho cung ứng (trừ viên Vàng).</li>
        <li><strong style="color: #fff;">Lấy 2 viên đá quý cùng màu:</strong> Chỉ được lấy khi màu đó trong kho còn từ <strong>4 viên trở lên</strong>.</li>
        <li><strong style="color: #fff;">Giữ chỗ 1 thẻ bài:</strong> Nhặt 1 thẻ trên bàn (hoặc rút thẻ ẩn đầu bộ bài) cất vào tay (tối đa giữ 3 thẻ). Đồng thời nhận ngay <strong>1 viên Vàng đại diện</strong> nếu kho còn Vàng.</li>
        <li><strong style="color: #fff;">Mua 1 thẻ bài:</strong> Mua từ 12 thẻ trên bàn hoặc từ các thẻ bạn đã giữ chỗ. Trả chi phí bằng đá quý trong tay. Mỗi thẻ đã mua cho bạn <strong>1 điểm giảm giá vĩnh viễn (bonus)</strong> vĩnh viễn cho các lần mua tiếp theo, một số thẻ cho điểm uy tín.</li>
      </ul>
    </div>

    <div class="rules-section" style="margin-top: 14px;">
      <h3 style="color: var(--gold-bright); margin-bottom: 8px;">3. CÁC VỊ QUÝ TỘC (3 ĐIỂM UY TÍN)</h3>
      <p>Cuối mỗi lượt, các vị quý tộc sẽ tự động ghé thăm người chơi nào đã tích lũy đủ số thẻ bài giảm giá (bonus) theo yêu cầu trên ô quý tộc. Bạn không thể từ chối quý tộc ghé thăm. Mỗi quý tộc mang lại <strong>3 điểm uy tín quý giá</strong>!</p>
    </div>

    <div class="rules-section" style="margin-top: 14px;">
      <h3 style="color: var(--gold-bright); margin-bottom: 8px;">4. GIỚI HẠN 10 VIÊN ĐÁ QUÝ</h3>
      <p>Sau khi lấy đá quý, nếu tổng số lượng token (kể cả vàng) bạn đang cầm vượt quá 10 viên, bạn phải trả lại phần thừa vào kho cung ứng cho đến khi chỉ còn đúng 10 viên.</p>
    </div>

    <div class="rules-section" style="margin-top: 14px;">
      <h3 style="color: var(--gold-bright); margin-bottom: 8px;">5. ĐIỀU KIỆN THẮNG & PHÂN ĐỊNH HÒA</h3>
      <p>Khi một người chơi đạt 15 điểm uy tín, vòng chơi hiện tại sẽ là <strong>vòng cuối cùng</strong>. Trò chơi tiếp tục cho đến khi người chơi cuối cùng trong lượt hoàn thành nước đi để đảm bảo tất cả mọi người có số lượt bằng nhau. Nếu hòa điểm uy tín, người nào <strong>mua ít thẻ hơn</strong> sẽ giành chiến thắng!</p>
    </div>
  `
};
