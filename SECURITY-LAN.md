# QRFrame — Secure LAN mode (bảo mật / riêng tư)

This fork now builds **only** \`secure/\` in the Docker image. Legacy source files and artistic user-code presets remain in Git history for reference but are **not copied** into the image or served by Nginx.

## Security / privacy guarantees within this code path

- Static UI only; no API, accounts, database, cookies, localStorage or telemetry.
- No arbitrary JS / preset code editor / runtime imports / unsanitized SVG innerHTML.
- QR data is encoded by bundled \`furious-qr\` in the user's browser memory.
- Only the audited \`secure/\` frontend files and Nginx config are copied into the production container.
- No remote fonts, remote images, CDN, JS analytics or dependency services at runtime.
- SVG preview uses \`createElementNS\` and attributes with typed inputs; user text never enters HTML/SVG markup.
- CSP denies outbound browser \`connect-src\`, workers, frames and external scripts; Nginx access logs are disabled.
- Non-root runtime, read-only rootfs, dropped capabilities, no-new-privileges, isolated Docker network, resource limits.

**Not a promise of absolute security.** Build dependencies are fetched during build. Node/npm/pnpm/GitHub Actions/registry infrastructure, end-user browsers, LAN devices, router and reverse proxy are outside this app's security boundary. Vulnerabilities in \`furious-qr\`, Nginx, Docker or the OS remain possible.

## Functional trade-off

This security mode supports three QR drawing styles (square, rounded, dots), two high error-correction options, colors, PNG and SVG export. **The legacy arbitrary-code editor and artistic preset catalogue are deliberately disabled.** This reduces attack surface. No dynamic/trackable QR codes.

## Proxmox / Portainer deployment

1. Install Docker inside a dedicated Proxmox **VM** (or separately secured LXC), not on the Proxmox hypervisor itself.
2. Verify the Docker VM/LXC actually owns LAN IP \`192.168.20.194\`; this is a configured default, not independently confirmed.
3. Restrict the LAN application port **18890/TCP** at the VM or Proxmox firewall to named administrator client IPs only. No NAT/port-forward, no cloud tunnel, no UPnP.
4. Validate the hardened branch with CI and review the changes **before merging**. It is not safe to redeploy an untested build.
5. In Portainer (Docker local endpoint, if Git Stack build is supported): repository \`https://github.com/hoangthang0106/qrframe\`; branch \`refs/heads/main\` *after the audited version is merged*; Compose path \`docker-compose.portainer.yml\`. Do not use \`docker-compose.image.yml\` until the secure GHCR image is published.
6. Host port \`18890\` is reserved for QRFrame; \`18889\` is QRForge. Port mapping is \`18890:18090\`. Check against running containers before deploying.
7. For sensitive internal content, put the app behind authenticated HTTPS reverse proxy with internal PKI, or use a trusted VPN and firewall ACL. HTTP by itself does not encrypt LAN traffic.
8. Test \`curl -I http://192.168.20.194:18890/\` and verify CSP has \`connect-src 'none'\`. Open Browser DevTools → Network and confirm no requests to external domains.
9. Check the Docker internal bridge \`qrframe_isolated\` is functional with your Docker version and publish rule. If not, keep the container stopped while fixing networking. Do not silently replace it with host networking.

## Updates

- Build image from reviewed commit SHA; for production, pin the published image to a reviewed immutable SHA256 digest rather than a mutable \`:main\` tag.
- Back up the previous Compose and image before any migration. Do not delete the old QRForge stack or data.
- Do not enable automatic upstream GitOps updates; review each dependency and Docker base image update.
- Periodically scan the final image and dependencies for vulnerabilities (e.g. Trivy, Docker Scout) on a networked **build** environment.
- Firewall egress from the Docker VM/Proxmox guest as an additional defense-in-depth layer. Container network isolation alone does not restrict the end-user's browser.

This is **a security-first redesign** intended for privately managed LANs; it trades off dynamic scripting and artistic presets for a smaller attack surface.
