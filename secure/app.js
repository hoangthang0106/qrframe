// QRFrame Secure LAN: all payloads are built locally; no remote API, telemetry or runtime code editor.
import { ByteEncoder, generateWithEncoder } from "furious-qr";
import { buildPayload } from "./payload.js";

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
  resetPreview("Điền thông tin để tạo mã QR.");
  const form = document.querySelector('.type-form[data-type="' + kindEl.value + '"]');
  const hasInput = [...form.querySelectorAll("input,textarea")].some((item) => item.value.trim());
  if (hasInput) render();
}

function render() {
  const kind = kindEl.value;
  const data = getData();
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
    const fragment = document.createDocumentFragment();
    fragment.appendChild(createSvgNode("rect", {
      x: 0, y: 0, width: fullSide, height: fullSide, fill: background,
    }));
    forEachDarkModule(qr, (x, y, finder) => {
      const px = x + QUIET_ZONE;
      const py = y + QUIET_ZONE;
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
    preview.replaceChildren(fragment);
    preview.setAttribute("viewBox", "0 0 " + fullSide + " " + fullSide);
    preview.style.display = "block";
    empty.style.display = "none";
    current = { qr, shape, foreground, background, fullSide };
    svgButton.disabled = false;
    pngButton.disabled = false;
    setStatus(kind === "wifi"
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
  const { qr, shape, foreground, background, fullSide } = current;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = PNG_SIZE;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return setStatus("Trình duyệt không hỗ trợ Canvas.", true);
  const unit = PNG_SIZE / fullSide;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
  ctx.fillStyle = foreground;
  forEachDarkModule(qr, (x, y, finder) => {
    const px = (x + QUIET_ZONE) * unit;
    const py = (y + QUIET_ZONE) * unit;
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
  canvas.toBlob((blob) => download(blob, "qrframe-" + kindEl.value + ".png"), "image/png");
}

function queueRender() {
  if (inputTimer !== null) clearTimeout(inputTimer);
  inputTimer = setTimeout(render, 180);
}

for (const input of document.querySelectorAll(".type-form input, .type-form textarea, .type-form select")) {
  input.addEventListener("input", queueRender);
  input.addEventListener("change", () => {
    if (input.dataset.field === "wifiSecurity") updateWifiPassword();
    queueRender();
  });
}
kindEl.addEventListener("change", switchType);
for (const input of [shapeEl, eclEl, foregroundEl, backgroundEl]) {
  input.addEventListener("change", queueRender);
  input.addEventListener("input", queueRender);
}
el("clear").addEventListener("click", () => {
  if (inputTimer !== null) clearTimeout(inputTimer);
  inputTimer = null;
  for (const input of document.querySelectorAll(".type-form input, .type-form textarea")) {
    input.value = "";
  }
  for (const input of document.querySelectorAll(".type-form select")) {
    input.selectedIndex = 0;
  }
  kindEl.value = "url";
  switchType();
});
svgButton.addEventListener("click", downloadSVG);
pngButton.addEventListener("click", downloadPNG);
switchType();
