# QRFrame Secure LAN — Danh mục QR đa năng

Đây là bản dành cho Docker/Portainer trong LAN, ưu tiên **không theo dõi và không chuyển nội dung người dùng cho máy chủ**. Không tự tạo redirect hay lưu dữ liệu.

## 35 nhóm QR đã có biểu mẫu

**11 loại cơ bản:** URL, Văn bản, Điện thoại, Wi-Fi, SMS, Email, Danh bạ vCard 3.0, Sự kiện iCalendar, GPS, WhatsApp, Zalo.

**24 loại bổ sung:**
1. Landing Page / Link-in-Bio
2. Mạng xã hội
3. Mã khuyến mại / coupon (văn bản)
4. Menu / thực đơn (URL)
5. PDF (URL)
6. Tài liệu / file (URL)
7. Sản phẩm (URL)
8. Catalogue (URL)
9. Ứng dụng / App Store (URL)
10. Họp trực tuyến Zoom/Teams/Meet (URL)
11. Google Maps / chỉ đường (URL)
12. Đánh giá / Google Review (URL)
13. Video (URL)
14. Livestream (URL)
15. Booking / đặt lịch (URL)
16. Form / khảo sát (URL)
17. Feedback (URL)
18. Helpdesk/GLPI/Zammad (URL)
19. Payment Link / cổng thanh toán (URL)
20. Link tải tệp / ứng dụng (URL)
21. Vé điện tử / check-in (URL)
22. Portfolio (URL)
23. Album ảnh (URL)
24. VietQR chuyển khoản nội địa theo NAPAS/EMVCo (tạo payload và CRC16 hoàn toàn offline).

**23 nền tảng** trong nhóm Social: Facebook, Instagram, TikTok, YouTube, LinkedIn, Threads, X/Twitter, Telegram, GitHub, Spotify, Pinterest, Discord, Twitch, Reddit, Zalo, WhatsApp, Snapchat, SoundCloud, LINE, Shopee, Lazada, Google Play, Apple App Store.

## Landing Page (HTML độc lập, không tracking)

7 mục đích/mẫu nội dung dùng chung một layout an toàn: **Link-in-Bio, doanh nghiệp, menu, sản phẩm, sự kiện, portfolio, liên hệ**.

Cho phép nhập tiêu đề, khẩu hiệu, mô tả, danh sách các mục/dịch vụ/món ăn, tối đa 3 nút liên kết, số điện thoại, email, địa chỉ và màu sắc; có **Xem trước** và **Tải file HTML**. File HTML xuất ra:
- Không JavaScript, không CDN, không font/ảnh bên ngoài, không analytics/cookie.
- Có CSP `script-src 'none'`, escape HTML do người dùng nhập và chỉ cho link HTTP/HTTPS; các đường liên hệ `tel:`/`mailto:` được kiểm tra định dạng.
- Bản thân HTML có thể mở offline. Để người quét QR xem được, **phải tự đăng file HTML lên web server/NAS/reverse proxy** và nhập URL vào trường Landing Page. Không có backend tự publish.
- URL LAN chỉ hoạt động cho người đang ở cùng LAN/VPN với quyền truy cập web server.
- Người đọc landing page có thể mở các đường dẫn tới dịch vụ ngoài theo chủ ý. Không có kết nối ngoài tự động từ HTML.

## Thanh toán VietQR — lưu ý quan trọng

QR chuyển khoản NAPAS: mã BIN ngân hàng **6 chữ số**, tài khoản nhận tiền, số tiền VND nguyên dương (tùy chọn), nội dung không dấu (tối đa 25 ký tự); tạo CRC-16/CCITT-FALSE. Không gọi VietQR API, ngân hàng, CDN hoặc Internet để tạo mã. Đây là **mã thanh toán tĩnh**, không xác nhận giao dịch, không chuyển tiền và không theo dõi giao dịch. Cần kiểm tra tên người nhận, số tài khoản, số tiền bằng ứng dụng ngân hàng trước khi thanh toán.

Nguồn tham chiếu: https://github.com/iamv4g/vietqr.dart/blob/main/packages/vietqr_core/vietqr_field_definitions_en.md

## Ranh giới tính năng / bảo mật

- Không có hệ thống QR động (thay đích sau khi in), thống kê quét, đăng ký tài khoản, tự upload PDF, lưu trang landing lên server, hệ thống thanh toán trực tiếp hoặc xác thực vé/coupon. Những chức năng này cần backend và kiểm soát riêng; bản bảo mật cố tình không bật.
- Khi mã QR chứa mật khẩu Wi-Fi, danh bạ, tài khoản hoặc dữ liệu riêng tư, **người có ảnh QR có thể đọc dữ liệu**. Không dùng QR làm phương tiện giữ bí mật.
- Legacy JavaScript editor và các preset nghệ thuật tải mã từ bên ngoài **không nằm trong image**. 3 kiểu tạo QR offline được hỗ trợ: vuông, bo góc, chấm tròn; có màu tùy chỉnh, sửa lỗi H/Q/M/L, SVG/PNG.
- Không có script bên ngoài/tracking trong mã runtime đã kiểm tra. Nhưng không có bảo đảm an toàn tuyệt đối; vẫn cần rà quét CVE/dependency/image và harden VM/Proxmox.
- Hạn chế truy cập theo IP, firewall chặn egress và dùng HTTPS/VPN tin cậy. **Mạng Docker bridge riêng KHÔNG tự chặn outbound Internet.**
- Port mặc định trên Docker host dự kiến là `192.168.20.194:18890`, container `18090`; Proxmox/VM/LXC thực tế chưa xác minh. `18889` dành cho QRForge.

## Thử nghiệm và triển khai

Nhánh: `security/offline-lan-no-exec-20261110`. File Stack: `docker-compose.portainer.yml`. GitHub Actions kiểm thử `node --test tests/*.test.mjs`, Docker build, Compose, cổng `18890`, CSP.

**Chưa merge `main`, chưa deploy Proxmox.** Không dùng `ghcr.io/hoangthang0106/qrframe:main` cũ cho đến khi thay đổi được review/merge/build. Trong Portainer Repository chọn đúng nhánh bảo mật và phải dùng endpoint có quyền build từ Git.
