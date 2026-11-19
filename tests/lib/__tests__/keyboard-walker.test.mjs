import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  diffTabOrder,
  effectsBetween,
  escapeFindings,
  goldenStops,
  inventoryLines,
  normalizeKeys,
  parseShortcutTables,
  probePresses,
  probeStep,
  probeVerdict,
  shortcutKey,
  singleCharacterShortcuts,
  stopKey,
  walkFindings,
  walkVerdict,
} from '../keyboard-walker.mjs';
import { SHORTCUT_PROBES } from '../../a11y/checks/keyboard-shortcuts.mjs';
import { validatePart, EVIDENCE_SCHEMA } from '../a11y-evidence.mjs';

// tests/AGENTS.md ("A11y: the checks beyond axe", the keyboard walker): the verdicts the walker
// derives from what it recorded. The browser half (`a11y/checks/keyboard-walker.spec.ts`) presses the
// keys and records each focus stop; everything that decides a finding is here, so it is proven without
// a browser.

const here = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(here, '../../../docs/content/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md');

/**
 * A focus stop as the walker records it.
 *
 * @param {string} region Where it is.
 * @param {object} [fields] The rest.
 * @returns {object} The stop.
 */
function stop(region, fields = {}) {
  return { region, role: 'button', name: 'Go', ref: `${region}-${fields.ref ?? 0}`, cell: null, modal: false, ...fields };
}

const cell = (row, col, fields = {}) => stop('grid', { role: 'gridcell', name: `v${row}${col}`, cell: [row, col], ref: 'td', ...fields });

test('a walk that reaches the other sentinel left the grid; one that never does is a trap', () => {
  const through = walkVerdict({ direction: 'forward', stops: [stop('start'), cell(0, 0), cell(0, 1), cell(0, 2), stop('end')] });

  assert.deepEqual(through, { reachedEnd: true, leftDocument: false, cycle: null, trapped: false, presses: 4, productStops: 3, modal: false, exitRoute: null });

  const stuck = walkVerdict({ direction: 'forward', stops: [stop('start'), cell(0, 0), cell(0, 1), cell(0, 0)] });

  assert.equal(stuck.trapped, true);
  assert.deepEqual(stuck.cycle, { from: 1, to: 3 });

  const budget = walkVerdict({ direction: 'backward', stops: [stop('end'), cell(4, 2), cell(4, 1), cell(4, 0)], budgetExhausted: true });

  assert.equal(budget.trapped, true, 'a walk that ran out of presses inside the grid is a trap');
  assert.equal(budget.cycle, null);

  const long = walkVerdict({
    direction: 'forward', stops: [stop('start'), cell(0, 0), cell(0, 1), cell(1, 0)], budgetExhausted: true,
    exitRoute: { keys: 'Ctrl+End, then Tab', left: true, presses: 2 },
  });

  assert.equal(long.trapped, false, 'a walk the documented way out leaves is long, not a trap');
  assert.deepEqual(walkFindings({ walk: long, stops: [], direction: 'forward' }).map(item => [item.kind, item.severity, item.step]),
    [['tab-walk-needs-shortcut', 'advisory', 'Tab 3, then Ctrl+End, then Tab']]);
  assert.equal(walkVerdict({
    direction: 'forward', stops: [stop('start'), cell(0, 0)], budgetExhausted: true, exitRoute: { keys: 'Ctrl+End, then Tab', left: false, presses: 20 },
  }).trapped, true, 'a walk the way out does not leave either is a trap');

  const away = walkVerdict({ direction: 'forward', stops: [stop('start'), cell(0, 0), stop('body')] });

  assert.deepEqual([away.leftDocument, away.trapped], [true, false], 'focus that left the document left the grid');

  const outsideOnly = walkVerdict({ direction: 'forward', stops: [stop('start'), stop('outside', { ref: 1 }), stop('outside', { ref: 1 })] });

  assert.equal(outsideOnly.trapped, false, 'a cycle outside the product is not the product\'s trap');
});

test('a walk that comes back to a stop outside the product without reaching the other sentinel is incomplete', () => {
  // Tab moved the focus from the grid back to the sentinel the walk started on: neither an exit nor a trap held in the product.
  const bounced = [stop('start'), cell(0, 0), cell(0, 1), stop('start')];
  const walk = walkVerdict({ direction: 'forward', stops: bounced });

  assert.deepEqual([walk.reachedEnd, walk.leftDocument, walk.trapped], [false, false, false]);
  assert.deepEqual(walkFindings({ walk, stops: bounced, direction: 'forward' }).map(item => [item.kind, item.criteria, item.severity, item.step]),
    [['tab-walk-incomplete', ['2.1.2'], 'advisory', 'Tab 3']]);

  const outsideOnly = [stop('start'), stop('outside', { ref: 1 }), stop('outside', { ref: 1 })];

  assert.deepEqual(walkFindings({ walk: walkVerdict({ direction: 'forward', stops: outsideOnly }), stops: outsideOnly, direction: 'forward' }), [],
    'a walk that never entered the product is not the product\'s');
});

