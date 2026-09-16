import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function writeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const rawRows = Buffer.alloc((stride + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawRows[rowOffset] = 0; // filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      const dx = (x - cx) / width;
      const dy = (y - cy) / height;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep Google Blue gradient background
      const gradY = y / height;
      let rVal = Math.round(26 + gradY * (13 - 26));
      let gVal = Math.round(115 + gradY * (71 - 115));
      let bVal = Math.round(232 + gradY * (161 - 232));
      let aVal = 255;

      if (!isMaskable) {
        // Rounded corners for normal icon
        const cornerR = width * 0.22;
        const inLeft = x < cornerR;
        const inRight = x > width - cornerR;
        const inTop = y < cornerR;
        const inBottom = y > height - cornerR;

        if ((inLeft || inRight) && (inTop || inBottom)) {
          const cornerCx = inLeft ? cornerR : width - cornerR;
          const cornerCy = inTop ? cornerR : height - cornerR;
          const cDist = Math.hypot(x - cornerCx, y - cornerCy);
          if (cDist > cornerR) {
            aVal = 0;
          }
        }
      }

      // Draw stylized shield inside
      const scale = isMaskable ? 0.72 : 0.85;
      const sx = (x - cx) / (width * scale);
      const sy = (y - cy) / (height * scale) + 0.05;

      if (aVal > 0 && Math.abs(sx) < 0.35 && sy > -0.32 && sy < 0.38) {
        // Shield curve test
        const shieldWidthAtY = sy < 0 ? 0.35 : 0.35 * (1 - Math.pow((sy / 0.38), 2) * 0.9);
        if (Math.abs(sx) < shieldWidthAtY) {
          // White shield body
          rVal = 255;
          gVal = 255;
          bVal = 255;

          // Inner lock
          if (Math.abs(sx) < 0.12 && sy > 0.02 && sy < 0.22) {
            rVal = 26;
            gVal = 115;
            bVal = 232;
          } else if (Math.abs(sx) < 0.08 && sy >= -0.10 && sy <= 0.02) {
            // Lock shackle
            const shackleDist = Math.hypot(sx, sy + 0.02);
            if (shackleDist < 0.09 && shackleDist > 0.04) {
              rVal = 26;
              gVal = 115;
              bVal = 232;
            }
          }
        }
      }

      rawRows[px] = rVal;
      rawRows[px + 1] = gVal;
      rawRows[px + 2] = bVal;
      rawRows[px + 3] = aVal;
    }
  }

  const compressed = zlib.deflateSync(rawRows, { level: 9 });

  return Buffer.concat([
    signature,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', compressed),
    writeChunk('IEND', Buffer.alloc(0))
  ]);
}

const outDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, false));

console.log('PWA PNG Icons successfully generated!');
