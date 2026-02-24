/**
 * Gera assets/icon.png — ícone 1024×1024 com coração gradiente para Mood Sharing App
 * Uso: node generate-icon.js
 * Sem dependências externas — usa apenas Node.js built-ins (zlib, fs)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 1024;

// Verifica se pixel está dentro do coração
// Fórmula: (x²+y²-1)³ ≤ x²y³
function isInsideHeart(px, py, cx, cy, scale) {
  const x = (px - cx) / scale;
  const y = -(py - cy) / scale; // inverte Y para cima = positivo
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

// Cria pixel RGB com degradê do rosa ao vermelho baseado na posição Y
function heartColor(py, cy, scale) {
  const t = Math.max(0, Math.min(1, (py - (cy - scale)) / (scale * 2)));
  // Top: rosa claro (#ff6b9d) → Bottom: vermelho (#c0392b)
  const r = Math.round(255 + (192 - 255) * t);
  const g = Math.round(107 + (57  - 107) * t);
  const b = Math.round(157 + (43  - 157) * t);
  return [r, g, b];
}

// Fundo gradiente escuro (#0d1117 → #1a1f2e)
function bgColor(py) {
  const t = py / SIZE;
  const r = Math.round(0x0d + (0x1a - 0x0d) * t);
  const g = Math.round(0x11 + (0x1f - 0x11) * t);
  const b = Math.round(0x17 + (0x2e - 0x17) * t);
  return [r, g, b];
}

// Anti-aliasing: amostra 4 sub-pixels
function samplePixel(px, py, cx, cy, scale) {
  const offsets = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]];
  let hits = 0;
  for (const [ox, oy] of offsets) {
    if (isInsideHeart(px + ox, py + oy, cx, cy, scale)) hits++;
  }
  return hits / offsets.length; // 0.0 a 1.0
}

console.log('Gerando ícone 1024×1024...');

const cx = SIZE / 2;
const cy = SIZE / 2 + SIZE * 0.04; // leve deslocamento para cima do centro visual
const scale = SIZE * 0.38;

// Montar dados de pixel (RGB, sem alpha para PNG tipo 2)
// Cada scanline: [filtro=0, R, G, B, R, G, B, ...]
const scanlines = [];

for (let py = 0; py < SIZE; py++) {
  const line = Buffer.alloc(1 + SIZE * 3);
  line[0] = 0; // filter type: None
  for (let px = 0; px < SIZE; px++) {
    const alpha = samplePixel(px, py, cx, cy, scale);
    const [hr, hg, hb] = heartColor(py, cy, scale);
    const [br, bg, bb] = bgColor(py);

    // Adiciona brilho/reflexo no topo do coração
    const highlightY = cy - scale * 0.35;
    const highlightX = cx - scale * 0.25;
    const dh = Math.sqrt((px - highlightX) ** 2 + (py - highlightY) ** 2);
    const highlight = alpha > 0 ? Math.max(0, 1 - dh / (scale * 0.55)) * 0.3 : 0;

    const r = Math.round(br + (hr - br) * alpha + 255 * highlight);
    const g = Math.round(bg + (hg - bg) * alpha + 255 * highlight);
    const b = Math.round(bb + (hb - bb) * alpha + 255 * highlight);

    const offset = 1 + px * 3;
    line[offset]     = Math.min(255, r);
    line[offset + 1] = Math.min(255, g);
    line[offset + 2] = Math.min(255, b);
  }
  scanlines.push(line);

  if (py % 128 === 0) process.stdout.write(`  ${Math.round(py / SIZE * 100)}%\r`);
}

console.log('  100% - Comprimindo...');

const rawData = Buffer.concat(scanlines);
const compressed = zlib.deflateSync(rawData, { level: 6 });

// Montar PNG
function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);  // width
ihdr.writeUInt32BE(SIZE, 4);  // height
ihdr[8]  = 8; // bit depth
ihdr[9]  = 2; // color type: RGB
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
]);

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const outPath = path.join(assetsDir, 'icon.png');
fs.writeFileSync(outPath, png);

console.log(`\nÍcone gerado: ${outPath} (${(png.length / 1024).toFixed(1)} KB)`);
