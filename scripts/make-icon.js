/* Generate desktop/icon.ico without external dependencies. */
const fs = require('fs');
const path = require('path');

const SIZE = 256;
const BG = [15, 20, 28];
const BODY = [23, 31, 43];
const ACCENT = [91, 143, 212];

function sdRoundRect(x, y, left, top, right, bottom, radius) {
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const hw = (right - left) / 2 - radius;
  const hh = (bottom - top) / 2 - radius;
  const dx = Math.max(Math.abs(x - cx) - hw, 0);
  const dy = Math.max(Math.abs(y - cy) - hh, 0);
  return Math.hypot(dx, dy) - radius;
}

function blend(target, color, alpha) {
  if (alpha <= 0) return;
  target[0] = Math.round(target[0] * (1 - alpha) + color[0] * alpha);
  target[1] = Math.round(target[1] * (1 - alpha) + color[1] * alpha);
  target[2] = Math.round(target[2] * (1 - alpha) + color[2] * alpha);
  target[3] = Math.round(target[3] * (1 - alpha) + 255 * alpha);
}

function fill(buffer, x, y, color, distance, feather) {
  if (distance > feather) return;
  const alpha = distance <= 0 ? 1 : Math.max(0, 1 - distance / feather);
  const i = (y * SIZE + x) * 4;
  const px = [buffer[i + 2], buffer[i + 1], buffer[i], buffer[i + 3]];
  blend(px, color, alpha);
  buffer[i] = px[2];
  buffer[i + 1] = px[1];
  buffer[i + 2] = px[0];
  buffer[i + 3] = px[3];
}

function draw() {
  const pixels = Buffer.alloc(SIZE * SIZE * 4, 0);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const bg = sdRoundRect(px, py, 8, 8, 248, 248, 52);
      fill(pixels, x, y, BG, bg, 1.2);
      if (bg > 0) continue;

      // Pins first so the body overlaps their inner ends.
      const pins = [];
      for (let p = 0; p < 3; p += 1) {
        const offset = 84 + p * 44;
        pins.push(sdRoundRect(px, py, 30, offset, 58, offset + 14, 5));
        pins.push(sdRoundRect(px, py, 198, offset, 226, offset + 14, 5));
        pins.push(sdRoundRect(px, py, offset, 30, offset + 14, 58, 5));
        pins.push(sdRoundRect(px, py, offset, 198, offset + 14, 226, 5));
      }
      for (const d of pins) fill(pixels, x, y, ACCENT, d, 1);

      const body = sdRoundRect(px, py, 56, 56, 200, 200, 24);
      if (body <= 0) fill(pixels, x, y, BODY, body, 1);
      const outline = Math.abs(body) - 4;
      if (outline <= 0) fill(pixels, x, y, ACCENT, outline, 1);

      const core = sdRoundRect(px, py, 102, 102, 154, 154, 10);
      if (core <= 0) fill(pixels, x, y, BODY, core, 1);
      const coreOutline = Math.abs(core) - 4;
      if (coreOutline <= 0) fill(pixels, x, y, ACCENT, coreOutline, 1);
    }
  }
  return pixels;
}

function makeIco(pixels) {
  const maskRow = Math.ceil(SIZE / 32) * 4;
  const maskSize = maskRow * SIZE;
  const pixelSize = SIZE * SIZE * 4;
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(SIZE, 4);
  header.writeInt32LE(SIZE * 2, 8); // XOR + AND
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(pixelSize, 20);

  // BMP rows are bottom-up.
  const xor = Buffer.alloc(pixelSize);
  for (let y = 0; y < SIZE; y += 1) {
    const sourceRow = y;
    const targetRow = SIZE - 1 - y;
    pixels.copy(xor, targetRow * SIZE * 4, sourceRow * SIZE * 4, (sourceRow + 1) * SIZE * 4);
  }
  const mask = Buffer.alloc(maskSize);
  const image = Buffer.concat([header, xor, mask]);

  const dir = Buffer.alloc(6 + 16);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(1, 4);
  dir.writeUInt8(0, 6);
  dir.writeUInt8(0, 7);
  dir.writeUInt8(0, 8);
  dir.writeUInt8(0, 9);
  dir.writeUInt16LE(1, 10);
  dir.writeUInt16LE(32, 12);
  dir.writeUInt32LE(image.length, 14);
  dir.writeUInt32LE(22, 18);
  return Buffer.concat([dir, image]);
}

const out = path.join(__dirname, '..', 'desktop', 'icon.ico');
fs.writeFileSync(out, makeIco(draw()));
console.log('Wrote ' + out + ' (' + fs.statSync(out).size + ' bytes)');
