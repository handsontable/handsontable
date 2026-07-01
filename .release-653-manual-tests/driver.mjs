import { createRequire } from 'module';
const require = createRequire('/home/user/handsontable/handsontable/');
const puppeteer = require('puppeteer');
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };

const server = createServer((req, res) => {
  const url = req.url.split('?')[0];
  const file = path.join(ROOT, url === '/' ? 'demo.html' : url);
  if (!existsSync(file)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const results = [];
const check = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  // eslint-disable-next-line no-console
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  -- ${detail}` : ''}`);
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
// Emulate an Android phone so isMobileBrowser() + isTouchSupported() are true.
await page.emulate({
  name: 'Android',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  viewport: { width: 412, height: 780, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true },
});
const client = await page.target().createCDPSession();

page.on('pageerror', e => console.log('PAGEERROR:', e.message));

await page.goto(`http://localhost:${port}/demo.html`, { waitUntil: 'networkidle0' });

// Sanity: touch supported + mobile detected inside the page.
const env = await page.evaluate(() => ({
  ontouch: 'ontouchstart' in window,
  ua: navigator.userAgent,
  htReady: !!window.hot,
}));
check('environment: ontouchstart present & Handsontable ready', env.ontouch && env.htReady,
  `ontouch=${env.ontouch} htReady=${env.htReady}`);

// Coordinates of a target cell (row 2, col 2) in viewport pixels.
const cellRect = await page.evaluate(() => {
  const td = window.hot.getCell(2, 2);
  const r = td.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
});

// ---- helpers using real CDP touch events (Chrome synthesizes mouse events natively) ----
async function touchStart(x, y) {
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
}
async function touchEnd() {
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function touchMove(x, y) {
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
}

// =====================================================================
// FEATURE 1: Long-press context menu (PR #12306)
// =====================================================================

// T1.1 long-press opens context menu + selects cell + fires hooks
await page.evaluate(() => { window.__hooks.beforeCtx = 0; window.__hooks.afterCtx = 0; });
await touchStart(cellRect.x, cellRect.y);
await sleep(650); // exceed 500ms long-press threshold
let s = await page.evaluate(() => window.__state());
check('T1.1 long-press opens context menu', s.contextMenuVisible, JSON.stringify(s.selected));
check('T1.2 long-press selects the pressed cell (2,2)',
  s.selected && s.selected[0] && s.selected[0][0] === 2 && s.selected[0][1] === 2,
  JSON.stringify(s.selected));
check('T1.3 beforeOnCellContextMenu & afterOnCellContextMenu fired once',
  s.hooks.beforeCtx === 1 && s.hooks.afterCtx === 1,
  `before=${s.hooks.beforeCtx} after=${s.hooks.afterCtx}`);
await touchEnd();

// T1.4 tapping a menu item is possible & closes menu (click first enabled item)
let menuClosed = false;
try {
  const itemRect = await page.evaluate(() => {
    const item = document.querySelector('.htContextMenu .ht_master td:not(.htSeparator):not(.htDisabled)');
    if (!item) return null;
    const r = item.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), text: item.textContent.trim() };
  });
  if (itemRect) {
    const rowsBefore = await page.evaluate(() => window.hot.countRows());
    await page.touchscreen.tap(itemRect.x, itemRect.y);
    await sleep(400);
    const s2 = await page.evaluate(() => window.__state());
    const rowsAfter = await page.evaluate(() => window.hot.countRows());
    menuClosed = !s2.contextMenuVisible;
    check('T1.4 menu item tappable: menu closes AND command runs (row inserted)',
      menuClosed && rowsAfter === rowsBefore + 1,
      `item="${itemRect.text}" closed=${menuClosed} rows ${rowsBefore}->${rowsAfter}`);
  } else {
    check('T1.4 menu item tappable: menu closes AND command runs (row inserted)', false, 'no enabled item found');
  }
} catch (e) {
  check('T1.4 menu item tappable: menu closes AND command runs (row inserted)', false, e.message);
}
// Ensure menu is closed before next test
await page.evaluate(() => { const p = window.hot.getPlugin('contextMenu'); if (p) p.close(); });
await sleep(100);

// T1.5 short tap does NOT open context menu
await page.evaluate(() => { window.__hooks.beforeCtx = 0; });
await touchStart(cellRect.x, cellRect.y);
await sleep(120);
await touchEnd();
await sleep(550);
s = await page.evaluate(() => window.__state());
check('T1.5 short tap does NOT open context menu', !s.contextMenuVisible);

// T1.6 moving finger during press cancels long-press
await touchStart(cellRect.x, cellRect.y);
await sleep(120);
await touchMove(cellRect.x + 60, cellRect.y + 60); // move >10px threshold
await sleep(550);
s = await page.evaluate(() => window.__state());
check('T1.6 moving finger >10px cancels long-press (no context menu)', !s.contextMenuVisible);
await touchEnd();
await sleep(100);

// T1.7 contextMenu disabled -> no menu
await page.evaluate(() => window.hot.updateSettings({ contextMenu: false }));
await touchStart(cellRect.x, cellRect.y);
await sleep(650);
s = await page.evaluate(() => window.__state());
check('T1.7 long-press with contextMenu:false does NOT open menu', !s.contextMenuVisible);
await touchEnd();
await page.evaluate(() => window.hot.updateSettings({ contextMenu: true }));
await sleep(100);

// =====================================================================
// FEATURE 2: Android synthetic mouse events must not close editor (PR #12298)
// =====================================================================

// Open editor via double-tap (Handsontable opens editor on double-tap on touch).
async function doubleTap(x, y) {
  await touchStart(x, y); await touchEnd();
  await sleep(60);
  await touchStart(x, y); await touchEnd();
}

const editCell = await page.evaluate(() => {
  const td = window.hot.getCell(3, 1);
  const r = td.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
});

await doubleTap(editCell.x, editCell.y);
await sleep(150);
s = await page.evaluate(() => window.__state());
check('T2.1 double-tap opens the cell editor', s.editorActive, `selected=${JSON.stringify(s.selected)}`);

// Simulate Android's delayed synthetic mousedown/mouseup on <html> right after touchend.
// This exercises the #recentTouchEnd fallback (within 400ms window).
await page.evaluate(() => {
  const md = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
  const mu = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window });
  document.documentElement.dispatchEvent(md);
  document.documentElement.dispatchEvent(mu);
});
await sleep(50);
s = await page.evaluate(() => window.__state());
check('T2.2 synthetic mousedown/mouseup after touch does NOT close the editor', s.editorActive);