test('a cycle inside the same grid cell coordinates is a cycle, and recycled elements with new coordinates are not', () => {
  // Walkontable reuses the same <td> for another cell after a scroll, so a stop is keyed by its
  // coordinates, never by the element.
  assert.equal(stopKey(cell(0, 1)), 'grid|cell|0,1');
  assert.notEqual(stopKey(cell(0, 1, { ref: 'same' })), stopKey(cell(0, 2, { ref: 'same' })));
  assert.equal(stopKey(stop('portal', { ref: 7 })), 'portal|7');
  assert.equal(walkVerdict({ direction: 'forward', stops: [stop('start'), cell(0, 0, { ref: 'td' }), cell(0, 1, { ref: 'td' }), stop('end')] }).cycle, null);
});

test('a walk held inside a modal dialog is reported as modal, and is a trap only without an exit', () => {
  const dialog = (ref, name) => stop('grid', { ref, name, modal: true });
  const walk = walkVerdict({ direction: 'forward', stops: [stop('start'), dialog(1, 'Cancel'), dialog(2, 'OK'), dialog(1, 'Cancel')] });

  assert.deepEqual([walk.trapped, walk.modal], [true, true]);
  assert.deepEqual(walkFindings({ walk, stops: [], direction: 'forward', modalExit: 'Escape closes it' }), [],
    'a modal dialog keeps the focus by design (APG dialog pattern) and has an exit');
  assert.deepEqual(walkFindings({ walk, stops: [dialog(1, 'Cancel')], direction: 'forward', modalExit: null }).map(item => [item.kind, item.criteria, item.severity]),
    [['keyboard-trap', ['2.1.2'], 'serious']]);
});

test('Tab that walks out of an open modal dialog to the page behind it is a finding', () => {
  const dialog = (ref, name) => stop('grid', { ref, name, modal: true, locator: `button.${name}` });
  const stops = [stop('start'), dialog(1, 'Cancel'), dialog(2, 'OK'), stop('end')];
  const findings = walkFindings({ walk: walkVerdict({ direction: 'forward', stops }), stops, direction: 'forward' });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.severity, item.selector, item.step]),
    [['focus-leaves-modal', ['2.4.3'], 'serious', 'button.OK', 'Tab 3']]);
  assert.deepEqual(walkFindings({ walk: walkVerdict({ direction: 'forward', stops: [stop('start'), dialog(1, 'OK'), stop('body')] }),
    stops: [stop('start'), dialog(1, 'OK'), stop('body')], direction: 'forward' }).map(item => item.kind), ['focus-leaves-modal'],
  'leaving the document from a modal dialog leaves it too');
});

test('a key that leaves no element focused from inside the grid lost the focus; leaving the page from the portal did not', () => {
  // The sentinels sit right before and right after the grid's container, so Tab from inside it reaches one of
  // them or another stop of the product: no element focused means the focused element went away.
  const lost = [stop('start'), cell(0, 0, { locator: 'td' }), stop('body')];

  assert.deepEqual(walkFindings({ walk: walkVerdict({ direction: 'forward', stops: lost }), stops: lost, direction: 'forward' })
    .map(item => [item.kind, item.criteria, item.severity, item.selector, item.step]), [['focus-lost', ['2.4.3'], 'serious', 'td', 'Tab 2']]);

  // The multiselect editor's popup walk: the search field, then nothing.
  const popup = [stop('start'), stop('grid', { role: 'textbox', name: 'Search options', ref: 1, locator: 'input' }), stop('body')];

  assert.deepEqual(walkFindings({ walk: walkVerdict({ direction: 'forward', stops: popup }), stops: popup, direction: 'forward', opened: true })
    .map(item => [item.kind, item.step]), [['focus-lost', 'Tab 1']], 'a popup walk counts from where the popup put the focus');

  const out = [stop('start'), stop('portal', { ref: 3, locator: 'button.ok' }), stop('body')];

  assert.deepEqual(walkFindings({ walk: walkVerdict({ direction: 'forward', stops: out }), stops: out, direction: 'forward' }), [],
    'the portal can be the last focusable element of the page, so Tab from it may leave the page');
});

