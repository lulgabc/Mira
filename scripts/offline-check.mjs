import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'zh-CN' });
const page = await context.newPage();
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(String(error)));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '先看看示例' }).click();
await page.waitForTimeout(500);
await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
// A reload guarantees the active worker controls this document — exactly what
// an installed app has after its second launch.
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 30000 });
const scope = await page.evaluate(async () => {
  const registration = await navigator.serviceWorker.ready;
  return { scope: registration.scope, active: Boolean(registration.active) };
});

await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.locator('.bottom-nav').waitFor({ state: 'visible', timeout: 15000 });
const offline = await page.evaluate(() => ({
  title: document.title,
  lang: document.documentElement.lang,
  episodes: JSON.parse(localStorage.getItem('mira.data.v1')).episodes.length,
  nav: document.querySelector('.bottom-nav')?.innerText.replace(/\n/g, ' / '),
  controlled: Boolean(navigator.serviceWorker.controller),
}));
assert.equal(offline.episodes, 21);
assert.match(offline.nav, /今天/);
assert.deepEqual(errors.filter((message) => !message.includes('ERR_INTERNET_DISCONNECTED')), []);
console.log(JSON.stringify({ scope, offline, consoleErrors: errors }, null, 2));
console.log('Offline reload passed.');
await browser.close();
