// QRFrame Secure LAN: all payloads are built locally; no remote API, telemetry or runtime code editor.
import { ByteEncoder, generateWithEncoder } from "furious-qr";
import { buildPayload } from "./payload.js";
import { registerExtraForms } from "./extra-ui.js";
import { buildLandingHtml } from "./landing.js";
import { brandLayout, logoGeometry, rasterizeLogo, effectiveCaption, readableTextSize, singleLine, wifiCredentialCard } from "./branding.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const QUIET_ZONE = 4;
const PNG_SIZE = 1024;
const el = (id) => document.getElementById(id);
const kindEl = el("kind");
const shapeEl = el("shape");
const eclEl = el("ecl");
const foregroundEl = el("fg");
const backgroundEl = el("bg");
const preview = el("qr");
const empty = el("empty");
const statusEl = el("status");
const svgButton = el("svg");
const pngButton = el("png");
let current = null;
let inputTimer = null;
let logoState = null;
let logoRequest = 0;
registerExtraForms();
const wifiOptInEl = el("wifi-show-credentials");
const logoFileEl = el("logo-file");
const logoSizeEl = el("logo-size");
function brandOptions() {
  return {
    title: singleLine(el("qr-title").value, 40),
    caption: effectiveCaption(el("caption-mode").value, el("caption-custom").value),
    note: singleLine(el("qr-note").value, 54)
  };
}
function appendBrandLabel(fragment, value, y, fontSize, bold, color, width) {
  if (!value) return;
  const t = createSvgNode("text", {
    x: width / 2,
    y,
    fill: color,
    "text-anchor": "middle",
    "font-family": "Arial, sans-serif",
    "font-size": readableTextSize(value, width, fontSize),
    "font-weight": bold ? "700" : "400"
  });
  t.textContent = value;
  fragment.appendChild(t);
}
function showCaptionCustom() {
  el("caption-custom-wrap").hidden = el("caption-mode").value !== "custom";
}
function showLogoStatus(message) {
  el("logo-status").textContent = message;
  el("logo-remove").disabled = !logoState;
  el("ecl").disabled = Boolean(logoState);
}
async function handleLogoFile() {
  const file = logoFileEl.files && logoFileEl.files[0];
  logoFileEl.value = "";
  const request = ++logoRequest;
  logoState = null;
  if (!file) { showLogoStatus("Không có logo."); queueRender(); return; }
  showLogoStatus("Đang đọc và chuyển logo thành PNG cục bộ...");
  try {
    const sanitized = await rasterizeLogo(file);
    if (request !== logoRequest) return;
    logoState = sanitized;
    el("ecl").value = "3";
    showLogoStatus("Logo đã được chuyển sang PNG, loại bỏ metadata gốc. Không upload lên server.");
  } catch (error) {
    if (request !== logoRequest) return;
    logoState = null;
    showLogoStatus(error instanceof Error ? error.message : "Không thể xử lý logo.");
  }
  queueRender();
}
function removeLogo() {
  ++logoRequest;
  logoState = null;
  logoFileEl.value = "";
  showLogoStatus("Đã xóa logo khỏi bộ nhớ trang.");
  queueRender();
}

function setStatus(message, error = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", error);
}

function createSvgNode(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) {
    node.setAttribute(name, String(value));
  }
  return node;
}

function forEachDarkModule(qr, callback) {
  const side = qr.version * 4 + 17;
  for (let i = 0; i < qr.matrix.length; i++) {
    const flags = qr.matrix[i];
    if (!(flags & 1)) continue;
    callback(i % side, Math.floor(i / side), Boolean(flags & 4));
  }
}

function resetPreview(message, error = false) {
  current = null;
  preview.replaceChildren();
  preview.style.display = "none";
  empty.style.display = "block";
  svgButton.disabled = true;
  pngButton.disabled = true;
  const manual = el("wifi-credential-preview");
  manual.hidden = true;
  el("wifi-ssid-preview").textContent = "";
  el("wifi-password-preview").textContent = "";
  setStatus(message, error);
}

function getData() {
  const form = document.querySelector('.type-form[data-type="' + kindEl.value + '"]');
  if (!form) return {};
  const data = {};
  for (const input of form.querySelectorAll("[data-field]")) {
    data[input.dataset.field] = input.value;
  }
  return data;
}

function updateWifiPassword() {
  const type = document.querySelector('[data-type="wifi"] [data-field="wifiSecurity"]');
  const label = document.querySelector('[data-wifi-password]');
  const password = document.querySelector('[data-field="wifiPassword"]');
  const open = type.value === "nopass";
  label.hidden = open;
  if (open) password.value = "";
}

