import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DRAG_OPERATIONS, NOT_DRAG } from '../../a11y/checks/drag-operations.mjs';
import { A11Y_PAGES } from '../../a11y/pages.mjs';
import { actionEffects, cancellationFindings, dragFindings, gestureFindings, inventoryProblems, undeclaredPointerPlugins } from '../pointer.mjs';
import { EVIDENCE_SCHEMA, validatePart } from '../a11y-evidence.mjs';

// tests/AGENTS.md ("A11y: the checks beyond axe", pointer and drag alternatives): the verdicts behind
// 2.5.1, 2.5.2 and 2.5.7. The spec presses, drags and clicks; the inventory of drag operations is
// `a11y/checks/drag-operations.mjs`; the verdicts are here.

test('an action is what a press does to the grid; a selection, a focus or a hover highlight is not', () => {
  assert.deepEqual(actionEffects(['selection-changes', 'focus-moves', 'menu-moves', 'sorts', 'menu-opens']), ['menu-opens', 'sorts']);
  assert.deepEqual(actionEffects(['selection-moves', 'caret-moves', 'scrolls', 'list-moves']), []);
});

test('a control that acts on the press is a 2.5.2 finding; one that only opens a popup is advisory', () => {
  const target = { selector: 'button.ht-button', name: 'OK' };

  assert.deepEqual(cancellationFindings({ target, onPress: ['sorts'], afterAway: ['sorts'], onClick: ['sorts'] }).findings
    .map(item => [item.kind, item.criteria, item.severity, item.selector]), [['activates-on-press', ['2.5.2'], 'serious', 'button.ht-button "OK"']]);
  assert.deepEqual(cancellationFindings({ target, onPress: ['menu-opens'], afterAway: ['menu-opens'], onClick: ['menu-opens'] }).findings
    .map(item => [item.kind, item.severity]), [['activates-on-press', 'advisory']],
  'a popup opened on the press closes with Escape: a person decides whether that is the undo 2.5.2 allows');
  assert.deepEqual(cancellationFindings({ target, onPress: ['editor-opens', 'state-changes', 'text-changes'], afterAway: [], onClick: ['editor-opens'] })
    .findings.map(item => item.severity), ['advisory'], 'the text an opened editor reads and its aria-expanded come with the opening');
  assert.deepEqual(cancellationFindings({ target, onPress: ['editor-closes', 'value-changes'], afterAway: [], onClick: [] }).findings
    .map(item => item.severity), ['serious'], 'a list option that commits on the press is the function itself');
});

test('a control that completes after the pointer moved away is a 2.5.2 finding', () => {
  const result = cancellationFindings({ target: { selector: 'td.htCheckboxRendererInput' }, onPress: [], afterAway: ['value-changes'], onClick: ['value-changes'] });

  assert.deepEqual(result.findings.map(item => [item.kind, item.criteria, item.severity]), [['completes-after-pointer-left', ['2.5.2'], 'serious']]);
  assert.equal(result.measured, true);
  assert.deepEqual(cancellationFindings({ target: { selector: 'td' }, onPress: [], afterAway: ['menu-closes'], onClick: ['value-changes', 'menu-closes'] })
    .findings.map(item => item.kind), ['completes-after-pointer-left'], 'closing is the control\'s own action when its click closes too');
  assert.deepEqual(cancellationFindings({ target: { selector: 'td' }, onPress: [], afterAway: ['menu-closes'], onClick: ['value-changes'] }).findings, [],
    'a menu that closes when the pointer is released outside it was cancelled, which is the pass');
});

test('a control whose click does nothing the snapshot sees is not measured, and has no finding', () => {
  const quiet = cancellationFindings({ target: { selector: 'span' }, onPress: [], afterAway: [], onClick: ['focus-moves'] });

  assert.deepEqual(quiet, { findings: [], measured: false });
  assert.deepEqual(cancellationFindings({ target: { selector: 'button' }, onPress: [], afterAway: [], onClick: ['sorts'] }),
    { findings: [], measured: true }, 'acting on the click alone is the pass');
});

const OPERATION = {
  id: 'column-resize', plugin: 'manualColumnResize', operation: 'Resize a column by dragging its header edge', gesture: 'drag',
  page: 'resize-move', expect: 'resizes',
  alternatives: [
    { input: 'single-pointer', covers: 'partial', how: 'Double-click the handle fits the column to its content' },
    { input: 'keyboard', covers: 'full', how: 'Alt+ArrowRight widens the column' },
  ],
};

test('a drag needs a single-pointer alternative that does what the drag does (2.5.7) and a keyboard one (2.1.1)', () => {
  const findings = dragFindings({ operation: OPERATION, proven: [true, false] });

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.severity]), [
    ['drag-without-single-pointer-alternative', ['2.5.7'], 'serious'],
    ['drag-without-keyboard-alternative', ['2.1.1'], 'serious'],
    ['alternative-does-not-work', ['2.1.1'], 'serious'],
  ], 'a partial alternative does not meet 2.5.7, and a listed alternative that did nothing is a finding of its own');
  assert.match(findings[0].reason, /only part/);
  assert.deepEqual(dragFindings({
    operation: { ...OPERATION, alternatives: [{ input: 'single-pointer', covers: 'full', how: 'a' }, { input: 'keyboard', covers: 'full', how: 'b' }] },
    proven: [true, true],
  }), []);
});

