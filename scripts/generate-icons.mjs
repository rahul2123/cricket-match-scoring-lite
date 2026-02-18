import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const icons = [
  { svg: 'pwa-192x192.svg', png: 'pwa-192x192.png', size: 192 },
  { svg: 'pwa-512x512.svg', png: 'pwa-512x512.png', size: 512 },
];

async function convertSvgToPng(svgPath, pngPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    console.log(`Created: ${pngPath}`);
  } catch (error) {
    console.error(`Error creating ${pngPath}:`, error.message);
  }
}

async function main() {
  for (const icon of icons) {
    const svgPath = join(publicDir, icon.svg);
    const pngPath = join(publicDir, icon.png);
    await convertSvgToPng(svgPath, pngPath, icon.size);
  }
  console.log('Done!');
}

main();
