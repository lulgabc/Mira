import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(String(error)));

const data = () => page.evaluate(() => JSON.parse(localStorage.getItem('mira.data.v1')));
const step = (name) => console.log(`ok — ${name}`);

await page.goto(BASE, { waitUntil: 'networkidle' });
assert.equal(await page.locator('.welcome-select option').count(), 9);
await page.locator('.welcome-select').selectOption('fr');
await page.waitForFunction(() => document.documentElement.lang === 'fr-FR');
assert.match(await page.locator('.welcome-title').innerText(), /Bienvenue/);
await page.locator('.welcome-select').selectOption('zh');
await page.waitForFunction(() => document.documentElement.lang === 'zh-CN');
await page.getByRole('button', { name: '先看看示例' }).click();
await page.waitForFunction(() => JSON.parse(localStorage.getItem('mira.data.v1') || '{}').episodes?.length > 10);
assert.equal((await data()).episodes.length, 21);
const orbAnimation = async () =>
  page.evaluate(() => {
    const orb = document.querySelector('.orb');
    return orb ? getComputedStyle(orb, '::before').animationName : 'none';
  });
assert.equal(await orbAnimation(), 'orb-spin');
const orbTransformA = await page.evaluate(() => getComputedStyle(document.querySelector('.orb'), '::before').transform);
await page.waitForTimeout(600);
const orbTransformB = await page.evaluate(() => getComputedStyle(document.querySelector('.orb'), '::before').transform);
assert.notEqual(orbTransformA, orbTransformB);
step('onboarding + sample data + animated orb');

// Capture a new ongoing attack at severity 10 with symptoms, trigger, and medication.
await page.locator('.hero-actions .btn-primary').click();
await page.locator('dialog.sheet').waitFor({ state: 'visible' });
await page.locator('.dial').focus();
await page.keyboard.press('End');
assert.equal(await page.locator('.dial-value').innerText(), '10');
await page.getByRole('button', { name: '恶心' }).click();
await page.getByRole('tab', { name: /可能诱因/ }).click();
await page.getByRole('button', { name: '压力' }).click();
await page.locator('.chip-grid').last().scrollIntoViewIfNeeded();
await page.waitForTimeout(150);
const medScrollBefore = await page.evaluate(() => ({
  dialog: document.querySelector('dialog.sheet')?.scrollTop,
  body: document.querySelector('.sheet-body')?.scrollTop,
  foot: document.querySelector('.sheet-foot')?.getBoundingClientRect().top,
}));
await page.locator('.chip-grid .chip', { hasText: '布洛芬' }).click();
await page.waitForTimeout(200);
const medScrollAfter = await page.evaluate(() => ({
  dialog: document.querySelector('dialog.sheet')?.scrollTop,
  body: document.querySelector('.sheet-body')?.scrollTop,
  foot: document.querySelector('.sheet-foot')?.getBoundingClientRect().top,
}));
assert.equal(medScrollAfter.dialog, 0);
assert.ok(Math.abs(medScrollAfter.body - medScrollBefore.body) < 2);
assert.ok(Math.abs(medScrollAfter.foot - medScrollBefore.foot) < 2);
const scrollAfter = await page.evaluate(() => {
  const body = document.querySelector('.sheet-body');
  body.scrollTop = 0;
  const min = body.scrollTop;
  body.scrollTop = 120;
  return { min, value: body.scrollTop };
});
assert.equal(scrollAfter.min, 0);
assert.ok(scrollAfter.value > 100);
await page.locator('.selected-meds .input').fill('400 mg');
await page.locator('.selected-meds .select').selectOption('2');
await page.locator('.sheet-foot .btn-primary').click();
await page.locator('dialog.sheet').waitFor({ state: 'detached' });
await page.waitForFunction(() => JSON.parse(localStorage.getItem('mira.data.v1')).episodes.length === 22);
const created = (await data()).episodes[0];
assert.equal(created.severity, 10);
assert.equal(created.end, undefined);
assert.deepEqual(created.symptomIds, ['sym-nausea']);
assert.deepEqual(created.triggerIds, ['trg-stress']);
assert.equal(created.meds[0].dose, '400 mg');
assert.equal(created.meds[0].relief, 2);
step('capture attack with dial + chips + medication (no scroll jump)');

await page.locator('.active-card').waitFor({ state: 'visible' });
await page.waitForTimeout(1100);
assert.match(await page.locator('.active-timer').innerText(), /^\d{2}:\d{2}$/);
step('live ongoing timer');

