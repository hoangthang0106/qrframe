// Offline, privacy-preserving QR decoration helpers.
// User text never becomes markup. Logo inputs are sanitized by rasterizing to PNG.
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 4096;
const LOGO_RASTER_SIZE = 192;

export function singleLine(value, max = 42) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").trim().slice(0, max);
}

export function effectiveCaption(mode, custom) {
  switch (mode) {
    case "scan": return "SCAN ME";
    case "viet": return "QUÉT MÃ";
    case "custom": return singleLine(custom, 36);
    default: return "";
  }
}

export function brandLayout(side, options = {}) {
  const title = singleLine(options.title, 40);
  const caption = singleLine(options.caption, 36);
  const note = singleLine(options.note, 54);
  const top = title ? 4.8 : 0;
  const label = caption ? 4.5 : 0;
  const detail = note ? 3.7 : 0;
  return {
    title, caption, note,
    top, side, totalHeight: side + top + label + detail,
    captionY: side + top + (caption ? 3.2 : 0),
    noteY: side + top + label + (note ? 2.6 : 0),
    titleY: title ? 3.05 : 0
  };
}

export function logoGeometry(side, fullSide, top = 0, sizeChoice = "small") {
  const ratio = sizeChoice === "medium" ? 0.14 : 0.105;
  const size = Math.min(side * ratio, 7.5);
  const centerX = fullSide / 2;
  const centerY = top + fullSide / 2;
  const pad = Math.max(0.35, size * 0.11);
  return {
    x: centerX - size / 2,
    y: centerY - size / 2,
    size,
    bgX: centerX - size / 2 - pad,
    bgY: centerY - size / 2 - pad,
    bgSize: size + 2 * pad,
    pad
  };
}

export function detectImageFormat(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) return null;
  if ([137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (String.fromCharCode(...bytes.slice(0,4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8,12)) === "WEBP") return "image/webp";
  return null;
}

export function checkLogoFile(file, header) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("Logo cần là ảnh PNG/JPG/WebP tối đa 2 MB.");
  }
  const actual = detectImageFormat(header);
  if (!ALLOWED.includes(actual) || actual !== file.type) {
    throw new Error("Chỉ nhận ảnh PNG, JPG, WebP đúng định dạng; không nhận SVG/GIF hoặc file giả mạo.");
  }
  return actual;
}

export async function rasterizeLogo(file) {
  if (!file) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = checkLogoFile(file, bytes.subarray(0, 16));
  let bitmap;
  try {
    bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
    if (!bitmap.width || !bitmap.height ||
        bitmap.width > MAX_DIMENSION || bitmap.height > MAX_DIMENSION) {
      throw new Error("Kích thước logo vượt giới hạn 4096 × 4096 px.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = LOGO_RASTER_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
    ctx.clearRect(0, 0, LOGO_RASTER_SIZE, LOGO_RASTER_SIZE);
    const ratio = Math.min(LOGO_RASTER_SIZE / bitmap.width, LOGO_RASTER_SIZE / bitmap.height);
    const width = bitmap.width * ratio;
    const height = bitmap.height * ratio;
    ctx.drawImage(bitmap, (LOGO_RASTER_SIZE - width) / 2,
      (LOGO_RASTER_SIZE - height) / 2, width, height);
    // Re-encoding to PNG drops the original metadata and removes SVG/script vectors.
    const dataUrl = canvas.toDataURL("image/png");
    if (!dataUrl.startsWith("data:image/png;base64,")) {
      throw new Error("Không thể chuyển logo thành PNG an toàn.");
    }
    return { canvas, dataUrl };
  } finally {
    if (bitmap) bitmap.close();
  }
}

export function readableTextSize(text, side, preferred = 2.0) {
  // Keep short QR captions readable without overflowing the symbol width.
  return Math.min(preferred, (side - 6) / Math.max(1, singleLine(text, 54).length * 0.59));
}


// Optional Wi-Fi hand-entry panel beneath a QR image.
// No credentials are stored or sent anywhere; the caller must explicitly opt in.
// Split long passwords without adding spaces; each next line is a continuation.
export function wifiCredentialCard(baseHeight, side, ssid, password, isOpen = false) {
  const split = (value, limit = 24) => {
    const chars = Array.from(String(value ?? ""));
    const result = [];
    for (let offset = 0; offset < chars.length; offset += limit) {
      result.push(chars.slice(offset, offset + limit).join(""));
    }
    return result.length ? result : [""];
  };
  const ssidLines = split(ssid);
  const passwordLines = isOpen ? ["Không cần mật khẩu"] : split(password);
  const lineHeight = 2.35;
  const headingY = baseHeight + 3.5;
  const ssidLabelY = headingY + 3.2;
  const ssidYs = ssidLines.map((_, i) => ssidLabelY + 2.5 + i * lineHeight);
  const passwordLabelY = ssidYs.at(-1) + 3.0;
  const passwordYs = passwordLines.map((_, i) => passwordLabelY + 2.5 + i * lineHeight);
  return {
    heading: "DÀNH CHO LAPTOP — NHẬP THỦ CÔNG",
    headingY, ssidLabelY, ssidLines, ssidYs,
    passwordLabel: isOpen ? "BẢO MẬT" :
      (passwordLines.length > 1 ? "MẬT KHẨU (NỐI LIỀN CÁC DÒNG)" : "MẬT KHẨU WI-FI"),
    passwordLabelY, passwordLines, passwordYs,
    separatorY: baseHeight + 1.35,
    totalHeight: passwordYs.at(-1) + 3.0,
    side
  };
}
