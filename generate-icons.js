import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPNG(size) {
  const width = size;
  const height = size;
  
  const signature = Buffer.from([138, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  
  const ihdrChunk = makeChunk('IHDR', ihdr);
  
  // Build RGBA pixel grid
  const rawRows = [];
  const radius = size * 0.22;
  const center = size / 2;
  
  for (let y = 0; y < height; y++) {
    const row = [0]; // Filter byte (0 = None)
    for (let x = 0; x < width; x++) {
      const dx = Math.max(0, Math.abs(x - center) - (center - radius));
      const dy = Math.max(0, Math.abs(y - center) - (center - radius));
      const isInside = (dx * dx + dy * dy) <= (radius * radius);
      
      if (!isInside) {
        row.push(0, 0, 0, 0);
      } else {
        // Gradient from indigo #4f46e5 to violet #9333ea
        const t = (x + y) / (width + height);
        let r = Math.round(79 + (147 - 79) * t);
        let g = Math.round(70 + (51 - 70) * t);
        let b = Math.round(229 + (234 - 229) * t);
        
        // Center icon symbol (Context Switch arrows)
        const distCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        const inHBar = Math.abs(y - center) < Math.max(1, size * 0.08) && Math.abs(x - center) < size * 0.28;
        const inCircle = distCenter < size * 0.15;
        
        if (inHBar || inCircle) {
          r = 255;
          g = 255;
          b = 255;
        }
        
        row.push(r, g, b, 255);
      }
    }
    rawRows.push(Buffer.from(row));
  }
  
  const uncompressedData = Buffer.concat(rawRows);
  const compressedData = zlib.deflateSync(uncompressedData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconDirPublic = path.resolve(__dirname, 'public/icons');
const iconDirExt = path.resolve(__dirname, 'extension/assets');

[iconDirPublic, iconDirExt].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

[16, 32, 48, 128].forEach(size => {
  const png = createPNG(size);
  fs.writeFileSync(path.join(iconDirPublic, `icon-${size}.png`), png);
  fs.writeFileSync(path.join(iconDirExt, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png (${size}x${size})`);
});
