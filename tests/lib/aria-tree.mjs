/**
 * The accessibility-tree check: the pure half.
 *
 * `a11y/checks/tree-snapshots.spec.ts` reads Chromium's accessibility tree of the grid's root
 * container and of its portal (CDP `Accessibility.getFullAXTree`, joined with a `DOMSnapshot` for each
 * node's tag and attributes), flattens it in reading order (the ignored nodes dropped, their children
 * kept), and hands the nodes here. The criteria: 1.3.1 Info and Relationships (the grid's rows, their
 * headers, the header names), 1.3.2 Meaningful Sequence (the order a screen reader reads the rows and
 * cells in) and 4.1.2 Name, Role, Value (every control has a name, every tab stop a role). The
 * snapshot goldens beside it (`a11y/tree-goldens/`) catch any other change, advisory. Policy:
 * `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

export const TREE_CHECK = 'tree-snapshots';
export const TREE_CRITERIA = ['1.3.1', '1.3.2', '4.1.2'];
// The widget roles that must carry an accessible name.
const NAMED_WIDGETS = new Set(['button', 'link', 'checkbox', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'tab', 'textbox',
  'combobox', 'searchbox', 'spinbutton', 'switch', 'radio', 'slider', 'treeitem', 'listbox', 'menu', 'dialog', 'alertdialog']);
const HEADERS = new Set(['columnheader', 'rowheader']);
const CELLS = new Set(['gridcell', 'cell', 'columnheader', 'rowheader']);
const GRIDS = new Set(['grid', 'treegrid', 'table']);
const NO_ROLE = new Set(['', 'generic', 'none', 'presentation']);
const READING_ORDER = 'the grid in reading order';
// The harness's portal mark (`PORTAL` in `a11y/harness.ts`): a node read in the portal is located under it.
const PORTAL_SELECTOR = '[data-a11y-scan-portal]';
// A cell's or a header's classes are rendering state (the selection's highlight, the last visible
// header, the class names a column sets), so a node on one is located by its tag and role alone.
const STATE_CLASSED = new Set(['td', 'th']);

/**
 * The rows of the page's grids in reading order, each with its cells (the nodes whose parent is the
 * row), the rowgroup it sits in (its parent when that is a rowgroup, otherwise the last rowgroup read
 * before it), whether its own rowgroup is a table head (`thead`), and the grid it belongs to: its
 * nearest grid, treegrid or table ancestor.
 *
 * @param {object[]} nodes The flattened tree, in reading order.
 * @returns {Array<{id: string, rowindex: number|null, group: string|null, head: boolean, grid: string|null, cells: object[]}>} The rows.
 */
export function gridRows(nodes) {
  const byId = new Map(nodes.map(item => [item.id, item]));
  const gridOf = (item) => {
    let ancestor = byId.get(item.parent);

    while (ancestor && !GRIDS.has(ancestor.role)) {
      ancestor = byId.get(ancestor.parent);
    }

    return ancestor?.id ?? null;
  };
  const rows = [];
  const rowById = new Map();
  let group = null;

  for (const item of nodes) {
    if (item.role === 'rowgroup') {
      group = item.id;
    } else if (item.role === 'row') {
      const parent = byId.get(item.parent);
      const entry = {
        id: item.id,
        rowindex: toIndex(item.attrs?.['aria-rowindex']),
        group: parent?.role === 'rowgroup' ? parent.id : group,
        // Only the row's own rowgroup: a row with none would otherwise inherit another table's head.
        head: parent?.role === 'rowgroup' && parent.tag === 'thead',
        grid: gridOf(item),
        cells: [],
      };

      rows.push(entry);
      rowById.set(item.id, entry);
    } else if (CELLS.has(item.role) && rowById.has(item.parent)) {
      rowById.get(item.parent).cells.push({ ...item, colindex: toIndex(item.attrs?.['aria-colindex']) });
    }
  }

  return rows;
}

/**
 * The structural findings of the grids read in order: the column headers read after the data (1.3.2),
 * row headers exposed in rows of their own instead of in the rows they label (1.3.1), a row exposed
 * twice (1.3.1), cells or rows read out of their index order (1.3.2), and a grid with no row (1.3.1).
 * Each grid is judged on its own rows (a list inside the page, the handsontable editor's or the filters'
 * value list, is a grid of its own). The first one is read under `READING_ORDER`, every other one under
 * its place among the grids with rows. A page without a grid role is not judged.
 *
 * @param {object[]} nodes The flattened tree, in reading order.
 * @returns {object[]} The findings.
 */