test('the findings of a walk: a trap, a stop with no name or role, a context change on focus', () => {
  const stops = [
    stop('start'),
    cell(0, 0),
    stop('grid', { role: 'button', name: '', ref: 2, locator: 'button.ht-page-next' }),
    stop('grid', { role: 'generic', name: 'x', ref: 3, locator: 'div.ht-holder', ignored: false }),
    stop('portal', { role: 'none', name: '', ref: 4, locator: 'textarea.handsontableInput', ignored: true }),
    stop('grid', { role: 'gridcell', name: '', cell: [0, 1], locator: 'td' }),
    stop('grid', { role: 'button', name: 'Next', ref: 5, locator: 'button.next', contextChange: 'a menu opened' }),
    stop('end'),
  ];
  const walk = walkVerdict({ direction: 'forward', stops });
  const findings = walkFindings({ walk, stops, direction: 'forward' });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.severity, item.selector, item.step]), [
    ['focus-stop-unnamed', ['4.1.2'], 'serious', 'button.ht-page-next', 'Tab 2'],
    ['focus-stop-without-role', ['4.1.2'], 'serious', 'div.ht-holder', 'Tab 3'],
    ['focus-stop-without-role', ['4.1.2'], 'serious', 'textarea.handsontableInput', 'Tab 4'],
    ['context-change-on-focus', ['3.2.1'], 'serious', 'button.next', 'Tab 6'],
  ], 'an empty grid cell needs no name; the fixture\'s own stops are not judged');
  assert.equal(findings[3].measured.change, 'a menu opened');
});

test('a native date, datetime or time input needs a name like any text field', () => {
  // Chromium's own roles for <input type="date">, "datetime-local" and "time", as the CDP accessibility tree reports them.
  const stops = ['Date', 'DateTime', 'InputTime'].map((role, index) => stop('grid', { role, name: '', ref: index, locator: `input.${role}` }));
  const walk = [stop('start'), ...stops, stop('end')];

  assert.deepEqual(walkFindings({ walk: walkVerdict({ direction: 'forward', stops: walk }), stops: walk, direction: 'forward' })
    .map(item => [item.kind, item.selector, item.measured.role]), [
    ['focus-stop-unnamed', 'input.Date', 'Date'],
    ['focus-stop-unnamed', 'input.DateTime', 'DateTime'],
    ['focus-stop-unnamed', 'input.InputTime', 'InputTime'],
  ]);
});

test('a stop both walks of a page pass is reported once', () => {
  // One element with one problem is one finding, whichever walk reached it first.
  const empty = stop('grid', { role: 'generic', name: 'No data available', ref: 9, locator: 'div.ht-empty-data-state' });
  const forward = [stop('start'), cell(-1, 0), empty, stop('end')];
  const backward = [stop('end'), empty, cell(-1, 0), stop('start')];
  const reported = new Set();
  const findings = [
    ...walkFindings({ walk: walkVerdict({ direction: 'forward', stops: forward }), stops: forward, direction: 'forward', reported }),
    ...walkFindings({ walk: walkVerdict({ direction: 'backward', stops: backward }), stops: backward, direction: 'backward', reported }),
  ];

  assert.deepEqual(findings.map(item => [item.kind, item.selector, item.step]), [['focus-stop-without-role', 'div.ht-empty-data-state', 'Tab 2']]);
});

test('a focus loss, a Tab out of a modal and a context change are judged per walk; a missing name once per stop', () => {
  // These three depend on the key pressed: Tab and Shift+Tab losing the focus from one cell are two defects, and
  // fixing one leaves the other. A stop's role and name do not depend on the key that reached it.
  const lost = cell(0, 0, { locator: 'td' });
  const opener = stop('grid', { role: 'button', name: '', ref: 5, locator: 'button.menu', contextChange: 'a menu, a dialog or a list opened' });
  const dialog = stop('grid', { role: 'button', name: 'OK', ref: 6, locator: 'button.ok', modal: true });
  const walks = {
    forward: [[stop('start'), lost, stop('body')], [stop('start'), opener, stop('end')], [stop('start'), dialog, stop('end')]],
    backward: [[stop('end'), lost, stop('body')], [stop('end'), opener, stop('start')], [stop('end'), dialog, stop('start')]],
  };
  const reported = new Set();
  const findings = Object.entries(walks).flatMap(([direction, list]) => list
    .flatMap(stops => walkFindings({ walk: walkVerdict({ direction, stops }), stops, direction, reported })));

  assert.deepEqual(findings.map(item => [item.kind, item.selector, item.step]), [
    ['focus-lost', 'td', 'Tab 2'],
    ['focus-stop-unnamed', 'button.menu', 'Tab 1'],
    ['context-change-on-focus', 'button.menu', 'Tab 1'],
    ['focus-leaves-modal', 'button.ok', 'Tab 2'],
    ['focus-lost', 'td', 'Shift+Tab 2'],
    ['context-change-on-focus', 'button.menu', 'Shift+Tab 1'],
    ['focus-leaves-modal', 'button.ok', 'Shift+Tab 2'],
  ]);
});

