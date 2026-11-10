import test from "node:test";
import assert from "node:assert/strict";
import { buildPayload } from "../secure/payload.js";

test("HTTPS and LAN URL without network request", () => {
  assert.equal(buildPayload("url", {url:"https://example.com/path?q=1"}), "https://example.com/path?q=1");
  assert.equal(buildPayload("url", {url:"http://192.168.20.194:18889/studio"}), "http://192.168.20.194:18889/studio");
  assert.throws(() => buildPayload("url", {url:"javascript:alert(1)"}));
  assert.throws(() => buildPayload("url", {url:"https://admin:secret@example.com"}));
});

test("text and phone", () => {
  assert.equal(buildPayload("text", {text:"Xin chào!"}), "Xin chào!");
  assert.equal(buildPayload("phone", {phone:"+84 901 234 567"}), "tel:+84901234567");
  assert.throws(() => buildPayload("phone", {phone:"123\r\nSMSTO:123"}));
});

test("SMS payload", () => {
  assert.equal(buildPayload("sms", {smsPhone:"0901234567",smsBody:"Hỗ trợ IT"}), "SMSTO:0901234567:Hỗ trợ IT");
});

test("WiFi password escapes delimiters and handles hidden SSID", () => {
  assert.equal(buildPayload("wifi", {
    ssid:"PT;Office",wifiSecurity:"WPA",wifiPassword:"My,pass;123",hidden:"true"
  }), "WIFI:T:WPA;S:PT\\;Office;P:My\\,pass\\;123;H:true;;");
  assert.equal(buildPayload("wifi", {ssid:"Guest",wifiSecurity:"nopass",hidden:"false"}), "WIFI:T:nopass;S:Guest;H:false;;");
  assert.throws(() => buildPayload("wifi", {ssid:"Office",wifiSecurity:"WPA",wifiPassword:"short"}));
  assert.throws(() => buildPayload("wifi", {ssid:"Office\nInjector",wifiSecurity:"nopass"}));
});

test("email mailto", () => {
  const p = buildPayload("email", {email:"it@example.com",subject:"Hỗ trợ",body:"Xin chào"});
  assert.match(p, /^mailto:it@example\.com\?subject=/);
  assert.match(p, /body=/);
  assert.throws(() => buildPayload("email", {email:"x\r\n@test.com"}));
});

test("vCard contact: escapes name and address", () => {
  const p = buildPayload("contact", {
    firstName:"Văn, An",lastName:"Nguyễn",contactPhone:"+84901234567",
    contactEmail:"an@example.com",company:"Công ty; A",address:"Tầng 1\nQuận 1"
  });
  assert.match(p, /BEGIN:VCARD\r\nVERSION:3\.0/);
  assert.match(p, /FN:Nguyễn Văn\\, An/);
  assert.match(p, /TEL;TYPE=CELL:\+84901234567/);
  assert.match(p, /ORG:Công ty\\; A/);
  assert.match(p, /ADR;TYPE=WORK:;;Tầng 1\\nQuận 1;;;;/);
  assert.match(p, /END:VCARD$/);
});

test("calendar VCALENDAR", () => {
  const p = buildPayload("event", {
    eventTitle:"Họp IT", start:"2026-11-12T08:00", end:"2026-11-12T09:00",
    eventLocation:"Phòng; A"
  });
  assert.match(p, /BEGIN:VCALENDAR/);
  assert.match(p, /BEGIN:VEVENT/);
  assert.match(p, /DTSTART:\d{8}T\d{6}Z/);
  assert.match(p, /LOCATION:Phòng\\; A/);
  assert.match(p, /END:VCALENDAR$/);
  assert.throws(() => buildPayload("event", {eventTitle:"Họp",start:"2026-11-12T09:00",end:"2026-11-12T08:00"}));
});

test("GPS geo URI", () => {
  assert.equal(buildPayload("geo", {lat:"10.7769",lon:"106.7009"}), "geo:10.7769,106.7009");
  assert.throws(() => buildPayload("geo", {lat:"120",lon:"106"}));
});

test("WhatsApp/Zalo hyperlinks only; no network I/O", () => {
  assert.equal(buildPayload("whatsapp", {waPhone:"+84901234567",waMessage:"Xin chào"}), "https://wa.me/84901234567?text=Xin%20ch%C3%A0o");
  assert.equal(buildPayload("zalo", {zaloPhone:"0901234567"}), "https://zalo.me/0901234567");
  assert.throws(() => buildPayload("whatsapp", {waPhone:"foo"}));
});

test("reject unsupported QR payload kind", () => {
  assert.throws(() => buildPayload("script", {script:"alert(1)"}));
});

test("Wi-Fi SSIDs containing apostrophes are not changed", () => {
  assert.equal(buildPayload("wifi", {ssid:"John's WiFi",wifiSecurity:"nopass",hidden:"false"}), "WIFI:T:nopass;S:John's WiFi;H:false;;");
});
