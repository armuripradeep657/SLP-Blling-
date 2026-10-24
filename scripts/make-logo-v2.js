/* Replace logo with the official company badge (user-uploaded) + regenerate all PWA icons */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'upload', 'pasted_image_1792856288189.png');
const PUB = path.join(__dirname, '..', 'public');

async function squareBadge() {
  // 1. Trim the near-white canvas down to the badge bounding box
  const { data, info } = await sharp(SRC).trim({ threshold: 30 }).png().toBuffer({ resolveWithObject: true });
  console.log('trimmed:', info.width, 'x', info.height);

  // 2. Contain into a square on white — badge circle fills ~95% of the square
  const size = Math.max(info.width, info.height);
  const canvas = Math.round(size * 1.05);
  return sharp(data)
    .resize(canvas, canvas, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function main() {
  const badge = await squareBadge();

  // 3. App logo (header + thermal slip) — square JPEG on white
  await sharp(badge).resize(512, 512).jpeg({ quality: 92 }).toFile(path.join(PUB, 'narasimha-logo.jpg'));

  // 4. PWA "any" icons — white square, badge near full-bleed
  for (const size of [192, 512]) {
    await sharp(badge)
      .resize(size, size)
      .png()
      .toFile(path.join(PUB, `icon-${size}.png`));
  }

  // 5. Maskable icons — content inside 80% safe zone, white bg to the edges
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.8);
    const innerPng = await sharp(badge).resize(inner, inner).png().toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
      .composite([{ input: innerPng, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
      .png()
      .toFile(path.join(PUB, `icon-maskable-${size}.png`));
  }

  // 6. Apple touch icon + favicon
  await sharp(badge).resize(180, 180).png().toFile(path.join(PUB, 'apple-touch-icon.png'));
  await sharp(badge).resize(32, 32).png().toFile(path.join(PUB, 'favicon-32.png'));

  // Report
  for (const f of ['narasimha-logo.jpg', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png']) {
    const kb = (fs.statSync(path.join(PUB, f)).size / 1024).toFixed(1);
    console.log(`${f}: ${kb} KB`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
