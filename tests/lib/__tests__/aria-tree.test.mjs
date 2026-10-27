import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffSnapshot, gridRows, nameFindings, structureFindings } from '../aria-tree.mjs';
import { validatePart, EVIDENCE_SCHEMA } from '../a11y-evidence.mjs';

// tests/AGENTS.md ("A11y: the checks beyond axe", the accessibility-tree snapshots): the verdicts the
// tree check derives from Chromium's accessibility tree of the grid and its portal. The spec
// (`a11y/checks/tree-snapshots.spec.ts`) flattens the tree in reading order; everything that decides a
// finding is here.

let ids = 0;

/**
 * A node of the flattened tree, in reading order.
 *
 * @param {string} role The role.
 * @param {object} [fields] The rest: name, parent, attrs, region, tag.
 * @returns {object} The node.
 */
function node(role, fields = {}) {
  ids += 1;

  return { id: String(ids), role, name: '', parent: null, region: 'grid', tag: 'div', attrs: {}, focusable: false, ...fields };
}

/**
 * A row with its cells, as consecutive nodes.
 *
 * @param {number} rowindex The row's `aria-rowindex`.
 * @param {Array<[string, string, number]>} cells Each cell's role, name and `aria-colindex`.
 * @returns {object[]} The nodes.
 */
function row(rowindex, cells) {
  const tr = node('row', { tag: 'tr', attrs: { 'aria-rowindex': String(rowindex) } });

  return [tr, ...cells.map(([role, name, colindex]) => node(role, { name, parent: tr.id, tag: role === 'gridcell' ? 'td' : 'th', attrs: { 'aria-colindex': String(colindex) } }))];
}

test('the rows of the grid are read in order with their cells', () => {
  const nodes = [node('treegrid'), ...row(1, [['gridcell', 'Select whole grid', 1], ['columnheader', 'A', 2]]), ...row(2, [['rowheader', '1', 1], ['gridcell', 'A1', 2]])];

  assert.deepEqual(gridRows(nodes).map(item => [item.rowindex, item.cells.map(cell => cell.role)]), [
    [1, ['gridcell', 'columnheader']],
    [2, ['rowheader', 'gridcell']],
  ]);
});

test('a well-built grid has no structural finding', () => {
  const nodes = [
    node('treegrid'),
    ...row(1, [['gridcell', 'Select whole grid', 1], ['columnheader', 'A', 2], ['columnheader', 'B', 3]]),
    ...row(2, [['rowheader', '1', 1], ['gridcell', 'A1', 2], ['gridcell', 'B1', 3]]),
    ...row(3, [['rowheader', '2', 1], ['gridcell', 'A2', 2], ['gridcell', 'B2', 3]]),
  ];

  assert.deepEqual(structureFindings(nodes), []);
});

test('the overlay shape is reported: headers read after the data, row headers apart from their rows, rows exposed twice', () => {
  // What Chromium reads from grid.html: the master table's rows carry the cells only, the top clone's
  // header row comes after them, and the start clone repeats every row with its header alone.
  const nodes = [
    node('treegrid'),
    node('rowgroup'),
    ...row(2, [['gridcell', 'A1', 2], ['gridcell', 'B1', 3]]),
    ...row(3, [['gridcell', 'A2', 2], ['gridcell', 'B2', 3]]),
    node('rowgroup'),
    ...row(1, [['gridcell', 'Select whole grid', 1], ['columnheader', 'A', 2], ['columnheader', 'B', 3]]),
    node('rowgroup'),
    ...row(2, [['rowheader', '1', 1]]),
    ...row(3, [['rowheader', '2', 1]]),
  ];
  const findings = structureFindings(nodes);

  assert.deepEqual(findings.map(item => [item.kind, item.criteria, item.severity]), [
    ['headers-after-data', ['1.3.2'], 'moderate'],
    ['row-headers-apart', ['1.3.1'], 'moderate'],
    ['row-exposed-twice', ['1.3.1'], 'moderate'],
  ]);
  assert.deepEqual(findings[0].measured, { firstHeaderRow: 3, firstDataRow: 1 });
  assert.deepEqual(findings[1].measured, { rowsWithoutHeader: 2, headerOnlyRows: 2 });
  assert.deepEqual(findings[2].measured, { duplicatedRowIndexes: 2, example: 2 });
});

