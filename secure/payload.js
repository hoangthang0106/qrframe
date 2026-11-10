// Pure QR payload builders. No DOM, storage, network requests or dynamic code execution.
// Each returned string is encoded into the QR matrix locally in the browser.
const requireValue = (value, label) => {
  const out = String(value ?? "").trim();
  if (!out) throw new Error("Cần nhập " + label + ".");
  return out;
};
const optional = (value) => String(value ?? "").trim();

function normalizePhone(value) {
  const number = requireValue(value, "số điện thoại").replace(/[()\s.-]/g, "");
  if (!/^\+?[0-9*#]{3,20}$/.test(number)) {
    throw new Error("Số điện thoại không hợp lệ. Ví dụ: +84901234567.");
  }
  return number;
}

function normalizeEmail(value) {
  const email = requireValue(value, "địa chỉ email");
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || /[\r\n]/.test(email)) {
    throw new Error("Địa chỉ email không hợp lệ.");
  }
  return email;
}

function normalizeUrl(value) {
  let url = requireValue(value, "đường dẫn website");
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) url = "https://" + url;
  let parsed;
  try { parsed = new URL(url); }
  catch { throw new Error("URL không hợp lệ."); }
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error("Chỉ hỗ trợ URL http:// hoặc https://.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Không đưa tên đăng nhập hoặc mật khẩu vào URL.");
  }
  return parsed.href;
}

