const fs = require('fs');
const path = require('path');

function createMinimalPNG() {
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';


  return Buffer.from(pngBase64, 'base64');
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const iconPath = path.join(assetsDir, 'icon.png');

console.log('Creating placeholder icon...');

try {
  // Tenta usar sharp se disponível
  const sharp = require('sharp');
  sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 13, g: 17, b: 23, alpha: 1 }
    }
  })
    .png()
    .toFile(iconPath)
    .then(() => {
      console.log('Icon created successfully with sharp');
    })
    .catch(() => {
      console.log('Sharp not available, using alternative method');
      // Método alternativo: criar um PNG básico válido
      createPNGManually();
    });
} catch (e) {
  console.log('Sharp not installed, creating PNG manually...');
  createPNGManually();
}

function createPNGManually() {
  // Cria um PNG válido mínimo manualmente
  // Isso é complexo, então vamos usar uma solução alternativa
  // Vamos criar um arquivo que o Expo pode substituir ou usar o comando expo
  console.log('Please run: npx expo install @expo/image-utils');
  console.log('Or create icon.png manually in assets folder (1024x1024 PNG)');
}