test('cells and rows read out of their index order are a 1.3.2 finding', () => {
  const nodes = [
    node('grid'),
    ...row(1, [['columnheader', 'A', 1], ['columnheader', 'B', 2]]),
    ...row(3, [['gridcell', 'B2', 2], ['gridcell', 'A2', 1]]),
    ...row(2, [['gridcell', 'A1', 1], ['gridcell', 'B1', 2]]),
  ];

  assert.deepEqual(structureFindings(nodes).map(item => [item.kind, item.criteria, item.severity, item.measured]), [
    ['cells-out-of-order', ['1.3.2'], 'serious', { rows: 1, example: 3 }],
    ['rows-out-of-order', ['1.3.2'], 'serious', { after: 3, row: 2 }],
  ]);
});

test('a grid role with no row is reported, and a page with no grid role is not judged', () => {
  assert.deepEqual(structureFindings([node('treegrid')]).map(item => item.kind), ['grid-without-rows']);
  assert.deepEqual(structureFindings([node('generic'), node('button', { name: 'OK' })]), []);
});

test('a widget or a header with no name, and a focusable element with no role, are 4.1.2 findings', () => {
  const nodes = [
    node('button', { name: '', tag: 'button', attrs: { class: 'ht-page-next' } }),
    node('columnheader', { name: '', tag: 'th', attrs: { class: 'htLastVisibleHeader' } }),
    node('gridcell', { name: '', tag: 'td' }),
    node('generic', { focusable: true, tag: 'div', attrs: { class: 'ht-empty-data-state__content-wrapper-inner', tabindex: '0' } }),
    node('generic', { focusable: true, tag: 'td', attrs: { tabindex: '-1' } }),
    node('textbox', { name: '', tag: 'textarea', attrs: { class: 'handsontableInput' }, region: 'portal' }),
    node('button', { name: 'Close', tag: 'button' }),
  ];

  assert.deepEqual(nameFindings(nodes).map(item => [item.kind, item.criteria, item.severity, item.selector]), [
    ['unnamed-control', ['4.1.2'], 'serious', 'button.ht-page-next'],
    ['unnamed-header', ['1.3.1', '4.1.2'], 'moderate', 'th.htLastVisibleHeader'],
    ['focusable-without-role', ['4.1.2'], 'serious', 'div.ht-empty-data-state__content-wrapper-inner'],
    ['unnamed-control', ['4.1.2'], 'serious', 'textarea.handsontableInput'],
  ], 'an empty grid cell needs no name; an element focusable by script only (tabindex -1) is not a tab stop');
});

test('one finding per kind and element, however many nodes carry it', () => {
  const nodes = [
    node('button', { name: '', tag: 'button', attrs: { class: 'x' } }),
    node('button', { name: '', tag: 'button', attrs: { class: 'x' } }),
  ];
  const findings = nameFindings(nodes);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].measured.nodes, 2);
});

test('a snapshot that differs from its golden names its first differing line', () => {
  assert.equal(diffSnapshot('- treegrid:\n  - row "A1"', '- treegrid:\n  - row "A1"'), null);
  assert.deepEqual(diffSnapshot('- treegrid:\n  - row "A1"\n  - row "A2"', '- treegrid:\n  - row "A1 changed"\n  - row "A2"'),
    { line: 2, expected: '  - row "A1"', actual: '  - row "A1 changed"', expectedLines: 3, actualLines: 3 });
  assert.deepEqual(diffSnapshot('- a', '- a\n- b'), { line: 2, expected: null, actual: '- b', expectedLines: 1, actualLines: 2 });
});

test('the tree check\'s findings are valid evidence', () => {
  const nodes = [node('treegrid'), ...row(2, [['gridcell', 'A1', 2]]), ...row(1, [['columnheader', '', 2]]), node('button', { name: '' })];
  const findings = [...structureFindings(nodes), ...nameFindings(nodes)];

  assert.deepEqual(validatePart({ schema: EVIDENCE_SCHEMA, target: { page: 'grid', theme: 'main' }, durationMs: 1, findings }), []);
  assert.ok(findings.length >= 2);
});