function switchType() {
  for (const form of document.querySelectorAll(".type-form")) {
    form.hidden = form.dataset.type !== kindEl.value;
  }
  updateWifiPassword();
  updateLandingTools();
  resetPreview(kindEl.value === "landing"
    ? "Tải HTML, đưa lên máy chủ nội bộ và nhập URL để tạo mã QR." : "Điền thông tin để tạo mã QR.");
  const form = document.querySelector('.type-form[data-type="' + kindEl.value + '"]');
  const hasInput = [...form.querySelectorAll("input,textarea")].some((item) => item.type !== "checkbox" && item.value.trim());
  if (hasInput) render();
}

function render() {
  const kind = kindEl.value;
  const data = getData();
  if (kind === "landing" && !String(data.landingUrl ?? "").trim()) {
    resetPreview("Tải Landing Page HTML → đăng lên web server/NAS → nhập URL thực tế để tạo QR.");
    return;
  }
  const foreground = foregroundEl.value;
  const background = backgroundEl.value;
  if (foreground.toLowerCase() === background.toLowerCase()) {
    resetPreview("Màu nền và màu mã phải khác nhau.", true);
    return;
  }
  let text;
  try {
    text = buildPayload(kind, data);
  } catch (err) {
    resetPreview(err instanceof Error ? err.message : "Dữ liệu không hợp lệ.", true);
    return;
  }

  const shape = shapeEl.value;
  if (logoState) eclEl.value = "3";
  const ecl = Number(eclEl.value);
  try {
    const qr = generateWithEncoder(new ByteEncoder(text), {
      minVersion: 1,
      maxVersion: 40,
      minEcl: ecl,
      maxEcl: ecl,
      mask: 2,
    });
    const side = qr.version * 4 + 17;
    const fullSide = side + QUIET_ZONE * 2;
    const layout = brandLayout(fullSide, brandOptions());
    const wifiCard = kind === "wifi" && wifiOptInEl.checked
      ? wifiCredentialCard(layout.totalHeight, fullSide, String(data.ssid ?? "").trim(),
        String(data.wifiPassword ?? ""), data.wifiSecurity === "nopass")
      : null;
    const fullHeight = wifiCard ? wifiCard.totalHeight : layout.totalHeight;
    const fragment = document.createDocumentFragment();
    fragment.appendChild(createSvgNode("rect", {
      x: 0, y: 0, width: fullSide, height: fullHeight, fill: background,
    }));
    forEachDarkModule(qr, (x, y, finder) => {
      const px = x + QUIET_ZONE;
      const py = y + QUIET_ZONE + layout.top;
      if (shape === "dots" && !finder) {
        fragment.appendChild(createSvgNode("circle", {
          cx: px + 0.5, cy: py + 0.5, r: 0.43, fill: foreground,
        }));
      } else {
        const attrs = { x: px, y: py, width: 1, height: 1, fill: foreground };
        if (shape === "rounded" && !finder) attrs.rx = 0.2;
        fragment.appendChild(createSvgNode("rect", attrs));
      }
    });
    if (logoState) {
      const g = logoGeometry(side, fullSide, layout.top, logoSizeEl.value);
      fragment.appendChild(createSvgNode("rect", {
        x: g.bgX, y: g.bgY, width: g.bgSize, height: g.bgSize,
        rx: g.pad * 0.55, fill: background
      }));
      // Only sanitized, locally re-encoded PNG data URLs are ever placed here.
      fragment.appendChild(createSvgNode("image", {
        x: g.x, y: g.y, width: g.size, height: g.size,
        href: logoState.dataUrl, preserveAspectRatio: "xMidYMid meet"
      }));
    }
    appendBrandLabel(fragment, layout.title, layout.titleY, 2.35, true, foreground, fullSide);
    appendBrandLabel(fragment, layout.caption, layout.captionY, 2.3, true, foreground, fullSide);
    appendBrandLabel(fragment, layout.note, layout.noteY, 1.35, false, foreground, fullSide);
    if (wifiCard) {
      fragment.appendChild(createSvgNode("line", {
        x1: 2.4, y1: wifiCard.separatorY, x2: fullSide - 2.4,
        y2: wifiCard.separatorY, stroke: foreground, "stroke-width": 0.055
      }));
      function wifiLine(value, y, fontSize = 1.8, bold = false, monospace = false) {
        const textNode = createSvgNode("text", {
          x: fullSide / 2, y, fill: foreground,
          "text-anchor": "middle",
          "font-family": monospace ? "monospace" : "Arial, sans-serif",
          "font-weight": bold ? "700" : "400",
          "font-size": Math.min(fontSize,
            (fullSide - 4) / Math.max(1, Array.from(value).length * (monospace ? 0.64 : 0.59)))
        });
        textNode.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
        textNode.textContent = value;
        fragment.appendChild(textNode);
      }
      wifiLine(wifiCard.heading, wifiCard.headingY, 1.25, true);
      wifiLine("TÊN WI-FI (SSID)", wifiCard.ssidLabelY, 1.25, true);
      wifiCard.ssidLines.forEach((line, index) =>
        wifiLine(line, wifiCard.ssidYs[index], 1.85, true, true));
      wifiLine(wifiCard.passwordLabel, wifiCard.passwordLabelY, 1.2, true);
      wifiCard.passwordLines.forEach((line, index) =>
        wifiLine(line, wifiCard.passwordYs[index], 1.85, true, true));
    }
    preview.replaceChildren(fragment);
    preview.setAttribute("viewBox", "0 0 " + fullSide + " " + fullHeight);
    preview.setAttribute("height", String(Math.round(320 * fullHeight / fullSide)));
    preview.style.display = "block";
    empty.style.display = "none";
    current = { qr, shape, foreground, background, fullSide, layout,
      wifiCard, logo: logoState, logoSize: logoSizeEl.value };
    const manual = el("wifi-credential-preview");
    manual.hidden = !wifiCard;
    el("wifi-ssid-preview").textContent = wifiCard ? String(data.ssid ?? "").trim() : "";
    el("wifi-password-preview").textContent = wifiCard
      ? (data.wifiSecurity === "nopass" ? "Mạng mở — không có mật khẩu" : String(data.wifiPassword ?? ""))
      : "";
    svgButton.disabled = false;
    pngButton.disabled = false;
    setStatus(wifiCard
      ? "⚠️ Mật khẩu Wi-Fi đang hiện rõ trên ảnh PNG/SVG. Chỉ chia sẻ cho người tin cậy."
      : logoState
      ? "Logo đã gắn vào QR (sửa lỗi H). Hãy quét thử trên điện thoại trước khi in."
      : kind === "wifi"
        ? "⚠️ QR Wi-Fi chứa mật khẩu có thể được đọc khi quét. Chỉ chia sẻ cho người tin cậy."
        : "QR được tạo ngay trên trình duyệt. Không gửi nội dung lên server.");
  } catch {
    resetPreview("Nội dung quá dài hoặc không thể tạo QR. Hãy rút gọn hoặc giảm mức sửa lỗi.", true);
  }
}