// Quick medication.
await page.locator('.active-actions .btn-soft').click();
await page.locator('dialog.sheet').waitFor({ state: 'visible' });
await page.locator('.quick-row', { hasText: '对乙酰氨基酚' }).locator('.med-option').click();
await page.locator('.quick-row', { hasText: '对乙酰氨基酚' }).locator('input.input').fill('500 mg');
await page.locator('.sheet-foot .btn-primary').click();
await page.locator('dialog.sheet').waitFor({ state: 'detached' });
await page.waitForFunction(() => {
  const episode = JSON.parse(localStorage.getItem('mira.data.v1')).episodes[0];
  return episode.meds.length === 2;
});
step('quick medication');

// End the attack.
await page.getByRole('button', { name: '结束发作' }).click();
await page.waitForFunction(() => Boolean(JSON.parse(localStorage.getItem('mira.data.v1')).episodes[0].end));
step('end ongoing attack');

// Calendar shows the new attack and opens its editor.
await page.locator('.bottom-nav button', { hasText: '日历' }).click();
await page.locator('.cal-cell.is-today').click();
await page.locator('.day-panel .episode-row').first().click();
await page.locator('dialog.sheet').waitFor({ state: 'visible' });
await page.locator('.dial').focus();
await page.keyboard.press('Home');
await page.locator('.sheet-foot .btn-primary').click();
await page.locator('dialog.sheet').waitFor({ state: 'detached' });
await page.waitForFunction(() => JSON.parse(localStorage.getItem('mira.data.v1')).episodes[0].severity === 1);
step('calendar day view + edit severity');

// Delete the new entry using the two-step confirmation.
await page.locator('.day-panel .episode-row').first().click();
await page.locator('dialog.sheet').waitFor({ state: 'visible' });
await page.locator('.sheet-foot .icon-btn').click();
await page.locator('.sheet-foot .btn-danger').click();
await page.locator('dialog.sheet').waitFor({ state: 'detached' });
await page.waitForFunction(() => JSON.parse(localStorage.getItem('mira.data.v1')).episodes.length === 21);
step('delete entry');

// Insights renders the chart and rankings.
await page.locator('.bottom-nav button', { hasText: '洞察' }).click();
await page.locator('.chart-card').first().waitFor({ state: 'visible' });
assert.equal(await page.locator('.chart').count(), 1);
assert.equal(await page.locator('.chart .bar').count() > 0, true);
assert.match(await page.locator('.insight-text').innerText(), /发作日/);
step('insights chart + narrative');

// Language switching.
await page.locator('.bottom-nav button', { hasText: '设置' }).click();
assert.equal(await page.locator('.lang-select option').count(), 9);
await page.locator('.lang-select').selectOption('en');
await page.waitForFunction(() => document.documentElement.lang.startsWith('en'));
assert.match(await page.locator('.page-title').innerText(), /Settings/);
assert.match(await page.locator('.bottom-nav').innerText(), /Insights/);
await page.locator('.lang-select').selectOption('fr');
await page.waitForFunction(() => document.documentElement.lang.startsWith('fr'));
assert.match(await page.locator('.page-title').innerText(), /Réglages/);
await page.locator('.lang-select').selectOption('ja');
await page.waitForFunction(() => document.documentElement.lang.startsWith('ja'));
assert.match(await page.locator('.page-title').innerText(), /設定/);
await page.locator('.lang-select').selectOption('zh-Hant');
await page.waitForFunction(() => document.documentElement.lang === 'zh-TW');
assert.match(await page.locator('.page-title').innerText(), /設定/);
await page.locator('.lang-select').selectOption('zh');
await page.waitForFunction(() => document.documentElement.lang === 'zh-CN');
step('language switching zh → en → fr → ja → zh-Hant → zh');

// Theme + quiet mode.
await page.getByRole('button', { name: '深色' }).click();
await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
await page.locator('.quiet-toggle').click();
await page.waitForFunction(() => document.documentElement.dataset.quiet === 'true');
assert.equal(await orbAnimation(), 'none');
await page.getByRole('button', { name: '退出静息模式' }).first().click();
await page.waitForFunction(() => !document.documentElement.dataset.quiet);
await page.getByRole('button', { name: '跟随系统' }).click();
await page.waitForFunction(() => document.documentElement.dataset.theme !== '');
step('theme + quiet mode');

// Export a backup.
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: '导出备份' }).click();
const download = await downloadPromise;
assert.match(download.suggestedFilename(), /^mira-backup-\d{4}-\d{2}-\d{2}\.json$/);
const backupPath = await download.path();
const backup = JSON.parse(await readFile(backupPath, 'utf8'));
assert.equal(backup.app, 'mira');
assert.equal(backup.data.episodes.length, 21);
step('export backup JSON');

// Persistence across reload.
await page.reload({ waitUntil: 'networkidle' });
assert.equal((await data()).episodes.length, 21);
step('persistence across reload');