test('a way out that leaves no element focused from inside the grid lost the focus; from the portal it left the page', () => {
  // Ctrl+End then Tab from a grid whose Tab wraps rows: the focus left the grid, so the walk is no trap, but a press
  // from inside the grid's container that leaves no element focused is the same 2.4.3 defect the walk itself reports.
  const stops = [stop('start'), cell(0, 0), cell(0, 1), cell(1, 0)];
  const exitRoute = { keys: 'Ctrl+End, then Tab', left: 'body', presses: 2, from: { region: 'grid', locator: 'td' } };
  const walk = walkVerdict({ direction: 'forward', stops, budgetExhausted: true, exitRoute });

  assert.equal(walk.trapped, false, 'the focus left the grid, though to no element');
  assert.deepEqual(walkFindings({ walk, stops, direction: 'forward' }).map(item => [item.kind, item.criteria, item.severity, item.selector, item.step]), [
    ['focus-lost', ['2.4.3'], 'serious', 'td', 'Tab 3, then Ctrl+End, then Tab 2'],
    ['tab-walk-needs-shortcut', ['2.1.2'], 'advisory', undefined, 'Tab 3, then Ctrl+End, then Tab'],
  ]);

  const page = walkVerdict({ direction: 'forward', stops, budgetExhausted: true, exitRoute: { ...exitRoute, from: { region: 'portal', locator: 'button.ok' } } });

  assert.deepEqual(walkFindings({ walk: page, stops, direction: 'forward' }).map(item => item.kind), ['tab-walk-needs-shortcut'],
    'the portal can be the last focusable element of the page, so Tab from it may leave the page');

  const routeKey = walkVerdict({ direction: 'forward', stops, budgetExhausted: true, exitRoute: { ...exitRoute, presses: 0 } });

  assert.deepEqual(walkFindings({ walk: routeKey, stops, direction: 'forward' }).filter(item => item.kind === 'focus-lost')
    .map(item => [item.step, item.reason.startsWith('Ctrl+End from inside the grid')]), [['Tab 3, then Ctrl+End', true]],
  'the route key itself can leave no element focused, before any Tab: the step and the reason name that key');
});

test('a backward walk names its steps Shift+Tab; a popup walk counts from where the popup put the focus', () => {
  const stops = [stop('end'), stop('grid', { name: '', ref: 1, locator: 'button.x' }), stop('start')];
  const findings = walkFindings({ walk: walkVerdict({ direction: 'backward', stops }), stops, direction: 'backward' });

  assert.equal(findings[0].step, 'Shift+Tab 1');

  const popup = [stop('start'), stop('portal', { name: '', ref: 1, locator: 'textarea' }), stop('portal', { name: '', ref: 2, locator: 'input' })];

  assert.deepEqual(walkFindings({ walk: walkVerdict({ direction: 'forward', stops: popup }), stops: popup, direction: 'forward', opened: true })
    .map(item => item.step), ['where the popup put the focus', 'Tab 1']);
});

test('a Tab that leaves the focus where it was is an advisory finding, with whether the editor stayed open', () => {
  // A cell editor whose popup walk is [editor, editor]: Tab moved inside a date input, accepted a suggestion, or did nothing.
  const editor = stop('grid', { role: 'Date', name: 'Sell date', ref: 1, locator: 'input.htDateInput', signals: { url: 'u', popups: 0, editorOpen: true } });
  const popup = [{ ...editor, region: 'start' }, editor, editor];
  const findings = walkFindings({ walk: { ...walkVerdict({ direction: 'forward', stops: popup }), trapped: false }, stops: popup, direction: 'forward', opened: true });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.severity, item.selector, item.step, item.measured.editorOpen]),
    [['tab-keeps-focus', ['2.1.1'], 'advisory', 'input.htDateInput', 'Tab 1', true]]);

  const later = [{ ...editor, region: 'start' }, editor, cell(1, 3), cell(1, 3)];
  const [kept] = walkFindings({ walk: { ...walkVerdict({ direction: 'forward', stops: later }), trapped: false }, stops: later, direction: 'forward', opened: true });

  assert.deepEqual([kept.kind, kept.step], ['tab-keeps-focus', 'Tab 2'], 'a later Tab that keeps the focus stops the walk the same way');
  assert.doesNotMatch(kept.reason, /popup put it on/, 'the reason holds for a Tab after the first, where the popup did not put the focus');

  const moved = [{ ...editor, region: 'start' }, editor, cell(1, 3), stop('end')];

  assert.deepEqual(walkFindings({ walk: walkVerdict({ direction: 'forward', stops: moved }), stops: moved, direction: 'forward', opened: true }), [],
    'a Tab that committed the edit and moved to the next cell is what the guide documents');
});

