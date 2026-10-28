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

test('a backward walk names its steps Shift+Tab; a popup walk counts from where the popup put the focus', () => {
  const stops = [stop('end'), stop('grid', { name: '', ref: 1, locator: 'button.x' }), stop('start')];
  const findings = walkFindings({ walk: walkVerdict({ direction: 'backward', stops }), stops, direction: 'backward' });

  assert.equal(findings[0].step, 'Shift+Tab 1');

  const popup = [stop('start'), stop('portal', { name: '', ref: 1, locator: 'textarea' }), stop('portal', { name: '', ref: 2, locator: 'input' })];

  assert.deepEqual(walkFindings({ walk: walkVerdict({ direction: 'forward', stops: popup }), stops: popup, direction: 'forward', opened: true })
    .map(item => item.step), ['where the popup put the focus', 'Tab 1']);
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
  }

  assert.deepEqual(problems, []);
});

const EFFECTS = new Set(['selection-moves', 'selection-changes', 'editor-opens', 'editor-closes', 'value-changes', 'menu-opens',
  'menu-closes', 'menu-moves', 'comment-opens', 'comment-closes', 'scrolls', 'sorts', 'merges', 'freezes', 'clipboard',
  'caret-moves', 'text-changes', 'focus-moves', 'focus-leaves', 'link-opens', 'collapses', 'filters', 'list-moves', 'row-selection-changes', 'any']);

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
    collapsed: '', filtered: '', listSelection: null, rowSelection: null, focusedText: null, active: { region: 'grid', key: 'cell|1,1' }, ...fields,
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
    ['editor-opens', 'focus-moves', 'text-changes']);
  assert.deepEqual(effectsBetween(snapshot({ menus: 2 }), snapshot({ menus: 1 })), ['menu-closes']);
  assert.deepEqual(effectsBetween(snapshot({ listSelection: '[[0,0,0,0]]' }), snapshot({ listSelection: '[[1,0,1,0]]', rowSelection: '[2]' })),
    ['list-moves', 'row-selection-changes']);
  assert.deepEqual(effectsBetween(snapshot(), snapshot({ active: { region: 'body', key: 'body' } })), ['focus-leaves', 'focus-moves']);
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