export function structureFindings(nodes) {
  if (!nodes.some(item => GRIDS.has(item.role))) {
    return [];
  }

  const rows = gridRows(nodes).filter(item => item.cells.length > 0);

  if (rows.length === 0) {
    return [finding('grid-without-rows', ['1.3.1'], 'serious', {}, 'The grid exposes no row with a cell, so a screen reader finds nothing to read in it')];
  }

  const grids = new Map();

  for (const item of rows) {
    grids.set(item.grid, [...(grids.get(item.grid) ?? []), item]);
  }

  return [...grids.values()].flatMap((own, index) => gridFindings(own, index === 0 ? READING_ORDER : `grid ${index + 1} in reading order`));
}

/**
 * The structural findings of one grid's rows. A row of a table head is never a data row: the corner
 * clone repeats the head row with its corner cell alone.
 *
 * @param {object[]} rows The grid's rows with a cell, in reading order.
 * @param {string} step Where the findings are.
 * @returns {object[]} The findings.
 */
function gridFindings(rows, step) {
  const findings = [];
  const isHeaderRow = item => item.cells.some(cell => cell.role === 'columnheader');
  const isDataRow = item => !item.head && !isHeaderRow(item) && item.cells.some(cell => cell.role === 'gridcell' || cell.role === 'cell');
  const firstHeaderRow = rows.findIndex(isHeaderRow);
  const firstDataRow = rows.findIndex(isDataRow);

  if (firstHeaderRow > -1 && firstDataRow > -1 && firstHeaderRow > firstDataRow) {
    findings.push(finding('headers-after-data', ['1.3.2'], 'moderate', { firstHeaderRow: firstHeaderRow + 1, firstDataRow: firstDataRow + 1 },
      'A screen reader reads the data rows before the column headers that label them', step));
  }

  const hasRowHeaders = rows.some(item => item.cells.some(cell => cell.role === 'rowheader'));
  const rowsWithoutHeader = rows.filter(item => isDataRow(item) && !item.cells.some(cell => cell.role === 'rowheader')).length;
  const headerOnlyRows = rows.filter(item => item.cells.every(cell => cell.role === 'rowheader')).length;

  if (hasRowHeaders && rowsWithoutHeader > 0) {
    findings.push(finding('row-headers-apart', ['1.3.1'], 'moderate', { rowsWithoutHeader, headerOnlyRows },
      'Data rows carry no row header while the row headers sit in rows of their own, so a cell is not related to its row header', step));
  }

  const counts = new Map();

  for (const item of rows.filter(entry => entry.rowindex !== null)) {
    counts.set(item.rowindex, (counts.get(item.rowindex) ?? 0) + 1);
  }

  const duplicated = [...counts].filter(([, count]) => count > 1).map(([index]) => index);

  if (duplicated.length > 0) {
    findings.push(finding('row-exposed-twice', ['1.3.1'], 'moderate', { duplicatedRowIndexes: duplicated.length, example: duplicated[0] },
      'The same row index is exposed by more than one row, so a screen reader meets one grid row twice', step));
  }

  const unordered = rows.filter((item) => {
    const indexes = item.cells.map(cell => cell.colindex).filter(index => index !== null);

    return indexes.some((index, position) => position > 0 && index <= indexes[position - 1]);
  });

  if (unordered.length > 0) {
    findings.push(finding('cells-out-of-order', ['1.3.2'], 'serious', { rows: unordered.length, example: unordered[0].rowindex },
      'A row\'s cells are read out of their column order', step));
  }

  for (let position = 1; position < rows.length; position++) {
    const [previous, current] = [rows[position - 1], rows[position]];

    if (previous.group === current.group && previous.rowindex !== null && current.rowindex !== null && current.rowindex < previous.rowindex) {
      findings.push(finding('rows-out-of-order', ['1.3.2'], 'serious', { after: previous.rowindex, row: current.rowindex },
        'Rows of one row group are read out of their row order', step));
      break;
    }
  }

  return findings;
}

