# QRFrame Secure LAN — Tiếng Việt / English (offline)

**Ngôn ngữ mặc định: Tiếng Việt.** Chọn **🇬🇧 English** tại góc trên bên phải để chuyển giao diện sang tiếng Anh; chọn **🇻🇳 Tiếng Việt** để đổi lại.

## Nội dung được dịch
- Menu loại QR (35 nhóm QR), các biểu mẫu Phone, Wi-Fi, SMS, Email, Contact/vCard, Events, GPS, Social, Menu/PDF/Link, VietQR.
- Các kiểu QR (9 mẫu), ô định vị (3 mẫu), màu sắc, sửa lỗi QR, tùy chỉnh kích thước PNG/SVG.
- Upload logo, lựa chọn kích thước logo, SCAN ME, chữ trên/dưới ảnh và các cảnh báo.
- Phần Wi-Fi có 2 ô cho phép **tự nhập chữ muốn in** độc lập với dữ liệu mật khẩu trong mã QR.
- Landing Page: biểu mẫu, thông báo và file HTML xuất theo ngôn ngữ đang chọn (các mục liên hệ/đề mục/footer được dịch).
- Thông báo lỗi và trạng thái thông dụng, bao gồm kích thước ảnh và kiểm tra dữ liệu đầu vào.

## Riêng tư và tính đúng đắn
- Bản dịch lưu trong file `secure/i18n.js` đóng gói cùng image; **không sử dụng Google Translate, CDN hay API dịch**.
- **Không có cơ chế ghi ngôn ngữ vào cookie/localStorage**; làm mới trang trở về tiếng Việt. Nội dung đã nhập không bị sửa hoặc dịch khi đổi ngôn ngữ.
- Chỉ dịch nhãn và thông báo. **Không dịch mật khẩu, SSID, địa chỉ URL, văn bản người dùng nhập, mã thanh toán hay dữ liệu QR**.
- Tiêu đề/mật khẩu in trên SVG/PNG là văn bản riêng; các nhãn do ứng dụng sinh ra được dịch, văn bản tự nhập được giữ nguyên.
- Trình duyệt phải có font hỗ trợ các ký tự trong văn bản để hiển thị và xuất file chính xác.
- Không có gửi dữ liệu từ trình duyệt ra ngoài; container chỉ phục vụ frontend tĩnh theo chính sách CSP có sẵn.

## Triển khai Portainer
Nhánh `security/offline-lan-no-exec-20261110`; `docker-compose.portainer.yml`. Chưa merge main, chưa triển khai lên Docker Proxmox. Image GHCR `:main` **không** chứa các thay đổi trên nhánh bảo mật.

CI kiểm thử `node --test tests/*.test.mjs`, cú pháp JavaScript, Docker build và Compose smoke test cổng dự kiến `18890`. Cần xác nhận IP Docker VM/LXC thực tế và giới hạn truy cập LAN/VPN.