function download(blob, filename) {
  if (!blob) return;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

function downloadSVG() {
  if (!current) return;
  // No user text is inserted as HTML/SVG markup.
  const serialized = new XMLSerializer().serializeToString(preview);
  download(new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }), "qrframe-" + kindEl.value + ".svg");
}

function downloadPNG() {
  if (!current) return;
  const { qr, shape, foreground, background, fullSide, layout, wifiCard, logo, logoSize } = current;
  const canvas = document.createElement("canvas");
  const unit = PNG_SIZE / fullSide;
  canvas.width = PNG_SIZE;
  canvas.height = Math.round((wifiCard ? wifiCard.totalHeight : layout.totalHeight) * unit);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return setStatus("Trình duyệt không hỗ trợ Canvas.", true);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = foreground;
  forEachDarkModule(qr, (x, y, finder) => {
    const px = (x + QUIET_ZONE) * unit;
    const py = (y + QUIET_ZONE + layout.top) * unit;
    if (shape === "dots" && !finder) {
      ctx.beginPath();
      ctx.arc(px + unit * 0.5, py + unit * 0.5, unit * 0.43, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === "rounded" && !finder && typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(px, py, unit, unit, unit * 0.2);
      ctx.fill();
    } else {
      ctx.fillRect(px, py, unit, unit);
    }
  });
  if (logo) {
    const g = logoGeometry(qr.version * 4 + 17, fullSide, layout.top, logoSize);
    ctx.fillStyle = background;
    ctx.fillRect(g.bgX * unit, g.bgY * unit, g.bgSize * unit, g.bgSize * unit);
    ctx.drawImage(logo.canvas, g.x * unit, g.y * unit, g.size * unit, g.size * unit);
  }
  function drawCaption(value, y, size, bold) {
    if (!value) return;
    const px = readableTextSize(value, fullSide, size) * unit;
    ctx.fillStyle = foreground;
    ctx.font = (bold ? "bold " : "") + px + "px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(value, fullSide / 2 * unit, y * unit, (fullSide - 6) * unit);
  }
  drawCaption(layout.title, layout.titleY, 2.35, true);
  drawCaption(layout.caption, layout.captionY, 2.3, true);
  drawCaption(layout.note, layout.noteY, 1.35, false);
  if (wifiCard) {
    ctx.fillStyle = foreground;
    ctx.fillRect(2.4 * unit, wifiCard.separatorY * unit,
      (fullSide - 4.8) * unit, Math.max(1, 0.055 * unit));
    function drawWifiLine(value, y, fontSize = 1.85, bold = false, mono = false) {
      ctx.fillStyle = foreground;
      const size = Math.min(fontSize,
        (fullSide - 4) / Math.max(1, Array.from(value).length * (mono ? 0.64 : 0.59)));
      ctx.font = (bold ? "700 " : "") + size * unit + "px " +
        (mono ? "monospace" : "Arial, sans-serif");
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(value, fullSide * unit / 2, y * unit, (fullSide - 4) * unit);
    }
    drawWifiLine(wifiCard.heading, wifiCard.headingY, 1.25, true);
    drawWifiLine("TÊN WI-FI (SSID)", wifiCard.ssidLabelY, 1.25, true);
    wifiCard.ssidLines.forEach((line, index) =>
      drawWifiLine(line, wifiCard.ssidYs[index], 1.85, true, true));
    drawWifiLine(wifiCard.passwordLabel, wifiCard.passwordLabelY, 1.2, true);
    wifiCard.passwordLines.forEach((line, index) =>
      drawWifiLine(line, wifiCard.passwordYs[index], 1.85, true, true));
  }
  canvas.toBlob((blob) => download(blob, "qrframe-" + kindEl.value + ".png"), "image/png");
}

function updateLandingTools() {
  const active = kindEl.value === "landing";
  const dl = el("landing-download");
  const preview = el("landing-preview");
  if (!active) { dl.disabled = true; preview.disabled = true; return; }
  try {
    buildLandingHtml(getData());
    dl.disabled = false;
    preview.disabled = false;
    el("landing-notice").textContent =
      "Có thể xuất HTML ngay. QR chỉ hoạt động sau khi đăng file lên web server và nhập URL bên trên.";
  } catch (err) {
    dl.disabled = true;
    preview.disabled = true;
    el("landing-notice").textContent = err instanceof Error ? err.message : "Chưa đủ thông tin Landing Page.";
  }
}
function landingBlob() {
  return new Blob([buildLandingHtml(getData())], { type: "text/html;charset=utf-8" });
}
function downloadLanding() {
  try { download(landingBlob(), "landing-page-noi-bo.html"); }
  catch (err) { setStatus(err instanceof Error ? err.message : "Lỗi tạo HTML.", true); }
}
function previewLanding() {
  try {
    const objectUrl = URL.createObjectURL(landingBlob());
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (err) { setStatus(err instanceof Error ? err.message : "Lỗi xem trước.", true); }
}
function queueRender() {
  updateLandingTools();
  if (inputTimer !== null) clearTimeout(inputTimer);
  if (kindEl.value === "wifi") {
    inputTimer = null;
    render();
  } else {
    inputTimer = setTimeout(render, 180);
  }
}

for (const input of document.querySelectorAll(".type-form input, .type-form textarea, .type-form select")) {
  input.addEventListener("input", queueRender);
  input.addEventListener("change", () => {
    if (input.dataset.field === "wifiSecurity") updateWifiPassword();
    queueRender();
  });
}
kindEl.addEventListener("change", switchType);
wifiOptInEl.addEventListener("change", () => {
  // Immediate render avoids stale exported password after disabling the display.
  queueRender();
});
for (const input of [shapeEl, eclEl, foregroundEl, backgroundEl, logoSizeEl, el("qr-title"), el("caption-mode"), el("caption-custom"), el("qr-note")]) {
  input.addEventListener("change", () => { showCaptionCustom(); queueRender(); });
  input.addEventListener("input", queueRender);
}
logoFileEl.addEventListener("change", handleLogoFile);
el("logo-remove").addEventListener("click", removeLogo);
el("landing-download").addEventListener("click", downloadLanding);
el("landing-preview").addEventListener("click", previewLanding);
el("clear").addEventListener("click", () => {
  if (inputTimer !== null) clearTimeout(inputTimer);
  inputTimer = null;
  for (const input of document.querySelectorAll(".type-form input, .type-form textarea")) {
    input.value = "";
  }
  const landingColor = document.querySelector('[data-field="landingAccent"]');
  if (landingColor) landingColor.value = "#167b62";
  for (const input of document.querySelectorAll(".type-form select")) {
    input.selectedIndex = 0;
  }
  el("qr-title").value = "";
  el("qr-note").value = "";
  el("caption-custom").value = "";
  el("caption-mode").value = "scan";
  wifiOptInEl.checked = false;
  removeLogo();
  showCaptionCustom();
  kindEl.value = "url";
  switchType();
});
svgButton.addEventListener("click", downloadSVG);
pngButton.addEventListener("click", downloadPNG);
switchType();
showCaptionCustom();