test('a pointer press with a key held is neither a single-pointer nor a keyboard alternative', () => {
  const operation = { ...OPERATION, alternatives: [{ input: 'pointer-modifier', covers: 'full', how: 'Shift+click' }] };

  assert.deepEqual(dragFindings({ operation, proven: [true] }).map(item => item.kind),
    ['drag-without-single-pointer-alternative', 'drag-without-keyboard-alternative']);
});

test('a path-based or multipoint gesture without a single-pointer alternative is a 2.5.1 finding', () => {
  const swipe = { ...OPERATION, id: 'swipe', gesture: 'path', alternatives: [] };

  assert.deepEqual(gestureFindings({ operation: swipe, proven: [] }).map(item => [item.kind, item.criteria]),
    [['gesture-without-single-pointer-alternative', ['2.5.1']]]);
  assert.deepEqual(gestureFindings({ operation: OPERATION, proven: [true, false] }), [], 'a drag is 2.5.7, not 2.5.1');
});

test('the inventory refuses an entry it cannot run', () => {
  assert.deepEqual(inventoryProblems([OPERATION]), []);
  assert.deepEqual(inventoryProblems([{ ...OPERATION, gesture: 'wave' }, { ...OPERATION, alternatives: [{ input: 'voice', covers: 'full', how: 'x' }] }]), [
    'column-resize: gesture "wave" is not one of drag, path, multipoint',
    'column-resize: an id is used twice',
    'column-resize: alternative 1 has input "voice", not one of single-pointer, keyboard, pointer-modifier',
  ]);
});

test('every plugin that follows the pointer is in the inventory or says why it is not', () => {
  const inventory = [OPERATION];

  assert.deepEqual(undeclaredPointerPlugins({ tracking: ['manualColumnResize', 'contextMenu', 'freezeBar'], inventory, notDrag: { contextMenu: 'hover only' } }),
    { missing: ['freezeBar'], stale: [] });
  assert.deepEqual(undeclaredPointerPlugins({ tracking: ['manualColumnResize'], inventory, notDrag: { contextMenu: 'hover only' } }),
    { missing: [], stale: ['contextMenu'] }, 'a reason for a plugin that no longer follows the pointer is stale');
});

const SRC = fileURLToPath(new URL('../../../handsontable/src/', import.meta.url));
// A source follows the pointer when it listens to its moves, or follows a drag across cells or headers
// through the core's cell mouse-over hooks.
const FOLLOWS = /['"](mousemove|pointermove|touchmove)['"]|addHook\(\s*['"](before|after)OnCellMouseOver['"]/;

/**
 * The source files under a folder, tests left out.
 *
 * @param {string} folder The folder.
 * @returns {Array<{file: string, text: string}>} Each file, relative to the folder, and its text.
 */
function sources(folder) {
  return readdirSync(folder, { recursive: true }).map(String)
    .filter(file => /\.(ts|js)$/.test(file) && !file.includes('__tests__'))
    .map(file => ({ file, text: readFileSync(join(folder, file), 'utf8') }));
}

/**
 * The plugin folders that follow the pointer: their own source does, or it imports a module under
 * `src/utils/` that does (the column and row resize drags live in `utils/manualResize/resizeGesture.ts`).
 *
 * @returns {string[]} The folder names.
 */
function pluginsFollowingThePointer() {
  const plugins = join(SRC, 'plugins');
  const shared = sources(join(SRC, 'utils')).filter(({ text }) => FOLLOWS.test(text))
    .map(({ file }) => `/utils/${file.replace(/\.(ts|js)$/, '').split(sep).join('/')}'`);

  return readdirSync(plugins, { withFileTypes: true }).filter(entry => entry.isDirectory() && entry.name !== '__tests__')
    .filter(({ name }) => sources(join(plugins, name)).some(({ text }) => FOLLOWS.test(text) || shared.some(module => text.includes(module))))
    .map(entry => entry.name);
}

test('the drag inventory accounts for every plugin that follows the pointer, and every entry can run', () => {
  const tracking = pluginsFollowingThePointer();
  const known = ['autofill', 'formulaBuilder', 'freezeBar', 'manualColumnResize', 'manualRowResize', 'nestedHeaders'];

  assert.deepEqual(known.filter(name => !tracking.includes(name)), [],
    'the scan finds a move listener of the plugin\'s own, one in shared code under src/utils/, and a cell mouse-over hook');
  assert.deepEqual(undeclaredPointerPlugins({ tracking, inventory: DRAG_OPERATIONS, notDrag: NOT_DRAG }), { missing: [], stale: [] },
    'add the new drag to a11y/checks/drag-operations.mjs, or its reason to NOT_DRAG');
  assert.deepEqual(inventoryProblems(DRAG_OPERATIONS), []);
  for (const entry of DRAG_OPERATIONS.filter(item => item.page)) {
    assert.ok(A11Y_PAGES.some(page => page.id === entry.page), `${entry.id}: ${entry.page} is a catalog page`);
  }
});

test('the check\'s findings are valid evidence', () => {
  const findings = [
    ...cancellationFindings({ target: { selector: 'button' }, onPress: ['sorts'], afterAway: ['sorts'], onClick: ['sorts'] }).findings,
    ...dragFindings({ operation: OPERATION, proven: [true, false] }),
    ...gestureFindings({ operation: { ...OPERATION, gesture: 'multipoint', alternatives: [] }, proven: [] }),
  ];

  assert.deepEqual(validatePart({ schema: EVIDENCE_SCHEMA, target: { page: 'grid', theme: 'main' }, durationMs: 1, findings }), []);
});
