import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const iconsDir = path.join(publicDir, 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const logoSvgPath = path.join(publicDir, 'logo.svg');

// 1. Generate standard icons
async function generateIcons() {
  try {
    console.log('Generating PWA icons from logo.svg...');

    // Standard 192x192 PNG
    await sharp(logoSvgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192.png'));
    console.log('- Created icon-192x192.png');

    // Standard 512x512 PNG
    await sharp(logoSvgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512.png'));
    console.log('- Created icon-512x512.png');

    // Apple Touch Icon (180x180 PNG)
    await sharp(logoSvgPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('- Created apple-touch-icon.png');

    // 2. Generate a maskable icon
    // A maskable icon needs padding around the logo. We'll generate it by creating a new SVG
    // that wraps the logo inside a larger dark canvas (#0d0e12) to ensure it fits the safe zone.
    const maskableSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
        <rect width="512" height="512" fill="#0d0e12" />
        <!-- Logo scaled to 70% and centered -->
        <g transform="translate(76, 76) scale(0.703)">
          <defs>
            <linearGradient id="logo-grad-mask" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#e50914" />
              <stop offset="50%" stop-color="#ff3838" />
              <stop offset="100%" stop-color="#ff7b00" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="112" fill="url(#logo-grad-mask)" />
          <text x="50%" y="56%" font-family="system-ui, -apple-system, sans-serif" font-size="280" font-weight="900" font-style="italic" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">S</text>
        </g>
      </svg>
    `;

    await sharp(Buffer.from(maskableSvg))
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512-maskable.png'));
    console.log('- Created icon-512x512-maskable.png');

    // 3. Overwrite favicon.svg with our new brand logo.svg
    fs.copyFileSync(logoSvgPath, path.join(publicDir, 'favicon.svg'));
    console.log('- Overwrote favicon.svg with custom StreamApp logo.svg');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
