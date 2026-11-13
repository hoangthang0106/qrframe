// QRFrame Secure LAN — QR body/eye styling and safe export size (no external imports).
// All paths are generated from numeric coordinates; no user HTML/SVG is evaluated.
export const BODY_STYLES = Object.freeze([
  "square", "rounded", "dots", "microdots", "soft", "diamond",
  "hexagon", "horizontal", "vertical"
]);
export const EYE_STYLES = Object.freeze(["square", "rounded", "dot"]);

export function normalizeStyle(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function isFinderCell(x, y, side) {
  return (x >= 0 && x < 7 && y >= 0 && y < 7) ||
    (x >= side - 7 && x < side && y >= 0 && y < 7) ||
    (x >= 0 && x < 7 && y >= side - 7 && y < side);
}

export function finderOrigins(side) {
  return [[0, 0], [side - 7, 0], [0, side - 7]];
}

export function modulePrimitive(style, x, y, protectedCell = false) {
  if (protectedCell) style = "square";
  switch (style) {
    case "rounded":
      return {kind: "rect", x, y, w: 1, h: 1, r: 0.23};
    case "dots":
      return {kind: "circle", cx: x + .5, cy: y + .5, r: .45};
    case "microdots":
      return {kind: "circle", cx: x + .5, cy: y + .5, r: .37};
    case "soft":
      return {kind: "rect", x: x + .065, y: y + .065, w: .87, h: .87, r: .30};
    case "diamond":
      return {kind: "polygon", points: [[x + .5, y + .045], [x + .955, y + .5],
        [x + .5, y + .955], [x + .045, y + .5]]};
    case "hexagon":
      return {kind: "polygon", points: [[x + .5, y + .045], [x + .95, y + .26],
        [x + .95, y + .74], [x + .5, y + .955], [x + .05, y + .74], [x + .05, y + .26]]};
    case "horizontal":
      return {kind: "rect", x: x + .045, y: y + .20, w: .91, h: .60, r: .29};
    case "vertical":
      return {kind: "rect", x: x + .20, y: y + .045, w: .60, h: .91, r: .29};
    default:
      return {kind: "rect", x, y, w: 1, h: 1, r: 0};
  }
}

// Finder eyes remain 7×7 in all styles; keep their 1-module quiet separators.
export function finderPrimitives(x, y, style) {
  if (style === "square") return [];
  const rOuter = style === "rounded" ? 1.20 : 0.70;
  const rInner = style === "rounded" ? .8 : .45;
  const outer = {kind: "rect", x, y, w: 7, h: 7, r: rOuter, role: "foreground"};
  const ring = {kind: "rect", x: x + 1, y: y + 1, w: 5, h: 5, r: rInner, role: "background"};
  const center = style === "dot"
    ? {kind: "circle", cx: x + 3.5, cy: y + 3.5, r: 1.44, role: "foreground"}
    : {kind: "rect", x: x + 2, y: y + 2, w: 3, h: 3, r: .53, role: "foreground"};
  return [outer, ring, center];
}

export function paintSvgPrimitive(p, foreground, background, createElement) {
  const fill = p.role === "background" ? background : foreground;
  if (p.kind === "circle") {
    return createElement("circle", {cx: p.cx, cy: p.cy, r: p.r, fill});
  }
  if (p.kind === "polygon") {
    return createElement("polygon", {
      points: p.points.map(([x, y]) => x + "," + y).join(" "), fill
    });
  }
  const attrs = {x: p.x, y: p.y, width: p.w, height: p.h, fill};
  if (p.r) attrs.rx = p.r;
  return createElement("rect", attrs);
}

export function paintCanvasPrimitive(ctx, p, foreground, background, unit) {
  ctx.fillStyle = p.role === "background" ? background : foreground;
  if (p.kind === "circle") {
    ctx.beginPath();
    ctx.arc(p.cx * unit, p.cy * unit, p.r * unit, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (p.kind === "polygon") {
    ctx.beginPath();
    p.points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x * unit, y * unit);
      else ctx.lineTo(x * unit, y * unit);
    });
    ctx.closePath();
    ctx.fill();
    return;
  }
  const x = p.x * unit, y = p.y * unit, w = p.w * unit, h = p.h * unit;
  if (p.r && typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, p.r * unit);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }
}

export function outputWidth(preset, custom = "") {
  const value = preset === "custom" ? String(custom).trim() : String(preset);
  if (!/^\d+$/.test(value)) throw new Error("Nhập kích thước ảnh bằng số pixel nguyên.");
  const width = Number(value);
  if (!Number.isSafeInteger(width) || width < 256 || width > 4096) {
    throw new Error("Kích thước QR phải từ 256 đến 4096 px.");
  }
  return width;
}

export function outputDimensions(width, qrSide, renderedHeight) {
  if (!Number.isFinite(qrSide) || qrSide <= 0 ||
      !Number.isFinite(renderedHeight) || renderedHeight <= 0) {
    throw new Error("Tỉ lệ hình QR không hợp lệ.");
  }
  const height = Math.round(renderedHeight * width / qrSide);
  if (height > 8192 || width * height > 32_000_000) {
    throw new Error("Ảnh có thêm chữ quá cao với kích thước này; chọn kích thước nhỏ hơn.");
  }
  return {width, height};
}