test('Escape must close a popup and give the focus back to its opener', () => {
  assert.deepEqual(escapeFindings({ state: 'context-menu', closedAfter: 1, focusReturned: true }), []);
  assert.deepEqual(escapeFindings({ state: 'context-menu-submenu', closedAfter: 2, focusReturned: true }), []);
  assert.deepEqual(escapeFindings({ state: 'editor', closedAfter: null, presses: 3, focusReturned: false }).map(item => [item.kind, item.criteria, item.severity]),
    [['escape-does-not-close', ['2.1.2'], 'serious']], 'a popup Escape cannot close is a trap; where the focus went is moot');
  assert.deepEqual(escapeFindings({ state: 'comment', closedAfter: 1, focusReturned: false, focus: 'body' }).map(item => [item.kind, item.criteria, item.severity, item.measured.focus]),
    [['focus-not-returned', ['2.4.3'], 'serious', 'body']]);
});

test('goldens keep what a reader can review: region, role, name and cell; the diff names the first difference', () => {
  const stops = [stop('start'), cell(0, 0), stop('grid', { role: 'button', name: 'Next page', ref: 9, locator: 'button.next' }), stop('end')];

  assert.deepEqual(goldenStops(stops), [
    { region: 'start' },
    { region: 'grid', role: 'gridcell', name: 'v00', cell: [0, 0] },
    { region: 'grid', role: 'button', name: 'Next page' },
    { region: 'end' },
  ]);

  const golden = goldenStops(stops);

  assert.equal(diffTabOrder(golden, goldenStops(stops)), null);
  assert.deepEqual(diffTabOrder(golden, goldenStops([stops[0], stops[2], stops[3]])), {
    index: 1,
    expected: { region: 'grid', role: 'gridcell', name: 'v00', cell: [0, 0] },
    actual: { region: 'grid', role: 'button', name: 'Next page' },
    expectedLength: 4,
    actualLength: 3,
  });
  assert.deepEqual(diffTabOrder(golden, [...golden, { region: 'end' }]), {
    index: 4, expected: null, actual: { region: 'end' }, expectedLength: 4, actualLength: 5,
  });
});

test('the docs table parser reads every shortcut row with its section, keys and ordinal', () => {
  const markdown = [
    '## Navigation keyboard shortcuts',
    '',
    '| Windows | macOS | Action | Excel | Sheets |',
    '| --- | --- | --- | :-: | :-: |',
    '| Arrow keys | Arrow keys | Move one cell | &check; | &check; |',
    '| <kbd>**Ctrl**</kbd>+<kbd>**Home**</kbd> | <kbd>⌘</kbd>+<kbd>**Home**</kbd> | Move to the first cell<sup>\\*</sup> | &cross; | &check; |',
    '',
    '### Context menu keyboard shortcuts',
    '',
    '| Windows | macOS | Action |',
    '| --- | --- | --- |',
    '| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\\\**</kbd> or <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | x | Open the context menu |',
    '| <kbd>**Space**</kbd> | <kbd>**Space**</kbd> | Toggle one |',
    '| <kbd>**Space**</kbd> | <kbd>**Space**</kbd> | Toggle all |',
    '| <kbd>**Shift + Tab**</kbd> | x | Back |',
  ].join('\n');

  assert.deepEqual(parseShortcutTables(markdown).map(row => [row.section, row.keys, row.ordinal, row.action, row.line]), [
    ['Navigation keyboard shortcuts', 'Arrow keys', 1, 'Move one cell', 5],
    ['Navigation keyboard shortcuts', 'Ctrl+Home', 1, 'Move to the first cell', 6],
    ['Context menu keyboard shortcuts', 'Ctrl+Shift+\\ or Shift+F10', 1, 'Open the context menu', 12],
    ['Context menu keyboard shortcuts', 'Space', 1, 'Toggle one', 13],
    ['Context menu keyboard shortcuts', 'Space', 2, 'Toggle all', 14],
    ['Context menu keyboard shortcuts', 'Shift+Tab', 1, 'Back', 15],
  ]);
  assert.equal(normalizeKeys('<kbd>**Shift**</kbd> + Arrow keys'), 'Shift+Arrow keys');
  assert.equal(shortcutKey({ section: 'S', keys: 'Space', ordinal: 2 }), 'S|Space|2');
});

