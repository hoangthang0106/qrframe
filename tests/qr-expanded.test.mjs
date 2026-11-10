import test from "node:test";
import assert from "node:assert/strict";
import { buildPayload } from "../secure/payload.js";
import { buildVietQr, crc16Emv } from "../secure/vietqr.js";
import { buildLandingHtml } from "../secure/landing.js";

test("VietQR reproduces EMVCo/NAPAS checksum example (bank 970436)", () => {
  const expected = "00020101021138540010A00000072701240006970436011012345678900208QRIBFTTA53037045802VN6304BE57";
  assert.equal(buildVietQr({ bankBin:"970436",account:"1234567890"}), expected);
  assert.equal(buildPayload("vietqr", {bankBin:"970436",bankAccount:"1234567890"}), expected);
});
test("VietQR amount and note with CRC integrity", () => {
  const p = buildPayload("vietqr", {bankBin:"970422",bankAccount:"0123456789",bankAmount:"150000",bankNote:"THANH TOAN"});
  assert.match(p,/385[0-9]0010A000000727/);
  assert.match(p,/5406150000/);
  assert.match(p,/5303704/);
  assert.match(p,/620[0-9]0810THANH TOAN/);
  assert.equal(p.slice(-4),crc16Emv(p.slice(0,-4)));
  assert.throws(()=>buildPayload("vietqr",{bankBin:"000",bankAccount:"123456"}));
  assert.throws(()=>buildPayload("vietqr",{bankBin:"970436",bankAccount:"1abc"}));
  assert.throws(()=>buildPayload("vietqr",{bankBin:"970436",bankAccount:"1234567",bankAmount:"-10"}));
  assert.throws(()=>buildPayload("vietqr",{bankBin:"970436",bankAccount:"1234567",bankNote:"CHUYỂN TIỀN"}));
});
test("20+ URL categories are static URL QR codes", () => {
  const kinds=["menu","pdf","file","product","catalog","app","meeting","maps","review",
    "video","live","booking","form","feedback","support","payment","download","ticket","portfolio","album"];
  for(const kind of kinds){
    const link=buildPayload(kind,{targetUrl:"https://example.com/download?a=1"});
    assert.equal(link,"https://example.com/download?a=1",kind);
    assert.throws(()=>buildPayload(kind,{targetUrl:"javascript:alert(1)"}),kind);
  }
});
test("social media URL platform domain is verified",()=>{
  assert.equal(buildPayload("social",{socialPlatform:"telegram",socialUrl:"https://t.me/channel"}),"https://t.me/channel");
  assert.equal(buildPayload("social",{socialPlatform:"facebook",socialUrl:"https://m.facebook.com/page"}),"https://m.facebook.com/page");
  assert.throws(()=>buildPayload("social",{socialPlatform:"facebook",socialUrl:"https://facebook.com.attacker.invalid/phish"}));
  assert.throws(()=>buildPayload("social",{socialPlatform:"github",socialUrl:"https://evil.com"}));
});
test("static landing QR demands a hosted URL, not local HTML",()=>{
  assert.equal(buildPayload("landing",{landingUrl:"https://example.com/link-in-bio"}),"https://example.com/link-in-bio");
  assert.throws(()=>buildPayload("landing",{landingUrl:""}));
  assert.throws(()=>buildPayload("landing",{landingUrl:"file:///tmp/index.html"}));
});
test("coupon QR encodes plain text, no backend or tracking",()=>{
  assert.equal(buildPayload("coupon",{couponCode:"SALE2026",couponExpiry:"31/12/2026",couponNote:"Shop 1"}),
  "MÃ ƯU ĐÃI: SALE2026\nHẠN: 31/12/2026\nGHI CHÚ: Shop 1");
  assert.throws(()=>buildPayload("coupon",{couponCode:"ABC\nDEF"}));
});
test("landing HTML is standalone, scriptless and escapes XSS",()=>{
  const html=buildLandingHtml({
    landingTemplate:"links",landingTitle:'<img src=x onerror="alert(1)">',
    landingSubtitle:"Link-in-Bio",landingDescription:'<script>alert(1)</script>',
    landingButton1Text:'<b>Website</b>',landingButton1Url:"https://example.com/",
    landingItems:"Dịch vụ A\nDịch vụ B",
    landingPhone:"+84901234567",landingEmail:"help@example.com",
    landingAccent:"#167b62"
  });
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;b&gt;Website&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<script[\s>]/i);
  assert.match(html, /script-src &#39;none&#39;/);
  assert.match(html, /href="https:\/\/example.com\/"/);
  assert.match(html, /href="mailto:help@example.com"/);
  assert.match(html, /Dịch vụ A/);
});
test("landing rejects untrusted link protocols, templates and partial buttons",()=>{
  assert.throws(()=>buildLandingHtml({landingTemplate:"links",landingTitle:"A",landingButton1Text:"Click",landingButton1Url:"javascript:alert(1)"}));
  assert.throws(()=>buildLandingHtml({landingTemplate:"links",landingTitle:"A",landingButton1Text:"Click"}));
  assert.throws(()=>buildLandingHtml({landingTemplate:"__proto__",landingTitle:"A"}));
  assert.throws(()=>buildLandingHtml({landingTemplate:"links",landingTitle:""}));
  assert.throws(()=>buildLandingHtml({landingTemplate:"links",landingTitle:"A",landingPhone:"<script>alert(1)</script>"}));
});
test("landing menu template supports local restaurant content",()=>{
  const html=buildLandingHtml({landingTemplate:"menu",landingTitle:"Quán nội bộ",landingItems:"Phở bò — 45.000đ\nCà phê — 25.000đ"});
  assert.match(html,/Menu \/ Thực đơn/);
  assert.match(html,/Phở bò/);
  assert.match(html,/Cà phê/);
  assert.doesNotMatch(html,/https:\/\/esm.sh/);
});
