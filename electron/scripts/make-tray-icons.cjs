const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SIZE = 32;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createCanvas() {
  const stride = SIZE * 4 + 1;
  const raw = Buffer.alloc(stride * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < SIZE; x += 1) {
      setPixel(raw, x, y, 0, 0, 0, 0);
    }
  }
  return raw;
}

function setPixel(raw, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const stride = SIZE * 4 + 1;
  const offset = y * stride + 1 + x * 4;
  if (a === 255) {
    raw[offset] = r;
    raw[offset + 1] = g;
    raw[offset + 2] = b;
    raw[offset + 3] = a;
    return;
  }
  const alpha = a / 255;
  const inv = 1 - alpha;
  raw[offset] = Math.round(r * alpha + raw[offset] * inv);
  raw[offset + 1] = Math.round(g * alpha + raw[offset + 1] * inv);
  raw[offset + 2] = Math.round(b * alpha + raw[offset + 2] * inv);
  raw[offset + 3] = 255;
}

function fillCircle(raw, cx, cy, radius, r, g, b) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        setPixel(raw, x, y, r, g, b);
      }
    }
  }
}

function fillRing(raw, cx, cy, outerR, innerR, r, g, b) {
  const o2 = outerR * outerR;
  const i2 = innerR * innerR;
  for (let y = Math.floor(cy - outerR); y <= Math.ceil(cy + outerR); y += 1) {
    for (let x = Math.floor(cx - outerR); x <= Math.ceil(cx + outerR); x += 1) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      if (d2 <= o2 && d2 >= i2) {
        setPixel(raw, x, y, r, g, b);
      }
    }
  }
}

function fillEllipse(raw, cx, cy, rx, ry, r, g, b) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) {
        setPixel(raw, x, y, r, g, b);
      }
    }
  }
}

function drawArcSmile(raw, cx, cy, radius, startAngle, endAngle, r, g, b, thickness = 2) {
  for (let angle = startAngle; angle <= endAngle; angle += 0.04) {
    for (let t = 0; t < thickness; t += 1) {
      const rad = radius + t * 0.3;
      const x = Math.round(cx + Math.cos(angle) * rad);
      const y = Math.round(cy + Math.sin(angle) * rad);
      setPixel(raw, x, y, r, g, b);
    }
  }
}

function drawLine(raw, x0, y0, x1, y1, r, g, b, thickness = 1) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const steps = Math.max(dx, dy, 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    for (let ox = -thickness; ox <= thickness; ox += 1) {
      for (let oy = -thickness; oy <= thickness; oy += 1) {
        if (Math.abs(ox) + Math.abs(oy) <= thickness) {
          setPixel(raw, x + ox, y + oy, r, g, b);
        }
      }
    }
  }
}

function drawFaceBase(raw, cx, cy, radius, color) {
  fillCircle(raw, cx, cy, radius, color[0], color[1], color[2]);
  fillCircle(raw, cx - 4, cy - 4, 3, 255, 255, 255, 70);
}

/** 😊 GOOD — green, warm smile */
function drawGoodIcon() {
  const raw = createCanvas();
  drawFaceBase(raw, 16, 16, 13, [52, 199, 89]);

  fillCircle(raw, 11, 13, 2, 255, 255, 255);
  fillCircle(raw, 21, 13, 2, 255, 255, 255);
  fillCircle(raw, 11, 13, 1, 30, 41, 59);
  fillCircle(raw, 21, 13, 1, 30, 41, 59);

  drawArcSmile(raw, 16, 15, 5, 0.35, Math.PI - 0.35, 30, 41, 59, 2);
  return raw;
}

/** 👀 TOO_CLOSE — amber, wide eyes */
function drawTooCloseIcon() {
  const raw = createCanvas();
  drawFaceBase(raw, 16, 16, 13, [255, 149, 0]);

  fillEllipse(raw, 10, 13, 4, 5, 255, 255, 255);
  fillEllipse(raw, 22, 13, 4, 5, 255, 255, 255);
  fillCircle(raw, 10, 13, 2, 30, 41, 59);
  fillCircle(raw, 22, 13, 2, 30, 41, 59);
  setPixel(raw, 9, 12, 255, 255, 255);
  setPixel(raw, 21, 12, 255, 255, 255);

  fillEllipse(raw, 16, 21, 2, 1, 30, 41, 59);
  return raw;
}

/** 😣 SHOULDER_TENSION — coral, squint + frown */
function drawShoulderIcon() {
  const raw = createCanvas();
  drawFaceBase(raw, 16, 16, 13, [255, 59, 48]);

  drawLine(raw, 8, 12, 12, 14, 30, 41, 59, 1);
  drawLine(raw, 12, 14, 8, 16, 30, 41, 59, 1);
  drawLine(raw, 20, 14, 24, 12, 30, 41, 59, 1);
  drawLine(raw, 24, 12, 20, 16, 30, 41, 59, 1);

  drawArcSmile(raw, 16, 24, 4, Math.PI + 0.45, Math.PI * 2 - 0.45, 30, 41, 59, 2);

  drawLine(raw, 14, 10, 16, 9, 30, 41, 59, 0);
  drawLine(raw, 18, 9, 20, 10, 30, 41, 59, 0);
  return raw;
}

/** ⚪ IDLE — soft gray ring + neutral face */
function drawIdleIcon() {
  const raw = createCanvas();
  fillCircle(raw, 16, 16, 14, 241, 245, 249);
  fillRing(raw, 16, 16, 13, 11, 203, 213, 225);
  fillCircle(raw, 16, 16, 10, 226, 232, 240);

  fillCircle(raw, 12, 14, 1, 148, 163, 184);
  fillCircle(raw, 20, 14, 1, 148, 163, 184);
  drawLine(raw, 13, 19, 19, 19, 148, 163, 184, 0);
  return raw;
}

function encodePng(raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const ICONS = {
  "tray-good": drawGoodIcon,
  "tray-too-close": drawTooCloseIcon,
  "tray-shoulder": drawShoulderIcon,
  "tray-idle": drawIdleIcon,
};

const assetsDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(assetsDir, { recursive: true });

for (const [filename, draw] of Object.entries(ICONS)) {
  const outPath = path.join(assetsDir, `${filename}.png`);
  fs.writeFileSync(outPath, encodePng(draw()));
  console.log("[EaseUp] wrote", outPath);
}

fs.copyFileSync(
  path.join(assetsDir, "tray-good.png"),
  path.join(assetsDir, "app-icon.png"),
);