test('every documented shortcut has an entry in the probe inventory, and every entry names a documented row', () => {
  const rows = parseShortcutTables(readFileSync(DOCS, 'utf8'));
  const documented = new Set(rows.map(shortcutKey));
  const inventory = new Set(SHORTCUT_PROBES.map(shortcutKey));

  assert.ok(rows.length > 100, `the parser read the docs page (${rows.length} rows)`);
  assert.deepEqual([...documented].filter(key => !inventory.has(key)), [],
    'a documented shortcut needs an entry in tests/a11y/checks/keyboard-shortcuts.mjs: a probe, or `notProbed` with the reason');
  assert.deepEqual([...inventory].filter(key => !documented.has(key)), [], 'an entry whose row is gone from the docs page is stale');
  assert.equal(inventory.size, SHORTCUT_PROBES.length, 'one entry per documented row');
});

test('every inventory entry is found on its own line, so its finding is annotated there', () => {
  const source = readFileSync(path.resolve(here, '../../a11y/checks/keyboard-shortcuts.mjs'), 'utf8');
  const lines = inventoryLines(source);

  assert.deepEqual(SHORTCUT_PROBES.map(shortcutKey).filter(key => !lines.has(key)), []);
  assert.equal(new Set(lines.values()).size, SHORTCUT_PROBES.length, 'one line per entry');
});

test('no two presses of one page share a step, so no two of their findings share an id', () => {
  // A probe finding has a step and no selector, so its id is its step: a key pressed twice from different steps
  // of its own (F6, then F6 after F6) must name them.
  const seen = new Set();
  const shared = [];

  for (const entry of SHORTCUT_PROBES.filter(item => item.probe)) {
    for (const press of probePresses(entry.probe)) {
      const key = `${entry.probe.page ?? 'keyboard-shortcuts'}: ${probeStep(entry, press)}`;

      if (seen.has(key)) {
        shared.push(key);
      }
      seen.add(key);
    }
  }

  assert.deepEqual(shared, []);

  const f6 = SHORTCUT_PROBES.find(entry => entry.section === 'Formula builder keyboard shortcuts' && entry.keys === 'F6 / Shift+F6');

  assert.deepEqual(probePresses(f6.probe).map(press => probeStep(f6, press)), [
    'F6 / Shift+F6 (F6) on editor at (0, 2)',
    'F6 / Shift+F6 (Shift+F6) on editor at (0, 2)',
    'F6 / Shift+F6 (F6 after F6) on editor at (0, 2)',
    'F6 / Shift+F6 (F6 after typing "+SUM(") on editor at (0, 2)',
  ]);
  assert.equal(probeStep({ keys: 'F2 or Ctrl+E', probe: { setup: 'editor', at: [1, 2], then: ['ArrowUp'] } }, { key: 'F2', prepare: [] }),
    'F2 or Ctrl+E (F2, then ArrowUp) on editor at (1, 2)');
});

test('a single character key with no modifier is a 2.1.4 shortcut; an arrow glyph, Space and typing are not', () => {
  const rows = [
    { section: 'A', keys: 'x' }, { section: 'B', keys: '↑ / ↓' }, { section: 'C', keys: 'Space' }, { section: 'D', keys: 'Alphanumeric keys' },
    { section: 'E', keys: 'Ctrl+M' }, { section: 'F', keys: 'Enter or ?' },
  ];

  assert.deepEqual(singleCharacterShortcuts(rows).map(row => row.section), ['A', 'F']);
  assert.deepEqual(singleCharacterShortcuts(parseShortcutTables(readFileSync(DOCS, 'utf8'))), [],
    'the guide documents no single-character shortcut today; one added later needs the walker\'s focus proof reviewed');
});

test('every probe is well formed: a setup, the keys pressed, an expected effect; every skip has a reason', () => {
  const problems = [];

  for (const entry of SHORTCUT_PROBES) {
    const label = shortcutKey(entry);

    if (entry.notProbed !== undefined) {
      if (typeof entry.notProbed !== 'string' || entry.notProbed.length < 15) {
        problems.push(`${label}: notProbed needs a reason of 15 characters or more`);
      }
      if (entry.probe !== undefined) {
        problems.push(`${label}: an entry is a probe or notProbed, not both`);
      }
      continue;
    }
    if (!entry.probe) {
      problems.push(`${label}: no probe and no notProbed reason`);
      continue;
    }

    const { setup, press, expect } = entry.probe;
    const presses = (Array.isArray(press) ? press : [press]).map(item => (typeof item === 'object' && item !== null ? item.key : item));

    if (!['cell', 'range', 'editor', 'context-menu', 'dropdown-menu', 'comment', 'column-header', 'row-header', 'freeze-bar', 'outside'].includes(setup)) {
      problems.push(`${label}: unknown setup ${JSON.stringify(setup)}`);
    }
    if (presses.length === 0 || presses.some(key => typeof key !== 'string' || key === '')) {
      problems.push(`${label}: press is empty`);
    }
    if ((Array.isArray(expect) ? expect : [expect]).some(effect => !EFFECTS.has(effect))) {
      problems.push(`${label}: unknown effect ${JSON.stringify(expect)}`);
    }
    if (entry.probe.then !== undefined && (!Array.isArray(entry.probe.then) || entry.probe.then.length === 0)) {
      problems.push(`${label}: then is a non-empty list of steps`);
    }
    if (entry.probe.forbid !== undefined && (!Array.isArray(entry.probe.forbid) || entry.probe.forbid.some(effect => !EFFECTS.has(effect) || effect === 'any'))) {
      problems.push(`${label}: forbid is a list of effects`);
    }
  }

  assert.deepEqual(problems, []);
});

