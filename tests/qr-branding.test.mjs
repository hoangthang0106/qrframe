import test from "node:test";
import assert from "node:assert/strict";
import {
  singleLine, effectiveCaption, brandLayout, logoGeometry,
  detectImageFormat, checkLogoFile, readableTextSize
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

test("logo is small and centered on QR, away from finder corners", () => {
  for (const modules of [21,25,33,57,177]) {
    const full=modules+8;
    for (const size of ["small", "medium"]) {
      const g=logoGeometry(modules,full,4,size);
      assert.ok(g.size <= modules*0.141);
      assert.ok(g.size > 0);
      assert.ok(g.x > 4 && g.y > 4);
      assert.ok(g.x + g.size < full-4);
      assert.ok(g.y + g.size < full+4);
      assert.ok(g.bgSize > g.size);
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
