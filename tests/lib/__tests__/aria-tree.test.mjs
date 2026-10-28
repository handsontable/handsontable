import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffSnapshot, gridRows, nameFindings, structureFindings } from '../aria-tree.mjs';
import { findingId, validatePart, EVIDENCE_SCHEMA } from '../a11y-evidence.mjs';

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
 * @param {string|null} [parent] The row's parent node.
 * @returns {object[]} The nodes.
 */
function row(rowindex, cells, parent = null) {
  const tr = node('row', { tag: 'tr', parent, attrs: { 'aria-rowindex': String(rowindex) } });

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

test('each grid is judged on its own rows, so a grid inside the grid adds nothing to its findings', () => {
  // A list is a grid of its own inside the page: the handsontable editor's list
  // (cell-dropdown-arrow.html?cellType=handsontable) has one cell a row and no row header, and the
  // filters' value list (filters-value-list.html) numbers its rows from 1, so its row indexes repeat the grid's.
  const grid = node('treegrid');
  const body = node('rowgroup', { parent: grid.id, tag: 'tbody' });
  const list = node('table', { parent: grid.id, tag: 'table' });
  const listBody = node('rowgroup', { parent: list.id, tag: 'tbody' });
  const nodes = [
    grid,
    ...row(1, [['gridcell', 'Select whole grid', 1], ['columnheader', 'A', 2]], grid.id),
    body,
    ...row(2, [['rowheader', '1', 1], ['gridcell', 'Al', 2]], body.id),
    ...row(3, [['rowheader', '2', 1], ['gridcell', 'Al', 2]], body.id),
    list,
    listBody,
    ...row(2, [['cell', 'Alpha', 1]], listBody.id),
    ...row(3, [['cell', 'Alfa', 1]], listBody.id),
  ];

  assert.deepEqual(gridRows(nodes).map(item => item.grid), [grid.id, grid.id, grid.id, list.id, list.id]);
  assert.deepEqual(structureFindings(nodes), []);
});

test('a finding of a second grid names its place, so it keeps an id of its own', () => {
  const grid = node('treegrid');
  const list = node('table', { parent: grid.id, tag: 'table' });
  const nodes = [
    grid,
    ...row(1, [['gridcell', 'B1', 2], ['gridcell', 'A1', 1]], grid.id),
    list,
    ...row(1, [['cell', 'b', 2], ['cell', 'a', 1]], list.id),
  ];

  assert.deepEqual(structureFindings(nodes).map(item => [item.kind, item.step]), [
    ['cells-out-of-order', 'the grid in reading order'],
    ['cells-out-of-order', 'grid 2 in reading order'],
  ]);
});

test('the corner clone\'s head row, its corner cell alone, is not a data row', () => {
  // grid.html: the corner clone repeats the head row with the corner cell only, last in reading order.
  const grid = node('treegrid');
  const head = node('rowgroup', { parent: grid.id, tag: 'thead' });
  const body = node('rowgroup', { parent: grid.id, tag: 'tbody' });
  const corner = node('rowgroup', { parent: grid.id, tag: 'thead' });
  const nodes = [
    grid,
    head,
    ...row(1, [['gridcell', 'Select whole grid', 1], ['columnheader', 'A', 2]], head.id),
    body,
    ...row(2, [['rowheader', '1', 1], ['gridcell', 'A1', 2]], body.id),
    corner,
    ...row(1, [['gridcell', 'Select whole grid', 1]], corner.id),
  ];

  assert.deepEqual(structureFindings(nodes).map(item => item.kind), ['row-exposed-twice'],
    'the corner repeats the head row\'s index, and lacks no row header');
});

test('only a row whose own rowgroup is a table head is a head row', () => {
  // A row with no rowgroup of its own, in a grid read after another table's head, is not in that head.
  const table = node('table', { tag: 'table' });
  const head = node('rowgroup', { parent: table.id, tag: 'thead' });
  const grid = node('grid');
  const nodes = [
    table,
    head,
    ...row(1, [['columnheader', 'A', 1]], head.id),
    grid,
    ...row(1, [['gridcell', 'A1', 1]], grid.id),
  ];

  assert.deepEqual(gridRows(nodes).map(item => item.head), [true, false]);
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
    node('columnheader', { name: '', tag: 'th', attrs: { class: 'htLastVisibleHeader', role: 'columnheader' } }),
    node('gridcell', { name: '', tag: 'td' }),
    node('generic', { focusable: true, tag: 'div', attrs: { class: 'ht-empty-data-state__content-wrapper-inner', tabindex: '0' } }),
    node('generic', { focusable: true, tag: 'td', attrs: { tabindex: '-1' } }),
    node('textbox', { name: '', tag: 'textarea', attrs: { class: 'handsontableInput' }, region: 'portal' }),
    node('button', { name: 'Close', tag: 'button' }),
  ];

  assert.deepEqual(nameFindings(nodes).map(item => [item.kind, item.criteria, item.severity, item.selector]), [
    ['unnamed-control', ['4.1.2'], 'serious', 'button.ht-page-next'],
    ['unnamed-header', ['1.3.1', '4.1.2'], 'moderate', 'th[role="columnheader"]'],
    ['focusable-without-role', ['4.1.2'], 'serious', 'div.ht-empty-data-state__content-wrapper-inner'],
    ['unnamed-control', ['4.1.2'], 'serious', '[data-a11y-scan-portal] textarea.handsontableInput'],
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

test('a tab stop the tree marks focusable without a tabindex, like an editable region, is judged', () => {
  const nodes = [
    node('generic', { focusable: true, tag: 'div', attrs: { class: 'editable', contenteditable: 'true' } }),
    node('generic', { focusable: false, tag: 'div', attrs: { class: 'plain' } }),
  ];

  assert.deepEqual(nameFindings(nodes).map(item => [item.kind, item.selector]), [['focusable-without-role', 'div.editable']]);
});

test('a finding keeps its region and its role, so each one has an id of its own', () => {
  const nodes = [
    node('button', { tag: 'button', attrs: { class: 'x' } }),
    node('button', { tag: 'button', attrs: { class: 'x' }, region: 'portal' }),
    node('menuitem', { tag: 'td', attrs: { class: 'htItem', role: 'menuitem' }, region: 'portal' }),
    node('option', { tag: 'td', attrs: { class: 'htItem', role: 'option' }, region: 'portal' }),
  ];
  const findings = nameFindings(nodes);

  assert.deepEqual(findings.map(item => [item.selector, item.measured.role]), [
    ['button.x', 'button'],
    ['[data-a11y-scan-portal] button.x', 'button'],
    ['[data-a11y-scan-portal] td[role="menuitem"]', 'menuitem'],
    ['[data-a11y-scan-portal] td[role="option"]', 'option'],
  ]);
  assert.equal(new Set(findings.map(item => findingId('tree-snapshots', { ...item, page: 'grid', theme: 'main' }))).size, 4);
});

test('a header\'s state classes do not split its finding', () => {
  // The last visible header moves with the theme's column widths; the highlight moves with the selection.
  const nodes = [
    node('columnheader', { tag: 'th', attrs: { role: 'columnheader' } }),
    node('columnheader', { tag: 'th', attrs: { class: 'htLastVisibleHeader', role: 'columnheader' } }),
    node('columnheader', { tag: 'th', attrs: { class: 'ht__highlight', role: 'columnheader' } }),
  ];

  assert.deepEqual(nameFindings(nodes).map(item => [item.selector, item.measured.nodes]), [['th[role="columnheader"]', 3]]);
});

test('a node with no DOM element is located as unknown, never by an empty selector', () => {
  assert.deepEqual(nameFindings([node('button', { tag: '', attrs: {} })]).map(item => item.selector), ['unknown']);
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
