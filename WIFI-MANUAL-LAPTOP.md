# QR Wi-Fi cho người dùng laptop — xem SSID và mật khẩu dưới hình

## Cách sử dụng
1. Chọn **Loại QR: Kết nối Wi-Fi**.
2. Nhập **Tên Wi-Fi (SSID)**, kiểu bảo mật (WPA hoặc mạng mở), mật khẩu và mạng ẩn nếu có.
3. Bật lựa chọn **“Hiện tên Wi-Fi và mật khẩu dưới mã QR”** ngay trong phần Wi-Fi.
4. QR hiển thị kèm một phần dành cho laptop: **Tên Wi-Fi (SSID) + Mật khẩu Wi-Fi**, dưới cùng của mã. Người dùng laptop không cần dùng điện thoại quét mã: có thể xem nội dung ở phía dưới và nhập thủ công.
5. Khi **Tải PNG (1024px)** hoặc **Tải SVG**, SSID và mật khẩu sẽ được **in ngay trong ảnh**. Có thêm khung văn bản chọn/copy được trong trang xem trước.
6. Chọn **Xóa dữ liệu nhập** để xóa mật khẩu và tắt chức năng in mật khẩu.

**Mặc định chức năng in thông tin bị TẮT** nhằm tránh vô tình công khai mật khẩu Wi-Fi.

### Chú ý an toàn
- Mật khẩu Wi-Fi được in **rõ ràng** dưới QR khi bật, và sẽ tồn tại bên trong file ảnh PNG/SVG. Bất kỳ ai được xem, tải, chụp hoặc in mã QR đều có thể đọc mật khẩu.
- Phù hợp Wi-Fi **Guest**/Wi-Fi dùng cho khách, không khuyến nghị dùng cho Wi-Fi quản trị, camera, hạ tầng, nội bộ nhân sự nhạy cảm.
- Tên và mật khẩu dùng **trực tiếp từ biểu mẫu Wi-Fi** đã nhập, không cần gõ lại. Khi đổi sang loại QR khác, khung thủ công biến mất.
- Trường mật khẩu hỗ trợ ký tự đặc biệt và khoảng trắng, và được chia thành nhiều dòng khi quá dài. **Khi nhập thủ công, nối liền các dòng, không thêm khoảng trắng**.
- Ứng dụng chạy trong trình duyệt và không tự gửi thông tin về server/CDN; vẫn cần HTTPS/VPN và firewall của VM/Docker host để tránh nghe lén dữ liệu trên LAN.
- Cần quét thử mã bằng điện thoại và thử kết nối trên laptop trước khi phát cho khách hoặc in hàng loạt.

File thực hiện: `secure/index.html`, `secure/app.js`, `secure/branding.js`, `secure/style.css`, `tests/qr-branding.test.mjs`.

**Chưa deploy lên Proxmox.** Branch `security/offline-lan-no-exec-20261110` và `docker-compose.portainer.yml`, IP/port dự kiến `192.168.20.194:18890`. Chưa merge main để tránh thay đổi các stack Docker không có xác nhận.
