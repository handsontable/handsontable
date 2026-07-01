import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoUrl = 'file://' + path.join(__dirname, 'manual_checkbox_delete_demo.html');
const shotDir = '/tmp/claude-0/-home-user-handsontable/22f669d9-cd1e-5c8a-8448-df0571614592/scratchpad';

const log = [];
const say = (m) => { log.push(m); console.log(m); };

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 500 });
page.on('pageerror', (e) => say('PAGE ERROR: ' + e.message));
await page.goto(demoUrl, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.hot && window.hot.getData');

const getData = () => page.evaluate('window.hot.getData()');
const getSelected = () => page.evaluate('window.hot.getSelected()');
const noValue = () => page.evaluate('window.noValueCount()');
const doneActions = () => page.evaluate('window.hot.getPlugin("undoRedo").doneActions.length');

const original = await getData();
say('STEP 0 — initial data:\n' + JSON.stringify(original));
await page.screenshot({ path: path.join(shotDir, 'step0-initial.png') });

// STEP 1+2 — Select multiple rows / mixed selection types:
// select all (ctrl/cmd+A style) then ctrl-click an inner cell to add a second selection layer.
say('\nSTEP 1/2 — build a mixed multi-layer selection (selectAll + inner ctrl-click layer)');
await page.evaluate(() => {
  window.hot.selectCell(0, 0);
  window.hot.selectAll();
  // Add a second, overlapping selection layer (mix of selection types).
  window.hot.selectCells([[0, 0, 3, 2], [1, 1, 1, 1]]);
});
const selBefore = await getSelected();
say('selection layers before delete: ' + JSON.stringify(selBefore) + ' (count=' + selBefore.length + ')');

// STEP 3 — Delete rows/cells via the Delete key (goes through checkbox renderer shortcut path).
say('\nSTEP 3 — press Delete');
await page.evaluate(() => window.hot.listen());
await page.keyboard.press('Delete');
await new Promise(r => setTimeout(r, 200));

const afterDelete = await getData();
const nvAfter = await noValue();
const actions = await doneActions();
say('data after delete:\n' + JSON.stringify(afterDelete));
say('checkboxes with noValue class after delete: ' + nvAfter);
say('undoRedo doneActions length: ' + actions);
await page.screenshot({ path: path.join(shotDir, 'step3-after-delete.png') });

// Validate delete outcome: checkbox column -> false, other columns -> null.
const checkboxAllFalse = afterDelete.every(r => r[2] === false);
const othersNull = afterDelete.every(r => r[0] === null && r[1] === null);
say('  → checkbox cells all false: ' + checkboxAllFalse);
say('  → non-checkbox cells all null: ' + othersNull);
say('  → single undo action registered: ' + (actions === 1));
say('  → no noValue class present: ' + (nvAfter === 0));

// STEP 4 — Undo (Ctrl+Z).
say('\nSTEP 4 — press Ctrl+Z (undo)');
await page.keyboard.down('Control');
await page.keyboard.press('KeyZ');
await page.keyboard.up('Control');
await new Promise(r => setTimeout(r, 200));

const afterUndo = await getData();
const selAfter = await getSelected();
say('data after undo:\n' + JSON.stringify(afterUndo));
say('selection after undo: ' + JSON.stringify(selAfter));
await page.screenshot({ path: path.join(shotDir, 'step4-after-undo.png') });

// STEP 5/6/7 — validate restoration.
const dataRestored = JSON.stringify(afterUndo) === JSON.stringify(original);
const selectionRestored = JSON.stringify(selAfter) === JSON.stringify(selBefore);
say('\nSTEP 5 — rows/data restored: ' + dataRestored);
say('STEP 6 — selection restored: ' + selectionRestored);
say('STEP 7 — data integrity (deep equal to original): ' + dataRestored);

const pass = checkboxAllFalse && othersNull && actions === 1 && nvAfter === 0
  && dataRestored && selectionRestored;
say('\n==== OVERALL: ' + (pass ? 'PASS' : 'FAIL') + ' ====');

await browser.close();
process.exit(pass ? 0 : 1);
