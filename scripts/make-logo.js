/* Generate Narasimha Swamy logo + PWA icons (blue/white theme) */
const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, 'nar-2.jpg');
const PUB = path.join(__dirname, '..', 'public');

async function main() {
  // 1. Square crop centered on the deity (face + crown + upper garland)
  // Original 1242x1656; face center ~ (621, 610)
  const cropSize = 780;
  const left = Math.max(0, Math.round(621 - cropSize / 2));
  const top = Math.max(0, Math.round(610 - cropSize / 2));
  const cropped = sharp(SRC).extract({ left, top, width: cropSize, height: cropSize });

  // 2. App logo: square with slight rounded feel (white bg for slip print)
  await cropped
    .clone()
    .resize(256, 256, { fit: 'cover' })
    .jpeg({ quality: 88 })
    .toFile(path.join(PUB, 'narasimha-logo.jpg'));

  // 3. PWA icons: blue-700 background circle + circular deity image
  const blue = '#1d4ed8';
  for (const size of [192, 512]) {
    const circlePng = await cropped
      .clone()
      .resize(Math.round(size * 0.72), Math.round(size * 0.72), { fit: 'cover' })
      .toBuffer();
    const inner = Math.round(size * 0.72);
    const mask = Buffer.from(
      `<svg width="${inner}" height="${inner}"><circle cx="${inner / 2}" cy="${inner / 2}" r="${inner / 2}" fill="#fff"/></svg>`
    );
    const roundImg = await sharp(circlePng)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
    const bgSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${blue}"/></svg>`
    );
    await sharp(bgSvg)
      .composite([
        { input: roundImg, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) },
      ])
      .png()
      .toFile(path.join(PUB, `icon-${size}.png`));
    // maskable: content within 80% safe zone
    const innerSz = Math.round(size * 0.72);
    const maskSafe = Buffer.from(
      `<svg width="${innerSz}" height="${innerSz}"><circle cx="${innerSz / 2}" cy="${innerSz / 2}" r="${innerSz / 2}" fill="#fff"/></svg>`
    );
    const roundSafe = await sharp(
      await cropped.clone().resize(Math.round(size * 0.72), Math.round(size * 0.72), { fit: 'cover' }).toBuffer()
    )
      .composite([{ input: maskSafe, blend: 'dest-in' }])
      .png()
      .toBuffer();
    await sharp(bgSvg)
      .composite([{ input: roundSafe, left: Math.round(size * 0.14), top: Math.round(size * 0.14) }])
      .png()
      .toFile(path.join(PUB, `icon-maskable-${size}.png`));
  }

  // 4. apple-touch-icon 180 + favicon 32
  const appleInner = 140;
  const appleRound = await sharp(
    await cropped.clone().resize(appleInner, appleInner, { fit: 'cover' }).toBuffer()
  )
    .composite([
      {
        input: Buffer.from(
          `<svg width="${appleInner}" height="${appleInner}"><circle cx="${appleInner / 2}" cy="${appleInner / 2}" r="${appleInner / 2}" fill="#fff"/></svg>`
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
  await sharp(Buffer.from(`<svg width="180" height="180"><rect width="180" height="180" fill="${blue}"/></svg>`))
    .composite([{ input: appleRound, left: 20, top: 20 }])
    .png()
    .toFile(path.join(PUB, 'apple-touch-icon.png'));

  await sharp(path.join(PUB, 'icon-192.png')).resize(32, 32).png().toFile(path.join(PUB, 'favicon-32.png'));

  console.log('Logo + icons generated OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
