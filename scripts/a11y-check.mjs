import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
const page = await context.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
const results = [];
const run = async (label) => {
  const result = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const axeResult = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
    return axeResult.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.slice(0, 5).map((node) => ({ target: node.target, summary: node.failureSummary })),
    }));
  });
  results.push({ label, violations: result });
};
await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
await run('welcome');

await page.getByRole('button', { name: '先看看示例' }).click();
await page.waitForTimeout(2900);
await run('today');
await page.locator('.bottom-nav button', { hasText: '日历' }).click();
await page.waitForTimeout(650);
await run('calendar');
await page.locator('.bottom-nav button', { hasText: '洞察' }).click();
await page.waitForTimeout(650);
await run('insights');
await page.locator('.bottom-nav button', { hasText: '设置' }).click();
await page.waitForTimeout(650);
await run('settings');
await page.locator('.bottom-nav button', { hasText: '今天' }).click();
await page.locator('.hero-actions .btn-primary').click();
await page.waitForTimeout(300);
await run('capture');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// Dark theme.
await page.evaluate(() => {
  const settings = JSON.parse(localStorage.getItem('mira.settings.v1'));
  localStorage.setItem('mira.settings.v1', JSON.stringify({ ...settings, theme: 'dark', quiet: false }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
await page.waitForTimeout(600);
await run('today-dark');
await page.locator('.bottom-nav button', { hasText: '洞察' }).click();
await page.waitForTimeout(650);
await run('insights-dark');
await page.locator('.hero-actions .btn-primary').click().catch(async () => {
  await page.locator('.bottom-nav button', { hasText: '今天' }).click();
  await page.locator('.hero-actions .btn-primary').click();
});
await page.waitForTimeout(650);
await run('capture-dark');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// Quiet mode.
await page.locator('.header-actions .icon-btn').click();
await page.waitForTimeout(650);
await run('today-quiet');
await page.locator('.hero-actions .btn-primary').click();
await page.waitForTimeout(650);
await run('capture-quiet');

console.log(JSON.stringify(results, null, 2));
await browser.close();
