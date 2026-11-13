# QRFrame — Tự nhập chữ hiển thị dưới QR Wi-Fi

## Sử dụng
1. Chọn **Wi-Fi**. Nhập SSID/mật khẩu thực tế vào form chính để tạo mã QR quét kết nối như bình thường.
2. Bật **Tự nhập thông tin hiển thị dưới mã QR** (mặc định **TẮT**).
3. Điền hai ô **Tên Wi-Fi muốn in dưới QR (tự nhập)** và/hoặc **Mật khẩu hoặc thông tin muốn in (tự nhập)**. Hai ô này **độc lập**, không tự sao chép mật khẩu của QR. Có thể điền một ô hoặc cả hai.
4. Khi đã nhập ít nhất một ô, thông tin được hiển thị dưới mã QR trong phần xem trước và được giữ nguyên khi **Tải PNG/SVG**.
5. Đã bỏ toàn bộ dòng **“💻 Dành cho laptop — nhập Wi-Fi thủ công”** khỏi giao diện và hình xuất. Phần bên dưới chỉ gồm nhãn SSID / thông tin và nội dung tự điền.
6. Tắt tùy chọn hoặc chọn **Xóa dữ liệu nhập** sẽ xóa các ô thông tin muốn in để tránh vô tình lộ dữ liệu.

**Lưu ý:** Hai ô in độc lập với thông tin được mã hóa trong QR; nếu tự điền sai, người dùng laptop sẽ không đăng nhập được. Hãy đối chiếu tên/mật khẩu in với thông tin Wi-Fi thực tế trước khi xuất.

**Bảo mật:** Không đưa mật khẩu mạng quản trị, camera, thiết bị nội bộ vào hình QR chia sẻ công khai. Nếu tự điền mật khẩu, nó sẽ hiện rõ trong ảnh PNG/SVG và người có ảnh có thể đọc được. Mọi xử lý tại trình duyệt, không upload logo/mật khẩu lên server theo mã nguồn. Cần HTTPS/VPN/firewall cho triển khai LAN.

## Logo lớn hơn
Có ba mức logo: Nhỏ (16%), Vừa (20%, mặc định), Lớn (24%), đồng thời giới hạn đường kính logo tối đa 22 ô ma trận. Cỡ lớn có thể làm QR khó quét dù có sửa lỗi H. **Phải quét thử bằng điện thoại trước khi in.**

## Triển khai
Chỉnh sửa trên nhánh `security/offline-lan-no-exec-20261110` của `hoangthang0106/qrframe`. Chưa tự merge main hay thao tác Docker/Portainer trên Proxmox. Port dự kiến 18890, QRForge 18889 giữ nguyên.
