import { chromium } from 'playwright';
import QRCode from 'qrcode';

// minimal probe: does svg-data-url -> Image -> canvas -> ZXing decode crash
// this Chromium in isolation? Uses an APP-IDENTICAL svg (same encoder/options).
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage();
page.on('crash', () => console.log('CRASH happened'));
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 150)));
await page.goto('about:blank');
const svg = await QRCode.toString('upi://pay?pa=slpcement@ybl&am=200&cu=INR', {
  type: 'svg', margin: 1, width: 180, errorCorrectionLevel: 'M',
  color: { dark: '#111111', light: '#ffffff' },
});
console.log('svg head:', svg.slice(0, 160).replace(/\n/g, ' '), 'len=', svg.length);
try {
  const out = await page.evaluate(async (svgXml) => {
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgXml)));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const canvas = document.createElement('canvas');
    canvas.width = img.width * 3 + 60;
    canvas.height = img.height * 3 + 60;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 30, 30, img.width * 3, img.height * 3);
    const padded = new Image();
    padded.src = canvas.toDataURL('image/png');
    await new Promise((res, rej) => { padded.onload = res; padded.onerror = rej; });
    return { w: img.width, h: img.height, png: padded.src.length };
  }, svg);
  console.log('raster OK', JSON.stringify(out));
} catch (e) {
  console.log('raster FAILED:', String(e).slice(0, 200));
}
try {
  await page.addScriptTag({ path: '/home/z/my-project/node_modules/@zxing/library/umd/index.min.js' });
  const dec = await page.evaluate(async (svgXml) => {
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgXml)));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const canvas = document.createElement('canvas');
    canvas.width = img.width * 3 + 60;
    canvas.height = img.height * 3 + 60;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 30, 30, img.width * 3, img.height * 3);
    const padded = new Image();
    padded.src = canvas.toDataURL('image/png');
    await new Promise((res, rej) => { padded.onload = res; padded.onerror = rej; });
    try {
      const reader = new ZXing.BrowserQRCodeReader();
      const res = await reader.decodeFromImage(padded);
      return { text: res.getText() };
    } catch (e2) {
      return { err: String(e2 && e2.message ? e2.message : e2).slice(0, 100) };
    }
  }, svg);
  console.log('decode step OK (err expected for blank pattern):', JSON.stringify(dec));
} catch (e) {
  console.log('decode step FAILED:', String(e).slice(0, 200));
}
console.log('probe finished without destroying the context');
await browser.close();
