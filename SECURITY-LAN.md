# QRFrame Secure LAN — mô hình bảo mật riêng tư

## Đã làm trong mã nguồn
- Dockerfile **chỉ copy \`secure/\`** để build UI tĩnh. Mã nguồn/worker/preset cũ không được đưa vào image.
- Không còn trình chạy JavaScript tùy ý. Preview QR dựng bằng DOM SVG an toàn, không \`innerHTML\`.
- Không dùng database, cookies, localStorage, tài khoản, API, CDN, remote font/hình hoặc analytics.
- Frontend dùng thư viện \`furious-qr\` đóng gói tại thời điểm build, tạo QR trong bộ nhớ trình duyệt.
- Nginx không root, read-only container, giới hạn RAM/CPU/quyền, CSP \`connect-src 'none'\`, \`script-src 'self'\`, \`worker-src 'none'\`, tắt access logs.
- Chỉ cung cấp QR vuông / bo góc / chấm tròn, sửa lỗi cao và xuất PNG/SVG; bỏ các preset nghệ thuật cho phép chạy code.
- Không yêu cầu dịch vụ bên thứ ba **khi đang sử dụng**; quá trình build vẫn cần tải phụ thuộc và base image.

## Điều chưa được tự động bảo vệ

**Không có sản phẩm nào an toàn tuyệt đối.**

- CSP không bảo vệ khỏi MITM thay nội dung JavaScript/HTTP headers trên đường truyền HTTP. Để chống theo dõi/chèn mã trên LAN, phải dùng HTTPS nội bộ với chứng thư đáng tin, hoặc VPN cùng firewall kiểm soát.
- Port LAN \`192.168.20.194:18890\` chỉ là cấu hình mặc định từ lịch sử, CHƯA xác minh IP thuộc Docker host nào; không phải một URL đã triển khai.
- Docker bridge \`qrframe_app_net\` **không chặn Internet egress**. Đã thử \`internal:true\` trong CI, nhưng cấu hình đó chặn luôn cổng inbound được publish, nên không được sử dụng. **Phải chặn egress từ Docker bridge bằng firewall trên VM/Proxmox hoặc DOCKER-USER.** Không được hiểu CSP như firewall của container.
- Mạng LAN khác VLAN, máy khách, browser extension, hệ điều hành, registry, dependency và base image vẫn có rủi ro riêng.
- Không có xác minh runtime trên Docker VM/Proxmox thực tế; CI chỉ mô phỏng bằng GitHub-hosted runner.

## Các bước triển khai cho môi trường Proxmox (SAU KHI review và test)

1. Chạy Docker trong VM/LXC riêng được harden; không cài Docker trực tiếp trên Proxmox hypervisor.
2. Xác minh host IP thật, tên máy, hệ điều hành, VMID/CTID, và \`18890/TCP\` đang trống; không đụng QRForge port \`18889\`.
3. Hạn chế inbound \`18890/TCP\` chỉ cho địa chỉ IP máy quản trị qua Proxmox/VM firewall; không NAT/UPnP/Cloudflare Tunnel/Internet-public.
4. Chặn **new outbound connections** từ subnet riêng của network \`qrframe_app_net\` bằng rule trong \`DOCKER-USER\` (hoặc chính sách tương đương đã kiểm thử); phải giữ lưu lượng phản hồi đã ESTABLISHED/RELATED để ứng dụng vẫn truy cập được từ LAN. Đừng dùng CIDR đoán: lấy từ \`docker network inspect\` trên host, và kiểm thử trước khi lưu vĩnh viễn.
5. Khuyến nghị chỉ truy cập từ VPN hoặc một reverse proxy HTTPS nội bộ có xác thực và chứng thư được tin cậy. HTTP trực tiếp trên LAN chưa đạt mức chống MITM.
6. Sau khi merge phiên bản đã kiểm thử, Portainer → Stacks → Git repository: \`https://github.com/hoangthang0106/qrframe\`, branch \`refs/heads/main\`, Compose path \`docker-compose.portainer.yml\`. Endpoint Docker local có khả năng build từ repository. Không dùng \`docker-compose.image.yml\` trước khi ghcr.io image secure mới thật sự được build.
7. Chạy \`docker ps\` để kiểm tra container và published port, rồi \`curl -I http://IP_DOCKER:18890/\` để xác minh CSP có \`connect-src 'none'\` (đây chỉ là phép kiểm tra chức năng trước khi cấu hình HTTPS).
8. Dùng Browser DevTools → Network kiểm tra không có request tới tên miền bên ngoài. Kiểm tra khả năng tạo QR, quét bằng điện thoại và tải PNG/SVG.
9. Không tự động GitOps redeploy từ upstream hoặc nhánh \`main\` cho đến khi chính sách review đã sẵn sàng; giữ image cũ để rollback.
10. Pin image production theo SHA256 digest đã xác minh; rà soát CVE, Docker base image, Node/npm lockfile và firewall định kỳ.

### Giới hạn an toàn

Đây là **redesign ưu tiên bảo mật**. Không có remote code editor, không có QR động/tracking, không có các preset nghệ thuật cần chạy code. Các tập tin cũ còn lưu trong Git để đối chiếu nhưng không được build hoặc phục vụ trong runtime image.
