# QRFrame Secure LAN — Kiểu QR và kích thước xuất file

## Tùy chỉnh hình QR

Bản `secure/` của repository `hoangthang0106/qrframe` đã thêm:

- **9 kiểu họa tiết / module**: Vuông tiêu chuẩn, vuông bo góc, chấm tròn, chấm tròn nhỏ, vuông mềm/cách ô, kim cương, lục giác, thanh ngang, thanh dọc.
- **3 kiểu ô định vị** ở 3 góc: Vuông chuẩn, bo góc, tâm tròn.
- **Chiều rộng xuất QR**: 256, 512, 1024 (mặc định), 2048, 3072 px; ngoài ra chọn **Tự nhập kích thước** từ 256–4096 px, số nguyên.
- **Chiều cao ảnh tự thay đổi** để chứa logo, tiêu đề, `SCAN ME`, thông tin Wi-Fi tự nhập nếu có. Trên màn hình vẫn xem trước trong khung 320 px để dễ thao tác.
- **PNG và SVG** xuất ra cùng thiết lập kích thước và kiểu QR. SVG có kích thước và tỷ lệ do người dùng chọn; vì là vector nên có thể thu phóng sau khi xuất.
- Hiển thị trước kích thước xuất `rộng × cao px`. Chặn ảnh cao hơn 8192 px hoặc tổng diện tích trên 32 megapixel để hạn chế ngốn RAM trình duyệt.
- **Mã được tạo trong trình duyệt**. Không tải hình/kiểu QR từ CDN hoặc dịch vụ bên ngoài.

## Độ tin cậy khi quét

- Mặc định kiểu vuông + mắt vuông, nhằm ưu tiên khả năng quét.
- Với kiểu chấm/kim cương/lục giác/thanh ngang/dọc, các ô chức năng của QR được giữ dạng vuông và 3 mắt có thể dùng kiểu riêng để tránh biến dạng mô hình tìm kiếm.
- Logo lớn (16%, 20%, 24%) có thể ảnh hưởng quét, đặc biệt với payload Wi-Fi/VietQR/vCard dài. Khi có logo, ứng dụng chuyển mức sửa lỗi H.
- Luôn giữ vùng đệm 4 module quanh ma trận QR.
- **Không thể bảo đảm** mọi kiểu cách điệu đều quét được ở mọi điều kiện. Hãy thử bằng điện thoại và ứng dụng quét thực tế trước khi in; với QR quan trọng nên dùng vuông tiêu chuẩn và mắt vuông.

## Các dữ liệu giữ nguyên

35 loại nội dung QR, Landing Page HTML độc lập, VietQR offline, upload logo cục bộ, SCAN ME, và tùy chọn thông tin Wi-Fi **tự điền chữ in** dưới QR (độc lập với dữ liệu kết nối) vẫn có.

## Triển khai

Nhánh `security/offline-lan-no-exec-20261110`, Compose `docker-compose.portainer.yml`; cổng cấu hình `192.168.20.194:18890` trên Docker host dự kiến, container cổng `18090`. Chưa merge `main` hoặc triển khai lên Proxmox. Cần build lại image từ nhánh đã sửa trong Portainer để thấy tính năng mới. Không dùng `ghcr.io/...:main` cũ.

**Kiểm thử:** `node --test tests/*.test.mjs` bao gồm logic hình vẽ, giới hạn kích thước, đồng bộ SVG/PNG, và smoke test Docker Compose trong GitHub Actions. Kiểm tra quét thực tế sau khi triển khai.
