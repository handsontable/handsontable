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
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.emulate({ name: 'Android',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  viewport: { width: 412, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true } });
const client = await page.target().createCDPSession();
await page.goto(`http://localhost:${port}/demo.html`, { waitUntil: 'networkidle0' });

const c = await page.evaluate(() => { const r = window.hot.getCell(2, 2).getBoundingClientRect(); return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) }; });
await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y }] });
await sleep(650);
await page.screenshot({ path: path.join(ROOT, 'shot-longpress-contextmenu.png') });
await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.evaluate(() => window.hot.getPlugin('contextMenu').close());
await sleep(150);

const e = await page.evaluate(() => { const r = window.hot.getCell(3, 1).getBoundingClientRect(); return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) }; });
for (let i = 0; i < 2; i++) { await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: e.x, y: e.y }] }); await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(60); }
await sleep(120);
await page.evaluate(() => { document.documentElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); document.documentElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); });
await page.keyboard.type('EDIT');
await sleep(100);
await page.screenshot({ path: path.join(ROOT, 'shot-editor-open-after-synthetic.png') });

await browser.close(); server.close();
console.log('screenshots saved');
