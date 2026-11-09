import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const popup = page.locator('[aria-label="Install app notification"]');
  if (await popup.count()) await popup.getByRole('button', { name: 'Close install notification' }).click();
  await page.locator('button', { hasText: '+2FT' }).first().click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: '+3FT' }).first().click();
  await page.waitForTimeout(600);
  // scroll to the inline panel and shoot two frames
  await page.locator('#current-bill').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/z/my-project/download/v18-inline-items.png' });
  const panel = page.locator('#current-bill');
  await panel.evaluate((el) => el.scrollIntoView({ block: 'end' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/home/z/my-project/download/v18-inline-bottom.png' });
  await browser.close();
  console.log('done');
};
run();
