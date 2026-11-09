# qrframe – cài trên Portainer / Docker LAN

Fork: https://github.com/hoangthang0106/qrframe

## Các file đã thêm

- `Dockerfile`: Node 22 + pnpm 10.16.1 để build qrframe thành website tĩnh, rồi chuyển sang Nginx chạy không root.
- `docker/nginx.conf`: phục vụ website, module workers, thêm các header bảo vệ cơ bản.
- `docker-compose.portainer.yml`: build từ chính fork. Dùng khi Portainer hỗ trợ xây dựng image từ Git.
- `docker-compose.image.yml`: pull image đã build từ GHCR (phương án dự phòng).
- `.github/workflows/docker-publish.yml`: GitHub Actions build/push GHCR trên nhánh main (có thể cần bật Actions hoặc đổi quyền truy cập package sang public).
- `.dockerignore`: bỏ thư mục không cần trong build.

## Cổng đã được điều chỉnh

- **Cổng máy chủ Docker (LAN): 18890**
- **Cổng Nginx bên trong container: 18090** (không dùng 8080).
- Mapping: `18890:18090` tại IP `192.168.20.194` mặc định.
- Cổng 18890 chưa được kiểm chứng đang trống; thay biến `QRFRAME_LAN_PORT` nếu trùng.
- Sau khi chỉnh code trên GitHub phải rebuild image; image cũ vẫn còn dùng 8080.

## Phương án A — Portainer build trực tiếp từ fork

1. Vào **Portainer → Stacks → Add stack → Repository**.
2. Name: `qrframe`.
3. Repository URL: `https://github.com/hoangthang0106/qrframe`
4. Repository reference: `refs/heads/main`
5. Compose path: `docker-compose.portainer.yml`
6. Authentication: off (repo công khai).
7. Đúng Docker standalone/local socket thì nhấn **Deploy the stack**.

Container: `qrframe-lan`, image build riêng `qrframe-hoangthang:lan`.
Mở `http://192.168.20.194:18890` từ LAN, nếu host đúng IP này.

**Quan trọng:** IP Docker `192.168.20.194` là giá trị mặc định từ cấu hình đã trao đổi,
chưa xác nhận vẫn đúng. Trước khi deploy, kiểm tra IP thật qua Portainer.
Nếu IP thay đổi, vào Environment variables của Stack, khai báo `QRFRAME_LAN_IP`
bằng IP LAN hiện tại. Cổng `18890` là đề xuất, cũng chưa xác minh đang trống.
Nếu cổng đã chiếm, thêm biến `QRFRAME_LAN_PORT` với cổng khác.

Không NAT/port-forward `18890` ra Internet. Binding IP chỉ giới hạn interface,
không thay firewall. Đây là ứng dụng **không có đăng nhập**.

## Phương án B — Portainer không build từ Git

Workflow GitHub Actions `Publish QRFrame container` sẽ build image từ nhánh main.
Vào GitHub → Actions để kiểm tra workflow **thành công**.
Nếu cần, bật GitHub Actions cho fork và đặt GHCR package visibility thành **public**
(hoặc kết nối registry có xác thực trong Portainer).

Khi image đã sẵn sàng, triển khai Stack Repository tương tự nhưng dùng
Compose path: `docker-compose.image.yml`.

**Không dùng phương án B nếu GitHub Actions chưa chạy thành công**; sẽ lỗi image pull.

## Sau khi cài: cập nhật giao diện và mẫu QR

- `src/routes/index.tsx`: trang chính.
- `src/components/`: các giao diện chỉnh sửa.
- `presets/`: mã JavaScript tạo kiểu QR.
- `src/lib/presets.ts`: danh sách preset.
- `vite.config.ts`: build website tĩnh.

Chỉnh → Commit GitHub → rebuild/redeploy trong Portainer.
Nếu dùng GHCR, đợi GitHub Actions build thành công rồi Pull/redeploy.

## Quyền riêng tư và an toàn

qrframe miễn phí, giấy phép MIT, không dùng database.
Nó có **code editor JavaScript và SVG từ preset không được sanitize**,
đây là rủi ro thiết kế của ứng dụng gốc. Chỉ dùng preset tự tạo/đáng tin;
không chạy mã copy từ bên ngoài hoặc SVG không tin cậy.

Docker không ngăn đoạn JavaScript chạy trong **trình duyệt** gửi dữ liệu ra mạng.
Web UI mặc định không có tài khoản; chỉ công bố trong LAN do mình quản lý.
Nginx có bổ sung các header bảo mật nhưng không thể đảm bảo 100% cách ly
nếu cho phép code editor thực thi mã do người dùng nhập.

Mẫu QR nghệ thuật có thể mất khả năng quét. Luôn thử quét trên nhiều thiết bị
và ở kích thước in thật.

## Gỡ bỏ

Portainer → Stacks → `qrframe` → Remove.
Ứng dụng không có volume database; có thể xóa image
`qrframe-hoangthang:lan` hoặc `ghcr.io/hoangthang0106/qrframe:main`
sau khi Stack đã dừng, nếu không còn container nào dùng nó.
