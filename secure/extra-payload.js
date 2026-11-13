// Offline-first optional QR payloads. No network calls and no dynamic script evaluation.
import { buildVietQr } from "./vietqr.js";

const plain = (value) => String(value ?? "").trim();
function required(value, label) {
  const out = plain(value);
  if (!out) throw new Error("Cần nhập " + label + ".");
  return out;
}
export function safeWebUrl(input) {
  let value = required(input, "đường dẫn URL");
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = "https://" + value;
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error("URL không hợp lệ."); }
  if (!["https:", "http:"].includes(parsed.protocol) || !parsed.hostname ||
      parsed.username || parsed.password) {
    throw new Error("Chỉ chấp nhận URL HTTP/HTTPS không có tên đăng nhập, mật khẩu.");
  }
  return parsed.href;
}
const urlCategories = {
  menu: "menu/ thực đơn", pdf: "PDF", file: "tài liệu/tệp", product: "sản phẩm",
  catalog: "catalogue", app: "ứng dụng", meeting: "cuộc họp", maps: "bản đồ",
  review: "trang đánh giá", video: "video", live: "phát trực tiếp",
  booking: "trang đặt lịch", form: "biểu mẫu", feedback: "phản hồi",
  support: "hỗ trợ", payment: "liên kết thanh toán", download: "tải ứng dụng/tệp",
  ticket: "vé điện tử", portfolio: "portfolio", album: "album ảnh"
};
const platformHosts = {
  facebook: ["facebook.com", "fb.com", "fb.me", "m.facebook.com"],
  instagram: ["instagram.com"], tiktok: ["tiktok.com"],
  youtube: ["youtube.com", "youtu.be"], linkedin: ["linkedin.com"],
  threads: ["threads.com", "threads.net"], twitter: ["x.com", "twitter.com"],
  telegram: ["t.me", "telegram.me"], github: ["github.com"],
  spotify: ["spotify.com", "open.spotify.com"], pinterest: ["pinterest.com"],
  discord: ["discord.gg", "discord.com"], twitch: ["twitch.tv"],
  reddit: ["reddit.com"], zalo: ["zalo.me"], whatsapp: ["wa.me", "whatsapp.com"],
  snapchat: ["snapchat.com"], soundcloud: ["soundcloud.com"],
  line: ["line.me"], shopee: ["shopee.vn"], lazada: ["lazada.vn"],
  googleplay: ["play.google.com"], appstore: ["apps.apple.com"]
};
export const socialPlatforms = Object.keys(platformHosts);

export function buildExtendedPayload(kind, data = {}) {
  const get = (key) => data[key] ?? "";
  if (kind === "landing") {
    return safeWebUrl(get("landingUrl"));
  }
  if (Object.hasOwn(urlCategories, kind)) {
    return safeWebUrl(get("targetUrl"));
  }
  if (kind === "social") {
    const url = safeWebUrl(get("socialUrl"));
    const platform = get("socialPlatform");
    const allowed = platformHosts[platform];
    if (!allowed) throw new Error("Nền tảng mạng xã hội chưa được hỗ trợ.");
    const host = new URL(url).hostname.toLowerCase();
    if (!allowed.some((name) => host === name || host.endsWith("." + name))) {
      throw new Error("URL không thuộc nền tảng " + platform + ". Hãy kiểm tra đường dẫn.");
    }
    return url;
  }
  if (kind === "coupon") {
    const code = required(get("couponCode"), "mã ưu đãi");
    if (/[\r\n\x00-\x1f]/.test(code)) throw new Error("Mã ưu đãi không được chứa xuống dòng.");
    const expires = plain(get("couponExpiry"));
    const note = plain(get("couponNote"));
    return ["MÃ ƯU ĐÃI: " + code, expires ? "HẠN: " + expires : "",
      note ? "GHI CHÚ: " + note : ""].filter(Boolean).join("\n");
  }
  if (kind === "vietqr") {
    return buildVietQr({
      bankBin: get("bankBin"),
      account: get("bankAccount"),
      amount: get("bankAmount"),
      note: get("bankNote")
    });
  }
  throw new Error("Loại mã QR chưa được hỗ trợ.");
}
