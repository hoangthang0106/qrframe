import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setLanguage, getLanguage, t } from "../secure/i18n.js";
import { buildPayload } from "../secure/payload.js";
import { wifiCredentialCard } from "../secure/branding.js";
import { buildLandingHtml } from "../secure/landing.js";

test("Vietnamese remains the default; language switching is reversible", () => {
  assert.equal(getLanguage(), "vi");
  assert.equal(t("Tạo mã QR"), "Tạo mã QR");
  setLanguage("en");
  assert.equal(getLanguage(), "en");
  assert.equal(t("Tạo mã QR"), "Create a QR code");
  assert.equal(t("Mật khẩu Wi-Fi"), "Wi-Fi password");
  assert.equal(t("Xem trước QR"), "QR preview");
  assert.equal(t("🖼️ Logo & chữ trên mã QR"), "🖼️ Logo & text on QR code");
  assert.equal(t("Tải PNG"), "Download PNG");
  assert.equal(t("Đang đọc và chuyển logo thành PNG cục bộ..."), "Reading and converting logo to PNG locally...");
  setLanguage("vi");
  assert.equal(t("Tải PNG"), "Tải PNG");
});

test("dynamic messages, dimensions and validation errors have English versions", () => {
  setLanguage("en");
  assert.equal(t("Cần nhập số điện thoại."), "Please enter phone number.");
  assert.equal(t("Nút 2 cần cả tên và URL."), "Button 2 requires both a label and a URL.");
  assert.equal(t("URL không thuộc nền tảng facebook. Hãy kiểm tra đường dẫn."),
    "The URL does not belong to facebook. Check the link.");
  assert.equal(t("Ảnh xuất: 2048 × 2400 px (PNG / SVG). Chiều cao tăng để chứa chữ hoặc thông tin dưới QR."),
    "Export image: 2048 × 2400 px (PNG / SVG). Height increases to fit text or details below the QR.");
  assert.equal(t("VietQR TLV không hợp lệ."), "Invalid VietQR TLV.");
  setLanguage("vi");
});

test("language selection does not translate entered QR payloads or passwords", () => {
  const input = { ssid: "OFFICE-GUEST",wifiSecurity:"WPA",
    wifiPassword:"SecretPwd@123", hidden:"false" };
  setLanguage("vi");
  const vi = buildPayload("wifi",input);
  setLanguage("en");
  const en = buildPayload("wifi",input);
  assert.equal(en,vi);
  assert.ok(en.includes("SecretPwd@123"));
  assert.ok(en.includes("OFFICE-GUEST"));
  setLanguage("vi");
});

test("printed Wi-Fi labels follow language, but manually typed details are unchanged", () => {
  const ssid = "Office #1 / Wi-Fi";
  const password = "Password #A01 2026";
  const vi=wifiCredentialCard(41,41,ssid,password,"vi");
  const en=wifiCredentialCard(41,41,ssid,password,"en");
  assert.equal(vi.ssidLabel,"TÊN WI-FI (SSID)");
  assert.equal(en.ssidLabel,"WI-FI NAME (SSID)");
  assert.equal(en.passwordLabel,"DETAILS / PASSWORD");
  assert.equal(en.ssidLines.join(""),ssid);
  assert.equal(en.passwordLines.join(""),password);
});

test("landing page output follows selected language, keeping its content and CSP", () => {
  const data={landingTemplate:"menu",landingTitle:"Café Nội Bộ",
    landingDescription:"Món ngon mỗi ngày",landingItems:"Phở bò\nBún bò",
    landingPhone:"+84901234567"};
  const htmlVi = buildLandingHtml(data);
  const htmlEn = buildLandingHtml(data,"en");
  assert.match(htmlVi,/lang="vi"/);
  assert.match(htmlEn,/lang="en"/);
  assert.match(htmlEn,/<h2>Menu<\/h2>/);
  assert.match(htmlEn,/<h2>Contact<\/h2>/);
  assert.match(htmlVi,/<h2>Menu \/ Thực đơn<\/h2>/);
  assert.match(htmlEn,/Món ngon mỗi ngày/);
  assert.match(htmlEn,/script-src &#39;none&#39;/);
  assert.doesNotMatch(htmlEn,/<script[\s>]/);
});

test("language selector exists; translation is offline and inputs are not rewritten", () => {
  const html = readFileSync(new URL("../secure/index.html",import.meta.url),"utf8");
  const app = readFileSync(new URL("../secure/app.js",import.meta.url),"utf8");
  const i18n = readFileSync(new URL("../secure/i18n.js",import.meta.url),"utf8");
  assert.match(html, /id="language"/);
  assert.match(html, /value="vi" selected/);
  assert.match(html, /value="en"/);
  assert.match(app, /languageEl\.addEventListener\("change"/);
  assert.match(app, /translateDom\(document\.body\)/);
  assert.match(app, /getLanguage\(\)/);
  assert.doesNotMatch(i18n, /\bfetch\s*\(|\bXMLHttpRequest\b|\bsendBeacon\b|\bWebSocket\b|\blocalStorage\b|\bsessionStorage\b/);
  assert.doesNotMatch(i18n, /innerHTML\s*=/);
});