/**
 * The name and role findings: a widget with no accessible name (4.1.2), a column or row header with no
 * name (1.3.1, 4.1.2), and a tab stop the tree gives no role (4.1.2). An empty grid cell needs no name:
 * its empty name is its value. One finding per kind, role and element (`selectorOf()`), with the number
 * of nodes.
 *
 * @param {object[]} nodes The flattened tree.
 * @returns {object[]} The findings.
 */
export function nameFindings(nodes) {
  const found = new Map();
  const add = (kind, criteria, severity, item, reason) => {
    const selector = selectorOf(item);
    const key = `${kind}|${item.role}|${selector}`;

    if (found.has(key)) {
      found.get(key).measured.nodes += 1;
    } else {
      found.set(key, { kind, criteria, severity, selector, measured: { role: item.role || 'none', nodes: 1 }, reason });
    }
  };

  for (const item of nodes) {
    const unnamed = String(item.name ?? '').trim() === '';

    if (NAMED_WIDGETS.has(item.role) && unnamed) {
      add('unnamed-control', ['4.1.2'], 'serious', item, `A ${item.role} has no accessible name`);
    } else if (HEADERS.has(item.role) && unnamed) {
      add('unnamed-header', ['1.3.1', '4.1.2'], 'moderate', item, `A ${item.role} has no accessible name, so it labels its cells with nothing`);
    } else if (NO_ROLE.has(item.role) && isTabStop(item)) {
      add('focusable-without-role', ['4.1.2'], 'serious', item, 'A tab stop has no role in the accessibility tree, so a screen reader cannot say what it is');
    }
  }

  return [...found.values()];
}

/**
 * The first line where an accessibility snapshot differs from its golden, or `null` when they match.
 *
 * @param {string} expected The golden.
 * @param {string} actual The snapshot.
 * @returns {{line: number, expected: string|null, actual: string|null, expectedLines: number, actualLines: number}|null} The difference.
 */
export function diffSnapshot(expected, actual) {
  const left = expected.split('\n');
  const right = actual.split('\n');

  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    if ((left[index] ?? null) !== (right[index] ?? null)) {
      return { line: index + 1, expected: left[index] ?? null, actual: right[index] ?? null, expectedLines: left.length, actualLines: right.length };
    }
  }

  return null;
}

/**
 * Whether a node is a tab stop: the tree marks it focusable (a `tabindex`, a native control, a link, an
 * editable region) and its `tabindex` is not negative (an element focusable by script only).
 *
 * @param {object} item The node.
 * @returns {boolean} Whether it is.
 */
function isTabStop(item) {
  return item.focusable === true && !(Number(item.attrs?.tabindex) < 0);
}

/**
 * A short selector for a node: the portal mark when it is read in the portal, its tag (`unknown` when it
 * has no DOM element), its first class unless it is a cell or a header (`STATE_CLASSED`), and its `role`
 * attribute.
 *
 * @param {object} item The node.
 * @returns {string} The selector.
 */
function selectorOf(item) {
  const tag = item.tag || 'unknown';
  const [first] = STATE_CLASSED.has(tag) ? [] : String(item.attrs?.class ?? '').split(/\s+/).filter(Boolean);
  const role = item.attrs?.role ? `[role="${item.attrs.role}"]` : '';

  return `${item.region === 'portal' ? `${PORTAL_SELECTOR} ` : ''}${tag}${first ? `.${first}` : ''}${role}`;
}

/**
 * A structural finding of a grid as a whole.
 *
 * @param {string} kind The kind.
 * @param {string[]} criteria The criteria.
 * @param {string} severity The severity.
 * @param {object} measured The values.
 * @param {string} reason The reason.
 * @param {string} [step] Where it is: the grid, or which one.
 * @returns {object} The finding.
 */
function finding(kind, criteria, severity, measured, reason, step = READING_ORDER) {
  return { kind, criteria, severity, step, measured, reason };
}

/**
 * An ARIA index attribute as a number, or `null`.
 *
 * @param {unknown} value The attribute.
 * @returns {number|null} The index.
 */
function toIndex(value) {
  const number = Number(value);

  return value === undefined || value === null || value === '' || !Number.isFinite(number) ? null : number;
}
