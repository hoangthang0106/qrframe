// QRFrame Secure LAN: a deliberately minimal, offline-only QR generator.
// No arbitrary JavaScript execution, external imports, fetch, cookies, storage, or telemetry.
import { ByteEncoder, generateWithEncoder } from "furious-qr";

const SVG_NS = "http://www.w3.org/2000/svg";
const QUIET_ZONE = 4;
const PNG_SIZE = 1024;
const el = (id) => document.getElementById(id);
const payload = el("payload");
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

function render() {
  const text = payload.value;
  if (!text.trim()) {
    resetPreview("Nhập nội dung để tạo QR.");
    return;
  }
  const foreground = foregroundEl.value;
  const background = backgroundEl.value;
  if (foreground === background) {
    resetPreview("Màu nền và màu mã phải khác nhau.", true);
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
    setStatus("Mã QR tạo ngay trên máy của mày; không có yêu cầu mạng gửi nội dung.");
  } catch (err) {
    resetPreview("Không tạo được QR (nội dung quá dài hoặc dữ liệu không phù hợp).", true);
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
  // All SVG elements are constructed with createElementNS; user text never enters markup.
  const serialized = new XMLSerializer().serializeToString(preview);
  download(new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }), "qrframe-noi-bo.svg");
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
  canvas.toBlob((blob) => download(blob, "qrframe-noi-bo.png"), "image/png");
}

payload.addEventListener("input", () => {
  if (inputTimer !== null) clearTimeout(inputTimer);
  inputTimer = setTimeout(render, 150);
});
for (const input of [shapeEl, eclEl, foregroundEl, backgroundEl]) {
  input.addEventListener("change", render);
  input.addEventListener("input", render);
}
svgButton.addEventListener("click", downloadSVG);
pngButton.addEventListener("click", downloadPNG);
resetPreview("Nhập nội dung để tạo QR.");
