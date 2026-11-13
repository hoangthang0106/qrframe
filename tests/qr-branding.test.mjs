import test from "node:test";
import assert from "node:assert/strict";
import {
  singleLine, effectiveCaption, brandLayout, logoGeometry,
  detectImageFormat, checkLogoFile, readableTextSize, wifiCredentialCard
} from "../secure/branding.js";

test("English/Vietnamese/custom scan captions and safe one-line text", () => {
  assert.equal(effectiveCaption("scan", "ignored"), "SCAN ME");
  assert.equal(effectiveCaption("viet", ""), "QUÉT MÃ");
  assert.equal(effectiveCaption("none", "ignored"), "");
  assert.equal(effectiveCaption("custom", " Quét\r\nđể liên hệ "), "Quét  để liên hệ");
  assert.ok(singleLine("x".repeat(100), 40).length === 40);
  assert.ok(readableTextSize("QUÉT MÃ", 29) > 0);
});

test("brand area remains outside QR quiet zone", () => {
  const b = brandLayout(41, { title: "Công ty", caption: "SCAN ME", note: "Hotline 0901 234 567" });
  assert.equal(b.side, 41);
  assert.ok(b.top > 0);
  assert.ok(b.totalHeight > 41);
  assert.ok(b.titleY < b.top);
  assert.ok(b.captionY > b.top + b.side);
  assert.ok(b.noteY > b.captionY);
  const blank = brandLayout(41, {});
  assert.equal(blank.totalHeight, 41);
});

test("enlarged logo remains centered on QR and avoids finder corners", () => {
  for (const modules of [21,25,33,57,177]) {
    const full=modules+8;
    for (const size of ["small", "medium", "large"]) {
      const g=logoGeometry(modules,full,4,size);
      assert.ok(g.size <= Math.min(modules*0.241,22));
      assert.ok(g.size <= 22);
      assert.ok(g.size > 0);
      assert.ok(g.x > 4 && g.y > 4);
      assert.ok(g.x + g.size < full-4);
      assert.ok(g.y + g.size < full+4);
      assert.ok(g.bgSize > g.size);
      if(modules === 33 && size === "medium") assert.ok(g.size > 6.5);
    }
  }
});

test("logo accepts actual PNG/JPEG/WebP signatures and rejects SVG disguised as PNG", () => {
  const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
  const jpg = Uint8Array.from([255,216,255,224,0,0,0,0,0,0,0,0]);
  const webp = Uint8Array.from([82,73,70,70,0,0,0,0,87,69,66,80]);
  assert.equal(detectImageFormat(png), "image/png");
  assert.equal(detectImageFormat(jpg), "image/jpeg");
  assert.equal(detectImageFormat(webp), "image/webp");
  assert.equal(detectImageFormat(new TextEncoder().encode("<svg onload=x>")), null);
  assert.equal(checkLogoFile({size:1000,type:"image/png"},png), "image/png");
  assert.equal(checkLogoFile({size:1000,type:"image/jpeg"},jpg), "image/jpeg");
  assert.equal(checkLogoFile({size:1000,type:"image/webp"},webp), "image/webp");
  assert.throws(() => checkLogoFile({size:10,type:"image/png"},new TextEncoder().encode("<svg onload=x>")));
  assert.throws(() => checkLogoFile({size:1000,type:"image/svg+xml"},png));
  assert.throws(() => checkLogoFile({size:3_000_000,type:"image/png"},png));
  assert.throws(() => checkLogoFile({size:1000,type:"image/gif"},png));
  assert.throws(() => checkLogoFile({size:1000,type:"image/png"},jpg));
});


test("Wi-Fi credentials panel is laid out beneath QR and preserves exact secret characters", () => {
  const ssid="Công ty Phước Thành - IT";
  const secret="AA  bb;:!@#  123456789012345678901234567890123";
  const qrHeight=41;
  const c=wifiCredentialCard(qrHeight,41,ssid,secret,false);
  assert.ok(c.separatorY > qrHeight);
  assert.ok(c.ssidLabelY > qrHeight);
  assert.ok(c.passwordLabelY > c.ssidYs.at(-1));
  assert.ok(c.totalHeight > c.passwordYs.at(-1));
  assert.equal(c.ssidLines.join(""),ssid);
  assert.equal(c.passwordLines.join(""),secret); // no spaces or characters inserted/removed
  assert.equal(c.passwordLabel,"THÔNG TIN (NỐI LIỀN CÁC DÒNG)");
  for(const line of c.passwordLines) assert.ok(Array.from(line).length <= 24);
});

test("Wi-Fi printable fields allow SSID only, note only, or nothing", () => {
  assert.equal(wifiCredentialCard(41,41,"",""),null);
  const a=wifiCredentialCard(41,41,"Guest","");
  assert.deepEqual(a.passwordLines,[]);
  assert.deepEqual(a.ssidLines,["Guest"]);
  const b=wifiCredentialCard(41,41,"","Khách liên hệ lễ tân");
  assert.deepEqual(b.ssidLines,[]);
  assert.deepEqual(b.passwordLines,["Khách liên hệ lễ tân"]);
  assert.equal(b.passwordLabel,"THÔNG TIN / MẬT KHẨU");
});

test("Wi-Fi visible credentials require explicit opt-in in UI and are included in both SVG and PNG paths", async () => {
  const {readFileSync} = await import("node:fs");
  const html=readFileSync(new URL("../secure/index.html", import.meta.url),"utf8");
  const app=readFileSync(new URL("../secure/app.js", import.meta.url),"utf8");
  assert.match(html, /id="wifi-show-credentials" type="checkbox"/);
  assert.match(html, /id="wifi-print-ssid"/);
  assert.match(html, /id="wifi-print-password"/);
  assert.doesNotMatch(html, /💻 Dành cho laptop — nhập Wi-Fi thủ công/);
  assert.doesNotMatch(html, /id="wifi-print-ssid"[^>]+value=/);
  assert.doesNotMatch(html, /id="wifi-print-password"[^>]+value=/);
  assert.doesNotMatch(html, /id="wifi-show-credentials"[^>]*checked/);
  assert.match(app, /kind === "wifi" && wifiOptInEl.checked/);
  assert.match(app, /wifiPrintSsid\.value, wifiPrintPassword\.value/);
  assert.doesNotMatch(app, /String\(data\.wifiPassword \?\? ""\), data\.wifiSecurity/);
  assert.match(app, /wifiCard\.passwordLines\.forEach/g);
  assert.match(app, /el\("wifi-password-preview"\)\.textContent/);
  assert.match(app, /wifiOptInEl\.checked = false/);
  assert.doesNotMatch(app, /wifiCard\.heading/);
});
