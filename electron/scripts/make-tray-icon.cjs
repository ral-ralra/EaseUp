const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

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

function setPixel(raw, width, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= width || y >= width) {
    return;
  }
  const stride = width * 4 + 1;
  const offset = y * stride + 1 + x * 4;
  raw[offset] = r;
  raw[offset + 1] = g;
  raw[offset + 2] = b;
  raw[offset + 3] = a;
}

function fillCircle(raw, width, cx, cy, radius, r, g, b) {
  for (let y = 0; y < width; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(raw, width, x, y, r, g, b);
      }
    }
  }
}

function drawFaceIcon(bgColor, mouthCurve) {
  const size = 32;
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);

  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      setPixel(raw, size, x, y, 248, 250, 252);
    }
  }

  fillCircle(raw, size, 16, 16, 13, bgColor[0], bgColor[1], bgColor[2]);
  setPixel(raw, size, 11, 12, 15, 23, 42);
  setPixel(raw, size, 12, 12, 15, 23, 42);
  setPixel(raw, size, 20, 12, 15, 23, 42);
  setPixel(raw, size, 21, 12, 15, 23, 42);

  for (let x = 10; x <= 22; x += 1) {
    const offset = Math.abs(x - 16);
    const y = 20 + mouthCurve(offset);
    setPixel(raw, size, x, y, 15, 23, 42);
    setPixel(raw, size, x, y + 1, 15, 23, 42);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const MOODS = {
  "tray-happy": { color: [95, 207, 155], mouth: (offset) => Math.floor((offset * offset) / 18) },
  "tray-smile": { color: [245, 196, 81], mouth: (offset) => Math.floor(offset / 4) },
  "tray-neutral": { color: [245, 158, 11], mouth: () => 0 },
  "tray-tired": { color: [255, 122, 107], mouth: (offset) => -Math.floor((offset * offset) / 20) },
  "tray-idle": { color: [203, 213, 225], mouth: () => 0 },
};

const assetsDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(assetsDir, { recursive: true });

for (const [filename, config] of Object.entries(MOODS)) {
  fs.writeFileSync(
    path.join(assetsDir, `${filename}.png`),
    drawFaceIcon(config.color, config.mouth),
  );
}

fs.copyFileSync(
  path.join(assetsDir, "tray-happy.png"),
  path.join(assetsDir, "tray-icon.png"),
);