function wifiEscape(value) {
  const text = String(value ?? "");
  if (/[\r\n\x00]/.test(text)) throw new Error("SSID/mật khẩu không được chứa xuống dòng.");
  return text.replace(/[\\;,:"']/g, (ch) => "\\" + ch);
}

function vcardEscape(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\x00/g, "");
}

function icalEscape(value) {
  return vcardEscape(value);
}

function calendarUtc(value, label) {
  const input = requireValue(value, label);
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(input)) {
    throw new Error("Thời gian " + label + " chưa hợp lệ.");
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw new Error("Thời gian " + label + " không hợp lệ.");
  return { date, text: date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z") };
}

function secureIntegerHash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(16);
}

export function buildPayload(kind, data = {}) {
  const g = (key) => data[key] ?? "";
  let payload;
  switch (kind) {
    case "url":
      payload = normalizeUrl(g("url"));
      break;
    case "text":
      payload = requireValue(g("text"), "văn bản");
      break;
    case "phone":
      payload = "tel:" + normalizePhone(g("phone"));
      break;
    case "sms":
      payload = "SMSTO:" + normalizePhone(g("smsPhone")) + ":" + optional(g("smsBody"));
      break;
    case "wifi": {
      const ssid = requireValue(g("ssid"), "tên mạng Wi-Fi (SSID)");
      if (new TextEncoder().encode(ssid).length > 32) {
        throw new Error("SSID không được quá 32 byte theo giới hạn Wi-Fi.");
      }
      const type = g("wifiSecurity") || "WPA";
      if (!["WPA", "nopass"].includes(type)) throw new Error("Kiểu bảo mật Wi-Fi không hợp lệ.");
      const hidden = g("hidden") === "true" ? "true" : "false";
      const password = String(g("wifiPassword"));
      if (type !== "nopass" && !password) throw new Error("Cần nhập mật khẩu Wi-Fi.");
      if (type === "WPA" && !(password.length >= 8 && password.length <= 63) && !/^[0-9A-Fa-f]{64}$/.test(password)) {
        throw new Error("Mật khẩu Wi-Fi Personal cần 8–63 ký tự hoặc khóa hex 64 ký tự.");
      }
      payload = "WIFI:T:" + type + ";S:" + wifiEscape(ssid) + ";" +
        (type === "nopass" ? "" : "P:" + wifiEscape(password) + ";") + "H:" + hidden + ";;";
      break;
    }
    case "email": {
      const email = normalizeEmail(g("email"));
      const q = new URLSearchParams();
      if (optional(g("subject"))) q.set("subject", optional(g("subject")));
      if (optional(g("body"))) q.set("body", optional(g("body")));
      payload = "mailto:" + email + (q.toString() ? "?" + q.toString() : "");
      break;
    }
    case "contact": {
      const first = optional(g("firstName"));
      const last = optional(g("lastName"));
      const fullName = [last, first].filter(Boolean).join(" ");
      if (!fullName) throw new Error("Cần nhập họ hoặc tên danh bạ.");
      const lines = ["BEGIN:VCARD", "VERSION:3.0",
        "N:" + vcardEscape(last) + ";" + vcardEscape(first) + ";;;",
        "FN:" + vcardEscape(fullName)];
      if (optional(g("contactPhone"))) lines.push("TEL;TYPE=CELL:" + normalizePhone(g("contactPhone")));
      if (optional(g("contactEmail"))) lines.push("EMAIL:" + normalizeEmail(g("contactEmail")));
      if (optional(g("company"))) lines.push("ORG:" + vcardEscape(g("company")));
      if (optional(g("job"))) lines.push("TITLE:" + vcardEscape(g("job")));
      if (optional(g("contactUrl"))) lines.push("URL:" + normalizeUrl(g("contactUrl")));
      if (optional(g("address"))) lines.push("ADR;TYPE=WORK:;;" + vcardEscape(g("address")) + ";;;;");
      lines.push("END:VCARD");
      payload = lines.join("\r\n");
      break;
    }
    case "event": {
      const title = requireValue(g("eventTitle"), "tên sự kiện");
      const start = calendarUtc(g("start"), "bắt đầu");
      const end = calendarUtc(g("end"), "kết thúc");
      if (end.date <= start.date) throw new Error("Thời gian kết thúc phải sau khi bắt đầu.");
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//QRFrame Private LAN//VI",
        "BEGIN:VEVENT",
        "UID:" + secureIntegerHash(title + start.text + end.text) + "@qrframe.local",
        "DTSTAMP:" + start.text, "DTSTART:" + start.text, "DTEND:" + end.text,
        "SUMMARY:" + icalEscape(title)];
      if (optional(g("eventLocation"))) lines.push("LOCATION:" + icalEscape(g("eventLocation")));
      if (optional(g("eventDescription"))) lines.push("DESCRIPTION:" + icalEscape(g("eventDescription")));
      lines.push("END:VEVENT", "END:VCALENDAR");
      payload = lines.join("\r\n");
      break;
    }
    case "geo": {
      const latitude = requireValue(g("lat"), "vĩ độ");
      const longitude = requireValue(g("lon"), "kinh độ");
      const lat = Number(latitude);
      const lon = Number(longitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
        throw new Error("Vĩ độ phải thuộc [-90,90] và kinh độ [-180,180].");
      }
      payload = "geo:" + lat + "," + lon;
      break;
    }
    case "whatsapp": {
      let number = normalizePhone(g("waPhone")).replace(/^\+/, "").replace(/^00/, "");
      if (!/^[1-9][0-9]{6,14}$/.test(number)) throw new Error("WhatsApp cần số có mã quốc gia, ví dụ 84901234567.");
      const message = optional(g("waMessage"));
      payload = "https://wa.me/" + number + (message ? "?text=" + encodeURIComponent(message) : "");
      break;
    }
    case "zalo": {
      const number = normalizePhone(g("zaloPhone")).replace(/^\+/, "");
      if (!/^\d{8,15}$/.test(number)) throw new Error("Số Zalo phải có 8–15 chữ số.");
      payload = "https://zalo.me/" + number;
      break;
    }
    default:
      throw new Error("Loại mã QR không được hỗ trợ.");
  }
  if (new TextEncoder().encode(payload).length > 1800) {
    throw new Error("Dữ liệu quá dài để tạo mã QR ổn định. Hãy rút gọn nội dung.");
  }
  return payload;
}
