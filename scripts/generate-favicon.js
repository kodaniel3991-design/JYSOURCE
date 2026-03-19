const fs = require("fs");
const path = require("path");

// Minimal valid 16x16 32bpp ICO (single color block for "cube" style)
const w = 16,
  h = 16;
const headerSize = 40;
const imageSize = w * h * 4;
const maskSize = Math.ceil((w * h) / 8);
const totalImageBytes = headerSize + imageSize + maskSize;
const offset = 6 + 16;

const buf = Buffer.alloc(6 + 16 + totalImageBytes);
let pos = 0;

// ICONDIR
buf.writeUInt16LE(0, pos);
pos += 2;
buf.writeUInt16LE(1, pos);
pos += 2;
buf.writeUInt16LE(1, pos);
pos += 2;

// ICONDIRENTRY
buf[pos++] = w;
buf[pos++] = h;
buf[pos++] = 0;
buf[pos++] = 0;
buf.writeUInt16LE(1, pos);
pos += 2;
buf.writeUInt16LE(32, pos);
pos += 2;
buf.writeUInt32LE(totalImageBytes, pos);
pos += 4;
buf.writeUInt32LE(offset, pos);
pos += 4;

// BITMAPINFOHEADER
buf.writeUInt32LE(40, pos);
pos += 4;
buf.writeInt32LE(w, pos);
pos += 4;
buf.writeInt32LE(h * 2, pos);
pos += 4; // height * 2 for XOR + AND
buf.writeUInt16LE(1, pos);
pos += 2;
buf.writeUInt16LE(32, pos);
pos += 2;
buf.writeUInt32LE(0, pos);
pos += 4;
buf.writeUInt32LE(0, pos);
pos += 4;
buf.writeInt32LE(0, pos);
pos += 4;
buf.writeInt32LE(0, pos);
pos += 4;
buf.writeUInt32LE(0, pos);
pos += 4;
buf.writeUInt32LE(0, pos);
pos += 4;

// 32bpp BGRA image (rows reversed in ICO)
// Simple dark blue #1e3a5f block with rounded feel (cube-ish)
const r = 0x1e,
  g = 0x3a,
  b = 0x5f,
  a = 255;
for (let y = h - 1; y >= 0; y--) {
  for (let x = 0; x < w; x++) {
    const edge = x < 2 || x >= w - 2 || y < 2 || y >= h - 2;
    const br = edge ? Math.min(255, r + 40) : r;
    const bg = edge ? Math.min(255, g + 40) : g;
    const bb = edge ? Math.min(255, b + 40) : b;
    buf[pos++] = bb;
    buf[pos++] = bg;
    buf[pos++] = br;
    buf[pos++] = a;
  }
}

// AND mask (all 0 = no transparency in this area)
for (let i = 0; i < maskSize; i++) buf[pos++] = 0;

const outPath = path.join(__dirname, "..", "app", "favicon.ico");
fs.writeFileSync(outPath, buf);
console.log("Wrote", outPath);
