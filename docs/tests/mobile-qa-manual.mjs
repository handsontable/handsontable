import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = 'http://127.0.0.1:4321/docs/javascript-data-grid/';
const iPhoneSE = { width: 375, height: 667 };
const results = [];
const screenshotDir = '/tmp/claude-0/-home-user-handsontable/697f7ccf-49a7-54f9-9303-bcf0cb83c933/scratchpad/screenshots';
fs.mkdirSync(screenshotDir, { recursive: true });

function log(item, pass, detail) {
  results.push({ item, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${item} — ${detail}`);
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
const context = await browser.newContext({
  viewport: iPhoneSE,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

const consoleErrors = [];
page.on('pageerror', (err) => consoleErrors.push(err.message));

// 1. Open docs on iPhone SE (375px)
await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(1000);
const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
const hasHorizontalScroll = bodyWidth > iPhoneSE.width + 2;
await page.screenshot({ path: `${screenshotDir}/01-initial-load.png` });
log('Open docs on iPhone SE (375px)', !hasHorizontalScroll, `page loaded, body.scrollWidth=${bodyWidth}px (viewport ${iPhoneSE.width}px), no unwanted horizontal scroll: ${!hasHorizontalScroll}`);

// 2. Sidebar drawable/hamburger menu
const hamburgerBtn = page.locator('.mobile-menu-btn');
const hamburgerVisible = await hamburgerBtn.isVisible();
await hamburgerBtn.click();
await page.waitForTimeout(400);
const overlay = page.locator('#mobile-nav-overlay, .mobile-nav-overlay');
const overlayVisibleAfterOpen = await overlay.first().isVisible().catch(() => false);
await page.screenshot({ path: `${screenshotDir}/02-hamburger-open.png` });
await hamburgerBtn.click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${screenshotDir}/02c-hamburger-after-close-click.png` });
const overlayVisibleAfterClose = await overlay.first().isVisible().catch(() => false);
const overlayHiddenAttr = await overlay.first().getAttribute('hidden').catch(() => null);
log('Sidebar drawable/hamburger menu', hamburgerVisible && overlayVisibleAfterOpen && (!overlayVisibleAfterClose || overlayHiddenAttr !== null),
  `hamburger visible=${hamburgerVisible}, overlay opens=${overlayVisibleAfterOpen}, overlay closes=${overlayVisibleAfterClose}, hidden-attr-after-close=${overlayHiddenAttr}`);

// Also test the mobile sidebar toggle (left nav / TOC), not just main hamburger
const sidebarToggle = page.locator('.mobile-sidebar-toggle');
const sidebarToggleVisible = await sidebarToggle.isVisible().catch(() => false);
if (sidebarToggleVisible) {
  await sidebarToggle.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${screenshotDir}/02b-sidebar-drawer-open.png` });
  const sidebarOpenAttr = await page.evaluate(() => document.body.getAttribute('data-mobile-sidebar-open') || document.querySelector('[data-sidebar-open]') !== null);
  await sidebarToggle.click();
  await page.waitForTimeout(400);
}

// 3. Code examples full width readable
await page.goto(`${BASE}`, { waitUntil: 'load' });
// navigate to a guide page with a code example
await page.goto('http://127.0.0.1:4321/docs/javascript-data-grid/installation/', { waitUntil: 'load' });
await page.waitForTimeout(800);
const codeBlock = page.locator('pre, .expressive-code').first();
const codeBlockVisible = await codeBlock.isVisible().catch(() => false);
let codeBlockOverflows = false;
if (codeBlockVisible) {
  const box = await codeBlock.boundingBox();
  codeBlockOverflows = box ? box.width > iPhoneSE.width + 2 : false;
}
const pageScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
await page.screenshot({ path: `${screenshotDir}/03-code-example.png`, fullPage: false });
log('Code examples full width readable', codeBlockVisible && !codeBlockOverflows && pageScrollWidth <= iPhoneSE.width + 2,
  `codeBlockVisible=${codeBlockVisible}, codeBlock exceeds viewport=${codeBlockOverflows}, page.scrollWidth=${pageScrollWidth}px`);

// 4. Theme switcher accessible
await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(500);
const themeToggle = page.locator('.mobile-theme-toggle button, .mobile-theme-toggle [role="button"], .mobile-theme-toggle select, starlight-theme-select button').first();
const themeToggleVisible = await themeToggle.isVisible().catch(() => false);
let themeChanged = false;
if (themeToggleVisible) {
  const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await themeToggle.click({ force: true }).catch(() => {});
  await page.waitForTimeout(300);
  // theme select is usually a <select>; try selecting dark directly
  const select = page.locator('.mobile-theme-toggle select').first();
  if (await select.count()) {
    await select.selectOption('dark').catch(() => {});
    await page.waitForTimeout(300);
  }
  const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  themeChanged = before !== after;
}
await page.screenshot({ path: `${screenshotDir}/04-theme-switcher.png` });
log('Theme switcher accessible', themeToggleVisible, `toggle visible in mobile header=${themeToggleVisible}, theme value changed on interaction=${themeChanged}`);

// 5. AI assistant visible
await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(1500); // allow astro:page-load + island hydration
const assistantBtn = page.locator('#mobile-assistant-btn');
const assistantBtnVisible = await assistantBtn.isVisible().catch(() => false);
let panelOpened = false;
if (assistantBtnVisible) {
  await assistantBtn.click();
  await page.waitForTimeout(600);
  const panel = page.locator('.da-panel');
  panelOpened = (await panel.getAttribute('data-open').catch(() => null)) === 'true';
}
await page.screenshot({ path: `${screenshotDir}/05-ai-assistant.png` });
log('AI assistant visible', assistantBtnVisible && panelOpened,
  `mobile assistant button visible=${assistantBtnVisible}, panel opens on click=${panelOpened}, hydrationErrors=${JSON.stringify(consoleErrors)}`);

await browser.close();

fs.writeFileSync('/tmp/claude-0/-home-user-handsontable/697f7ccf-49a7-54f9-9303-bcf0cb83c933/scratchpad/mobile-qa-results.json', JSON.stringify(results, null, 2));
console.log('\n=== SUMMARY ===');
for (const r of results) console.log(`${r.pass ? '✅' : '❌'} ${r.item}`);

// Extra: scroll to first code block and screenshot for evidence
const b2 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
const c2 = await b2.newContext({ viewport: iPhoneSE, isMobile: true, hasTouch: true });
const p2 = await c2.newPage();
await p2.goto('http://127.0.0.1:4321/docs/javascript-data-grid/installation/', { waitUntil: 'load' });
await p2.waitForTimeout(600);
const pre = p2.locator('pre, .expressive-code').first();
await pre.scrollIntoViewIfNeeded();
await p2.screenshot({ path: `${screenshotDir}/03b-code-example-scrolled.png` });
await b2.close();
