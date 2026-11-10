# QRFrame Secure LAN — Các loại mã QR được hỗ trợ

Giao diện mới có **11 biểu mẫu**, tự sinh định dạng QR tương ứng. Không cần tự viết cú pháp. Dữ liệu chỉ được xử lý trong trình duyệt, không tự động lưu hoặc gửi lên server.

| Loại QR | Định dạng |
| --- | --- |
| Liên kết | URL HTTP/HTTPS; hỗ trợ host IP nội bộ |
| Văn bản | Văn bản tự do |
| Điện thoại | \`tel:\` |
| Wi-Fi | \`WIFI:T:WPA;S:...;P:...;H:...;;\` (hoặc \`nopass\`) |
| SMS | \`SMSTO:\` |
| Email | \`mailto:\` với tiêu đề và nội dung tùy chọn |
| Danh bạ | vCard 3.0; họ tên, số điện thoại, email, công ty, chức vụ, địa chỉ, website |
| Sự kiện | iCalendar / VEVENT; chuyển giờ cục bộ sang UTC |
| GPS | \`geo:latitude,longitude\` |
| WhatsApp | \`https://wa.me/\` (chỉ mở dịch vụ khi người dùng quét và truy cập) |
| Zalo | \`https://zalo.me/\` (chỉ mở dịch vụ khi người dùng quét và truy cập) |

Cả 11 loại **đều là QR tĩnh**, không có redirect server, database, hoặc tracking.

## Quyền riêng tư và bảo mật

- Mật khẩu Wi-Fi nằm trong **chính mã QR tạo ra**; ai quét QR đều có thể đọc thông tin này. Không chia sẻ QR Wi-Fi ra nơi công cộng.
- Các mẫu danh bạ và sự kiện có thể chứa dữ liệu cá nhân. Ứng dụng không lưu dữ liệu, nhưng nếu chia sẻ ảnh QR thì người nhận cũng sẽ đọc được.
- URL/WhatsApp/Zalo chỉ mã hóa liên kết; bản thân trang QRFrame không mở kết nối ra bên ngoài. **Điện thoại quét QR và tự mở liên kết mới có thể kết nối tới dịch vụ ngoài**.
- Không có trình chạy JavaScript tự do, không dựng SVG từ chuỗi HTML do người dùng nhập.
- Nginx CSP \`connect-src 'none'\`, \`worker-src 'none'\`, \`script-src 'self'\` để chống gọi ra ngoài.
- Không thể đảm bảo an toàn tuyệt đối: cần firewall hạn chế IP, HTTPS/VPN nội bộ, scan CVE và kiểm tra bản image được dùng.
- \`192.168.20.194:18890\` vẫn chỉ là **IP/port đã đặt trong Compose**, chưa xác nhận container đã triển khai trên Proxmox.
- Để đảm bảo an toàn, chức năng chạy preset nghệ thuật bằng JavaScript và các mẫu tải remote assets **không có trong bản image này**.

## Kiểm thử

\`node --test tests/qr-payload.test.mjs\` kiểm tra các loại dữ liệu URL, điện thoại, Wi-Fi, SMS, email, vCard, lịch, GPS và liên kết ứng dụng. GitHub Actions build image và khởi động container theo đúng Docker Compose.