const EFFECTS = new Set(['selection-moves', 'selection-changes', 'editor-opens', 'editor-closes', 'value-changes', 'menu-opens',
  'menu-closes', 'menu-moves', 'comment-opens', 'comment-closes', 'scrolls', 'sorts', 'merges', 'freezes', 'clipboard',
  'caret-moves', 'text-changes', 'focus-moves', 'focus-leaves', 'link-opens', 'collapses', 'filters', 'list-moves', 'row-selection-changes',
  'comment-changes', 'filter-list-moves', 'filter-checked-changes', 'any']);

/**
 * The snapshot the walker takes around a key press.
 *
 * @param {object} [fields] Fields to replace.
 * @returns {object} The snapshot.
 */
function snapshot(fields = {}) {
  return {
    highlight: [1, 1], ranges: [[1, 1, 1, 1]], editorOpen: false, editorText: null, caret: null, menus: 0, menuItem: null,
    comment: false, dataHash: 'h1', scroll: [0, 0], sorting: '[]', merged: 0, frozen: '0,0', clipboard: 0, links: 0,
    collapsed: '', filtered: '', listSelection: null, rowSelection: null, focusedText: null, commentText: null, filterList: null, filterChecked: null,
    active: { region: 'grid', key: 'cell|1,1' }, ...fields,
  };
}

test('the effects between two snapshots name what a key changed', () => {
  assert.deepEqual(effectsBetween(snapshot(), snapshot()), []);
  // A field the cell editor does not own (the formula bar's address box) rewrites its text with no editor open.
  assert.deepEqual(effectsBetween(snapshot({ focusedText: 'C3' }), snapshot({ focusedText: 'A1' })), ['text-changes']);
  assert.deepEqual(effectsBetween(snapshot(), snapshot({ focusedText: 'A1', active: { region: 'grid', key: 'grid|ht-slot-top|INPUT#1|' } })),
    ['focus-moves'], 'a focus that moved into a field with text in it changed no text');
  assert.deepEqual(effectsBetween(snapshot(), snapshot({ highlight: [2, 1], ranges: [[2, 1, 2, 1]], active: { region: 'grid', key: 'cell|2,1' } })),
    ['focus-moves', 'selection-changes', 'selection-moves']);
  assert.deepEqual(effectsBetween(snapshot(), snapshot({ editorOpen: true, editorText: 'x', active: { region: 'grid', key: 'textarea' } })),
    ['editor-opens', 'focus-moves'], 'the editor that opens with text in it changed no text');
  assert.deepEqual(effectsBetween(snapshot({ menus: 2 }), snapshot({ menus: 1 })), ['menu-closes']);
  assert.deepEqual(effectsBetween(snapshot({ editorOpen: true, listSelection: '[[0,0,0,0]]' }),
    snapshot({ editorOpen: true, listSelection: '[[1,0,1,0]]', rowSelection: '[2]' })), ['list-moves', 'row-selection-changes']);
  assert.deepEqual(effectsBetween(snapshot(), snapshot({ active: { region: 'body', key: 'body' } })), ['focus-leaves', 'focus-moves']);
  assert.deepEqual(effectsBetween(snapshot({ comment: true }), snapshot({ commentText: 'Checked' })), ['comment-changes', 'comment-closes'],
    'the comment saved on the cell the editor was open on');
  assert.deepEqual(effectsBetween(snapshot({ commentText: 'Note' }), snapshot({ highlight: [2, 1], commentText: null })), ['selection-moves'],
    'another cell\'s comment is not a change');
});