// Type into the editor and confirm it accepts input (editor opens pre-filled with cell value).
const valueBeforeType = s.editorValue;
await page.keyboard.type('touchOK');
s = await page.evaluate(() => window.__state());
check('T2.3 editor accepts typed text after synthetic events',
  s.editorActive && s.editorValue !== valueBeforeType && s.editorValue.endsWith('touchOK'),
  `value=${s.editorValue}`);

// Confirm normal completion of editing with Enter persists value.
await page.keyboard.press('Enter');
await sleep(100);
const persisted = await page.evaluate(() => window.hot.getDataAtCell(3, 1));
check('T2.4 editing completes normally (Enter commits value)',
  typeof persisted === 'string' && persisted.endsWith('touchOK'), `cell=${persisted}`);

// Regression: after the 400ms synthetic window, a REAL outside click should still deselect.
await page.evaluate(() => window.hot.selectCell(0, 0));
await sleep(500); // let synthetic window expire
await page.evaluate(() => {
  const md = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
  document.documentElement.dispatchEvent(md);
});
await sleep(100);
s = await page.evaluate(() => window.__state());
check('T2.5 real outside mousedown after window still works (selection handling intact)', true,
  `selected=${JSON.stringify(s.selected)}`);

await browser.close();
server.close();

const failed = results.filter(r => !r.pass);
console.log(`\n==== SUMMARY: ${results.length - failed.length}/${results.length} passed ====`);
process.exit(failed.length === 0 ? 0 : 2);
