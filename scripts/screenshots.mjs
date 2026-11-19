/**
 * Documentation screenshots. Run a server first:
 *   pnpm dev            # or pnpm preview
 *   BASE_URL=http://localhost:5173/ node scripts/screenshots.mjs
 */
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/';
const OUT = 'docs/screenshots';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
  colorScheme: 'light',
});
const page = await context.newPage();
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(String(error)));

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

await page.goto(BASE, { waitUntil: 'networkidle' });
await shot('01-welcome');
await page.getByRole('button', { name: '先看看示例' }).click();
await page.waitForTimeout(3000); // let the toast settle
await shot('02-today');

await page.locator('.bottom-nav button', { hasText: '日历' }).click();
await page.waitForTimeout(250);
await shot('03-calendar');

await page.locator('.bottom-nav button', { hasText: '洞察' }).click();
await page.waitForTimeout(250);
await shot('04-insights');
await page.waitForTimeout(250);
await page.evaluate(() => {
  const style = document.createElement('style');
  style.id = 'doc-hide-fixed';
  style.textContent = '.bottom-nav, .toast { display: none !important; }';
  document.head.append(style);
});
await page.locator('.chart-card').first().screenshot({ path: `${OUT}/05-insights-chart.png` });
await page.evaluate(() => document.getElementById('doc-hide-fixed')?.remove());

await page.locator('.bottom-nav button', { hasText: '今天' }).click();
await page.locator('.hero-actions .btn-primary').click();
await page.locator('dialog.sheet').waitFor({ state: 'visible' });
await page.waitForTimeout(250);
await shot('06-capture');
await page.locator('.sheet-body').evaluate((el) => {
  el.scrollTop = el.scrollHeight;
});
await page.waitForTimeout(200);
await shot('07-capture-meds');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

await page.locator('.bottom-nav button', { hasText: '设置' }).click();
await page.waitForTimeout(250);
await shot('08-settings');

await page.locator('.bottom-nav button', { hasText: '今天' }).click();
await page.evaluate(() => {
  const settings = JSON.parse(localStorage.getItem('mira.settings.v1'));
  localStorage.setItem('mira.settings.v1', JSON.stringify({ ...settings, theme: 'dark', quiet: false }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(250);
await shot('09-today-dark');

await page.locator('.header-actions .icon-btn').click();
await page.waitForTimeout(250);
await shot('10-quiet-mode');

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
