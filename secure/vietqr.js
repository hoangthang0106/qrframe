// NAPAS VietQR account-transfer payload, generated wholly offline.
// Tag 38 A000000727, service QRIBFTTA; EMVCo TLV CRC-16/CCITT-FALSE.
// This QR is a reusable transfer instruction, NOT a one-time/trackable payment session.
function tlv(tag, value) {
  if (!/^\d{2}$/.test(tag) || value.length > 99) throw new Error("VietQR TLV không hợp lệ.");
  return tag + String(value.length).padStart(2, "0") + value;
}
export function crc16Emv(text) {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
export function buildVietQr({ bankBin, account, amount = "", note = "" } = {}) {
  const bin = String(bankBin ?? "").trim();
  const number = String(account ?? "").trim();
  const money = String(amount ?? "").trim();
  const message = String(note ?? "").trim();

  if (!/^\d{6}$/.test(bin)) throw new Error("Mã BIN ngân hàng phải gồm đúng 6 chữ số, ví dụ 970436.");
  if (!/^[0-9]{4,19}$/.test(number)) throw new Error("Số tài khoản VietQR phải gồm 4–19 chữ số.");
  if (money && (!/^[1-9]\d{0,11}$/.test(money) || !Number.isSafeInteger(Number(money)))) {
    throw new Error("Số tiền phải là số VND nguyên dương, không dấu phân cách.");
  }
  if (message && (!/^[A-Za-z0-9 _.,-]{1,25}$/.test(message))) {
    throw new Error("Nội dung chuyển khoản: tối đa 25 ký tự không dấu (chữ/số/khoảng trắng/._,-).");
  }
  const beneficiary = tlv("00", bin) + tlv("01", number);
  const merchant = tlv("00", "A000000727") + tlv("01", beneficiary) + tlv("02", "QRIBFTTA");
  let base = tlv("00", "01") + tlv("01", "11") + tlv("38", merchant) + tlv("53", "704");
  if (money) base += tlv("54", money);
  base += tlv("58", "VN");
  if (message) base += tlv("62", tlv("08", message));
  const prefix = base + "6304";
  return prefix + crc16Emv(prefix);
}