test('the column filter\'s value list has effects of its own: its highlight moves, its checked values change', () => {
  // The Filter by value list is a grid of its own inside the open column menu; both fields read null while the menu is closed.
  const menu = { menus: 1, filterList: '[[1,0,1,0]]', filterChecked: '["F1","F2","F3"]' };

  assert.deepEqual(effectsBetween(snapshot(menu), snapshot({ ...menu, filterList: '[[2,0,2,0]]' })), ['filter-list-moves']);
  assert.deepEqual(effectsBetween(snapshot(menu), snapshot({ ...menu, filterChecked: '[]' })), ['filter-checked-changes'], 'Select none');
  assert.deepEqual(effectsBetween(snapshot(), snapshot(menu)), ['menu-opens'], 'a menu that opens moved no highlight and changed no value');
  assert.deepEqual(effectsBetween(snapshot(menu), snapshot()), ['menu-closes'], 'nor did one that closes');
  assert.deepEqual(probeVerdict({ expect: 'filter-list-moves', forbid: ['filter-checked-changes'], before: snapshot(menu),
    after: snapshot({ ...menu, filterList: '[[2,0,2,0]]', filterChecked: '["F1"]' }) }).status, 'unexpected', 'an arrow key must not tick an item');
});

test('a probe is ok, did nothing, did something else, or moved the focus out of the grid', () => {
  assert.deepEqual(probeVerdict({ expect: 'selection-moves', before: snapshot(), after: snapshot({ highlight: [2, 1] }) }),
    { status: 'ok', effects: ['selection-moves'] });
  assert.equal(probeVerdict({ expect: 'selection-moves', before: snapshot(), after: snapshot() }).status, 'nothing');
  assert.equal(probeVerdict({ expect: ['menu-opens', 'editor-opens'], before: snapshot(), after: snapshot({ editorOpen: true }) }).status, 'ok');
  assert.equal(probeVerdict({ expect: 'menu-opens', before: snapshot(), after: snapshot({ scroll: [10, 0] }) }).status, 'unexpected');
  assert.equal(probeVerdict({ expect: 'selection-moves', before: snapshot(), after: snapshot({ highlight: null, active: { region: 'body', key: 'body' } }) }).status,
    'focus-left', 'leaving the grid wins over everything a key also did');
  assert.equal(probeVerdict({ expect: 'focus-leaves', before: snapshot(), after: snapshot({ active: { region: 'end', key: 'end' } }) }).status, 'ok');
  assert.equal(probeVerdict({ expect: 'any', before: snapshot(), after: snapshot({ clipboard: 1 }) }).status, 'ok');
  // Escape on the comment editor closes it and must not save what was typed.
  assert.deepEqual(probeVerdict({ expect: 'comment-closes', forbid: ['comment-changes'], before: snapshot({ comment: true }), after: snapshot({ commentText: 'Discarded' }) }),
    { status: 'unexpected', effects: ['comment-changes', 'comment-closes'] });
  assert.equal(probeVerdict({ expect: 'comment-closes', forbid: ['comment-changes'], before: snapshot({ comment: true }), after: snapshot() }).status, 'ok');
});

test('a key that closes the editor closed it: it did not edit the text, move the caret or move the list', () => {
  // A closed editor's text, caret and list read null, so every close would otherwise read as an edit too.
  const editing = snapshot({ editorOpen: true, editorText: 'F6', caret: [2, 2], listSelection: '[[0,0,0,0]]', active: { region: 'grid', key: 'textarea' } });
  const closed = snapshot({ highlight: [2, 1], ranges: [[2, 1, 2, 1]], active: { region: 'grid', key: 'cell|2,1' } });

  for (const expect of ['text-changes', 'caret-moves', 'list-moves']) {
    assert.deepEqual(probeVerdict({ expect, before: editing, after: closed }),
      { status: 'unexpected', effects: ['editor-closes', 'focus-moves', 'selection-changes', 'selection-moves'] }, expect);
  }
  assert.equal(probeVerdict({ expect: 'caret-moves', before: editing, after: { ...editing, caret: [1, 1] } }).status, 'ok');
  assert.equal(probeVerdict({ expect: 'text-changes', before: editing, after: { ...editing, editorText: 'F' } }).status, 'ok');
  assert.equal(probeVerdict({ expect: 'list-moves', before: editing, after: { ...editing, listSelection: '[[1,0,1,0]]' } }).status, 'ok');
});

test('the walker\'s findings are valid evidence', () => {
  const stops = [stop('start'), stop('grid', { name: '', ref: 2, locator: 'button.x' }), cell(0, 0), cell(0, 1), cell(0, 0)];
  const findings = [
    ...walkFindings({ walk: walkVerdict({ direction: 'forward', stops }), stops, direction: 'forward' }),
    ...escapeFindings({ state: 'editor', closedAfter: null, presses: 3, focusReturned: false }),
  ];
  const part = {
    schema: EVIDENCE_SCHEMA, target: { page: 'grid', theme: 'main', state: 'none' }, durationMs: 1, findings,
  };

  assert.deepEqual(validatePart(part), []);
  assert.deepEqual(findings.map(item => item.kind), ['focus-stop-unnamed', 'keyboard-trap', 'escape-does-not-close']);
});