// Catalog management: add, rename, archive.
await page.locator('.bottom-nav button', { hasText: '设置' }).click();
await page.locator('.catalog-row', { hasText: '药物' }).click();
await page.locator('.catalog-add .input').fill('Test Med');
await page.locator('.catalog-add .btn').click();
await page.waitForFunction(() => JSON.parse(localStorage.getItem('mira.data.v1')).meds.some((med) => med.label === 'Test Med'));
await page.locator('.catalog-item', { hasText: 'Test Med' }).getByRole('button', { name: '重命名 Test Med' }).click();
await page.locator('.catalog-edit .input').fill('Test Med 2');
await page.locator('.catalog-edit .btn-soft').click();
await page.waitForFunction(() => JSON.parse(localStorage.getItem('mira.data.v1')).meds.some((med) => med.label === 'Test Med 2'));
await page.locator('.catalog-item', { hasText: 'Test Med 2' }).getByRole('button', { name: '删除 Test Med 2' }).click();
await page.locator('.catalog-confirm .confirm').click();
await page.waitForFunction(() => JSON.parse(localStorage.getItem('mira.data.v1')).meds.some((med) => med.label === 'Test Med 2' && med.archived === true));
await page.keyboard.press('Escape');
step('catalog add / rename / archive');

// Import a one-entry backup.
const imported = await data();
const start = new Date();
start.setHours(9, 30, 0, 0);
imported.episodes = [{
  id: 'imported_1',
  start: start.toISOString(),
  end: new Date(start.getTime() + 90 * 60000).toISOString(),
  severity: 4,
  symptomIds: ['sym-nausea'],
  triggerIds: [],
  meds: [],
  createdAt: start.toISOString(),
  updatedAt: start.toISOString(),
}];
const importPath = '/tmp/mira-import.json';
await writeFile(importPath, JSON.stringify({ app: 'mira', version: 1, exportedAt: new Date().toISOString(), data: imported }));
await page.locator('input[type=file]').setInputFiles(importPath);
await page.waitForFunction(() => JSON.parse(localStorage.getItem('mira.data.v1')).episodes.length === 1 && JSON.parse(localStorage.getItem('mira.data.v1')).episodes[0].id === 'imported_1');
step('import backup');

// Reset all data.
await page.getByRole('button', { name: '清空数据' }).click();
await page.locator('.inline-confirm .confirm').click();
await page.waitForFunction(() => JSON.parse(localStorage.getItem('mira.data.v1')).episodes.length === 0);
step('reset data');

// Future timestamps are rejected.
await page.locator('.bottom-nav button', { hasText: '今天' }).click();
await page.locator('.hero-actions .btn-primary').click();
await page.locator('dialog.sheet').waitFor({ state: 'visible' });
const future = new Date(Date.now() + 86_400_000);
const pad = (n) => String(n).padStart(2, '0');
const futureValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T10:00`;
await page.locator('.field-grid .input').first().fill(futureValue);
await page.locator('.sheet-foot .btn-primary').click();
await page.locator('.form-error').waitFor({ state: 'visible' });
assert.match(await page.locator('.form-error').innerText(), /现在|未来/);
await page.keyboard.press('Escape');
step('reject future timestamps');

// Quiet mode persists across reload and removes secondary content.
await page.locator('.quiet-toggle').click();
await page.waitForFunction(() => document.documentElement.dataset.quiet === 'true');
assert.equal(await page.locator('.stat-strip').count(), 0);
assert.equal(await page.locator('.section').count(), 0);
assert.equal(await page.locator('.quiet-toggle').isVisible(), false);
assert.equal(await page.locator('.quiet-title').isVisible(), true);
assert.equal(await page.locator('.quiet-today .card').count(), 0);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.dataset.quiet === 'true');
assert.equal(await page.locator('.stat-strip').count(), 0);
await page.getByRole('button', { name: '退出静息模式' }).first().click();
await page.waitForTimeout(200);
assert.equal(await page.locator('.stat-strip').isVisible(), true);
step('quiet mode persistence + minimal layout');

// Manifest and icons.
const manifestUrl = new URL('manifest.webmanifest', BASE);
const manifest = await context.request.get(manifestUrl.href);
assert.equal(manifest.status(), 200);
const manifestJson = await manifest.json();
assert.equal(manifestJson.short_name, 'Mira');
for (const icon of manifestJson.icons) {
  const response = await context.request.get(new URL(icon.src, manifestUrl).href);
  assert.equal(response.status(), 200, icon.src);
}
step('web app manifest + icons');

// PWA shortcut opens capture.
await page.goto(`${BASE}?capture=1`, { waitUntil: 'networkidle' });
await page.locator('dialog.sheet').waitFor({ state: 'visible' });
step('capture shortcut opens sheet');
await page.keyboard.press('Escape');

assert.deepEqual(errors, []);
console.log('\nAll checks passed. No console errors.');
await browser.close();
