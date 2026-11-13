# QRFrame Secure LAN — Logo + SCAN ME + thông tin trên hình QR

## Thiết kế mã QR vừa thêm

Trang `qrframe` trong nhánh `security/offline-lan-no-exec-20261110` có mục **🖼️ Logo & chữ trên mã QR** nằm dưới phần màu sắc:

1. **Đính kèm logo** từ máy tính: PNG, JPEG, WebP tối đa 2 MB, chiều rộng/cao tối đa 4096 px.
2. **Xóa logo** không cần làm mới trang.
3. **Kích thước logo**: Nhỏ (16%), Vừa (20%, mặc định), Lớn (24% bề rộng khối QR), có trần kích thước tối đa 22 ô ma trận; đặt giữa, có nền trống xung quanh. Logo lớn có thể gây lỗi quét, phải quét thử; ảnh raster, không nhận SVG/GIF.
4. **Tiêu đề phía trên mã QR**: ví dụ `CÔNG TY ABC`, tối đa 40 ký tự.
5. **Chữ ngay dưới mã**: `SCAN ME`, `QUÉT MÃ`, tùy chỉnh hoặc không hiển thị.
6. **Thông tin phụ**: dòng thứ hai dưới QR (ví dụ `Hotline 090…`), tối đa 54 ký tự.
7. **Xem trước và xuất PNG/SVG** có logo/tiêu đề/nhãn/thông tin, không chỉ tạo ảnh QR trần.

Các **biểu mẫu nội dung quét** (điện thoại, Wi-Fi, danh bạ, SMS, vCard, landing-page…) vẫn nằm trong menu **Loại QR cần tạo** ở trên.

Phân biệt rõ: `Tiêu đề`, `SCAN ME` và `Thông tin phụ` chỉ **được in trên hình** PNG/SVG; không được nhúng vào payload khi điện thoại quét. Payload vẫn do biểu mẫu `Loại QR cần tạo` quyết định.

## Bảo mật logo

- Logo được đọc **trực tiếp trong trình duyệt**, không tải lên server hoặc dịch vụ bên thứ ba.
- Browser kiểm tra magic bytes của PNG/JPEG/WebP, giới hạn tệp 2 MB, giới hạn kích thước ảnh 4096×4096.
- Mọi logo được decode và vẽ lại thành PNG 192×192; SVG/HTML/script và metadata EXIF gốc không được chuyển vào mã QR.
- PNG được nhúng trực tiếp dưới dạng `data:image/png;base64` trong SVG khi xuất; không tải ảnh từ URL ngoài.
- Không lưu logo trong localStorage/cookie hay trên server; có nút xóa nội dung/logo trong trang.
- Logo làm mất một số ô dữ liệu QR: khi gắn logo, ứng dụng tự chuyển mức sửa lỗi sang **H**, tắt tùy chọn sửa lỗi cho tới khi xóa logo.
- **Không thể cam kết QR có logo nào cũng quét được**. Luôn kiểm thử với điện thoại thực tế, đặc biệt với QR dữ liệu dài, mã nhỏ, màu tương phản thấp và in trên chất liệu phản chiếu.

## Docker / Proxmox

- Không thay đổi host IP/port đã dành cho app: `192.168.20.194:18890 -> 18090` (IP chỉ là cấu hình dự kiến, chưa kiểm tra thực tế).
- Không đụng QRForge port `18889`.
- Mọi thay đổi trên **nhánh bảo mật**, không tự merge `main` và không tự deploy lên Proxmox.
- Mã QR vẫn được tạo trong browser, Docker phục vụ static HTML/JS/CSS, không backend/database/telemetry.
- Firewall hạn chế LAN/VPN, HTTPS nội bộ cho dữ liệu nhạy cảm vẫn bắt buộc ở hạ tầng; Docker bridge không tự chặn lưu lượng egress.

## Kiểm thử

`node --test tests/*.test.mjs` chứa test cho bộ tạo QR và kiểm tra chữ, bố cục, tỉ lệ logo, PNG/JPEG/WebP signature, SVG giả mạo, file quá lớn. GitHub Actions build image và kiểm tra cổng Portainer/CSP. Việc quét thực tế phải kiểm tra sau triển khai.
