// One-file, scriptless landing page HTML generator. No network, tracking, cookies or storage.
import { safeWebUrl } from "./extra-payload.js";

const txt = (value, max = 1200) => String(value ?? "").trim().slice(0, max);
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));
const para = (value) => esc(value).replace(/\r\n|\r|\n/g, "<br>");
const templates = Object.freeze({
  links:"Liên kết nổi bật", business:"Giới thiệu doanh nghiệp",
  menu:"Menu / Thực đơn",product:"Sản phẩm & dịch vụ",
  event:"Thông tin sự kiện",portfolio:"Portfolio",contact:"Liên hệ"
});

export function buildLandingHtml(data = {}) {
  const template = txt(data.landingTemplate, 30) || "links";
  if (!Object.hasOwn(templates, template)) throw new Error("Mẫu landing page không hỗ trợ.");
  const title = txt(data.landingTitle, 100);
  if (!title) throw new Error("Cần nhập tiêu đề landing page.");
  const subtitle = txt(data.landingSubtitle, 140);
  const description = txt(data.landingDescription, 900);
  const address = txt(data.landingAddress, 250);
  const accent = /^#[0-9a-fA-F]{6}$/.test(data.landingAccent || "")
    ? data.landingAccent : "#167b62";
  const items = txt(data.landingItems, 1200).split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 40);
  const buttons = [];
  for (let i = 1; i <= 3; i++) {
    const name = txt(data["landingButton" + i + "Text"], 60);
    const link = txt(data["landingButton" + i + "Url"], 300);
    if (name || link) {
      if (!name || !link) throw new Error("Nút " + i + " cần cả tên và URL.");
      buttons.push({ name, url: safeWebUrl(link) });
    }
  }
  const phone = txt(data.landingPhone, 32);
  if (phone && !/^\+?[0-9()\s.-]{7,28}$/.test(phone)) throw new Error("Số điện thoại landing page không hợp lệ.");
  const email = txt(data.landingEmail, 200);
  if (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error("Email landing page không hợp lệ.");
  const label = templates[template];

  const listMarkup = items.length
    ? '<section class="items"><h2>' + esc(label) + '</h2><ul>' +
      items.map((it) => "<li>" + esc(it) + "</li>").join("") + "</ul></section>"
    : "";
  const buttonMarkup = buttons.length
    ? '<nav class="links" aria-label="Liên kết">' +
      buttons.map((b) => '<a class="button" href="' + esc(b.url) +
      '" target="_blank" rel="noopener noreferrer">' + esc(b.name) + '</a>').join("") + "</nav>"
    : "";
  const contactMarkup = phone || email || address
    ? '<section class="contacts"><h2>Liên hệ</h2>' +
      (phone ? '<a href="tel:' + esc(phone.replace(/[()\s.-]/g, "")) + '">☎ ' + esc(phone) + '</a>' : "") +
      (email ? '<a href="mailto:' + esc(email) + '">✉ ' + esc(email) + '</a>' : "") +
      (address ? '<p>⌖ ' + para(address) + '</p>' : "") + "</section>"
    : "";

  const policy = "default-src 'none'; script-src 'none'; connect-src 'none'; img-src data:; " +
    "style-src 'unsafe-inline'; font-src 'none'; object-src 'none'; frame-src 'none'; " +
    "base-uri 'none'; form-action 'none'";
  const css = [
    "*{box-sizing:border-box}",
    ":root{color-scheme:dark;--accent:" + accent + ';font-family:system-ui,-apple-system,"Segoe UI",sans-serif}',
    "body{margin:0;min-height:100vh;display:flex;justify-content:center;background:#0c1423;color:#eaf2ff;padding:30px 18px}",
    "main{width:min(100%,650px)}header{text-align:center;padding:52px 20px 30px}",
    ".tag{display:inline-block;border:1px solid #3d655a;border-radius:99px;padding:7px 14px;font-size:12px;color:#b1decf;letter-spacing:.05em}",
    "h1{font-size:clamp(28px,6vw,44px);line-height:1.16;margin:24px 0 12px;overflow-wrap:anywhere}",
    ".subtitle{color:#b1c6da;font-size:18px;line-height:1.6;margin:0}",
    ".description{background:#14233a;border:1px solid #2c4460;padding:23px;border-radius:18px;line-height:1.8;color:#e1ebf5}",
    ".links{display:grid;gap:12px;margin:25px 0}",
    ".button{display:block;text-align:center;padding:17px 20px;border-radius:13px;background:var(--accent);color:white;text-decoration:none;font-weight:750;overflow-wrap:anywhere}",
    ".button:hover{filter:brightness(1.13)}",
    ".items,.contacts{margin-top:25px;border:1px solid #2b4059;border-radius:18px;padding:23px;background:#142033}",
    "h2{font-size:17px;margin:0 0 15px}ul{margin:0;padding-left:20px;line-height:1.9}li{overflow-wrap:anywhere}",
    ".contacts a{display:block;text-decoration:none;color:#a8e2d2;margin:13px 0;overflow-wrap:anywhere}",
    ".contacts p{line-height:1.7;color:#b4c6d9}",
    "footer{text-align:center;color:#7c90a8;margin:36px 0 15px;font-size:12px}"
  ].join("\n");
  return [
    "<!doctype html><html lang=\"vi\"><head>",
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">',
    '<meta http-equiv="Content-Security-Policy" content="' + esc(policy) + '">',
    "<title>" + esc(title) + " — Landing Page</title>",
    '<meta name="description" content="' + esc(subtitle || description.slice(0, 140)) + '">',
    "<style>" + css + "</style></head><body><main>",
    '<header><span class="tag">' + esc(label) + "</span><h1>" + esc(title) + "</h1>" +
      (subtitle ? '<p class="subtitle">' + para(subtitle) + "</p>" : "") + "</header>",
    description ? '<section class="description">' + para(description) + "</section>" : "",
    buttonMarkup,listMarkup,contactMarkup,
    "<footer>Trang tĩnh — Không analytics, cookie hoặc script. Chỉ kết nối ra ngoài khi người đọc tự mở liên kết.</footer>",
    "</main></body></html>"
  ].join("");
}
