const fs = require('fs');
const path = require('path');


const pngBase64 = `
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
`.trim();

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const iconPath = path.join(assetsDir, 'icon.png');

console.log('Creating icon using Expo...');

console.log('Note: Expo will generate the icon automatically during prebuild if it doesn\'t exist.');
console.log('For now, creating a minimal valid PNG...');

const minimalPNG = Buffer.from(pngBase64, 'base64');
fs.writeFileSync(iconPath, minimalPNG);

console.log('Minimal icon created. Expo will replace it during prebuild with proper 1024x1024 version.');
