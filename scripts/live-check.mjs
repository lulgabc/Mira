import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const BASE = process.env.LIVE_URL ?? 'https://lulgabc.github.io/Mira/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
const page = await context.newPage();
const errors = [];
const badResponses = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
page.on('response', (r) => { if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`); });

await page.goto(BASE, { waitUntil: 'networkidle' });
const title = await page.title();
await page.getByRole('button', { name: '先看看示例' }).click();
await page.waitForTimeout(2800);

const manifestHref = await page.locator('link[rel=manifest]').getAttribute('href');
const manifestUrl = new URL(manifestHref, page.url()).href;
const manifestResponse = await context.request.get(manifestUrl);
const manifest = await manifestResponse.json();
const iconStatuses = [];
for (const icon of manifest.icons) {
  const iconUrl = new URL(icon.src, manifestUrl).href;
  iconStatuses.push({ src: icon.src, status: (await context.request.get(iconUrl)).status() });
}

await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await page.reload({ waitUntil: 'networkidle' });
const sw = await page.evaluate(async () => {
  const registration = await navigator.serviceWorker.ready;
  return { scope: registration.scope, controller: Boolean(navigator.serviceWorker.controller) };
});
await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.locator('.bottom-nav').waitFor({ state: 'visible', timeout: 20000 });
const offline = await page.evaluate(() => ({
  episodes: JSON.parse(localStorage.getItem('mira.data.v1')).episodes.length,
  nav: document.querySelector('.bottom-nav')?.innerText.replace(/\n/g, ' / '),
  controller: Boolean(navigator.serviceWorker.controller),
}));
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
assert.equal(manifestResponse.status(), 200);
assert.ok(iconStatuses.every((i) => i.status === 200));
assert.equal(sw.controller, true);
assert.equal(offline.episodes, 21);
assert.deepEqual(errors, []);
assert.deepEqual(badResponses, []);
console.log(JSON.stringify({ url: BASE, title, manifestStatus: manifestResponse.status(), manifestStart: manifest.start_url, manifestScope: manifest.scope, iconStatuses, sw, offline, errors, badResponses }, null, 2));
await browser.close();
