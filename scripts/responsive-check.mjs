import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [w, h] of [[320, 568], [375, 667], [430, 932], [768, 1024], [1280, 900]]) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '先看看示例' }).click();
  await page.waitForTimeout(2500);
  const widths = [];
  for (const tab of ['今天', '日历', '洞察', '设置']) {
    await page.locator('.bottom-nav button', { hasText: tab }).click();
    await page.waitForTimeout(500);
    widths.push({ tab, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth), inner: await page.evaluate(() => innerWidth) });
  }
  await page.locator('.bottom-nav button', { hasText: '今天' }).click();
  await page.locator('.hero-actions .btn-primary').click();
  await page.waitForTimeout(300);
  const sheet = await page.evaluate(() => {
    const d = document.querySelector('dialog.sheet');
    return { width: d.getBoundingClientRect().width, left: d.getBoundingClientRect().left, scrollWidth: d.scrollWidth, clientWidth: d.clientWidth };
  });
  console.log(JSON.stringify({ viewport: `${w}x${h}`, widths, sheet }));
  await context.close();
}
await browser.close();
