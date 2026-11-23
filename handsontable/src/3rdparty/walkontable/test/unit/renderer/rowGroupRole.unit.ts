import { RowsRenderer } from 'walkontable/render/rows';
import { ColumnHeaderRowsRenderer } from 'walkontable/render/columnHeaderRows';
import type { TableRenderer } from 'walkontable/render/tableRenderer';
import type { AriaTreeLayout } from 'walkontable/overlay/ariaCells';

interface SectionState {
  size: number;
  ariaEnabled: boolean;
  columns: number;
  rowHeaders: number;
}

/**
 * The grid a section belongs to when it joins the single accessibility tree: its layout, and the table the
 * section is drawn in.
 */
interface TreeContext {
  layout: AriaTreeLayout | null;
  overlay: string;
}

/**
 * Builds a rows renderer over a real TBODY with the smallest table stub `render()` reads.
 *
 * @param {TreeContext} [tree] The grid's tree layout and the table the section is drawn in.
 * @returns {{ rootNode: HTMLElement, draw: Function }}
 */
function createBody(tree: TreeContext = { layout: null, overlay: 'master' }) {
  const rootNode = document.createElement('tbody');
  const renderer = new RowsRenderer(rootNode);
  const state: SectionState = { size: 0, ariaEnabled: true, columns: 3, rowHeaders: 1 };

  renderer.setTable({
    rootDocument: document,
    get rowsToRender() {
      return state.size;
    },
    get columnsToRender() {
      return state.columns;
    },
    get rowHeadersCount() {
      return state.rowHeaders;
    },
    renderedRowToSource: (renderedRow: number) => renderedRow,
    isAriaEnabled: () => state.ariaEnabled,
    getAriaTreeLayout: () => tree.layout,
    activeOverlayName: tree.overlay,
    isRowRecyclingAllowed: () => false,
    renderEpoch: 0,
  } as unknown as TableRenderer);

  const draw = (size: number, ariaEnabled = true, columns = 3, rowHeaders = 1) => {
    state.size = size;
    state.ariaEnabled = ariaEnabled;
    state.columns = columns;
    state.rowHeaders = rowHeaders;
    renderer.render();
  };

  return { rootNode, draw };
}

/**
 * Builds a column header rows renderer over a real THEAD with the smallest table stub `render()` reads.
 *
 * @param {TreeContext} [tree] The grid's tree layout and the table the section is drawn in.
 * @returns {{ rootNode: HTMLElement, draw: Function }}
 */
function createHead(tree: TreeContext = { layout: null, overlay: 'master' }) {
  const rootNode = document.createElement('thead');
  const renderer = new ColumnHeaderRowsRenderer(rootNode);
  const state: SectionState = { size: 0, ariaEnabled: true, columns: 3, rowHeaders: 1 };

  renderer.setTable({
    rootDocument: document,
    get columnHeadersCount() {
      return state.size;
    },
    get columnsToRender() {
      return state.columns;
    },
    get rowHeadersCount() {
      return state.rowHeaders;
    },
    isAriaEnabled: () => state.ariaEnabled,
    getAriaTreeLayout: () => tree.layout,
    activeOverlayName: tree.overlay,
  } as unknown as TableRenderer);

  const draw = (size: number, ariaEnabled = true, columns = 3, rowHeaders = 1) => {
    state.size = size;
    state.ariaEnabled = ariaEnabled;
    state.columns = columns;
    state.rowHeaders = rowHeaders;
    renderer.render();
  };

  return { rootNode, draw };
}

describe.each([
  ['the body section (RowsRenderer)', createBody],
  ['the head section (ColumnHeaderRowsRenderer)', createHead],
])('the rowgroup role of %s', (_, createSection) => {
  it('is set when the section holds rows', () => {
    const { rootNode, draw } = createSection();

    draw(2);

    expect(rootNode.children.length).toBe(2);
    expect(rootNode.getAttribute('role')).toBe('rowgroup');
  });

  it('is not set when the section holds no rows', () => {
    const { rootNode, draw } = createSection();

    draw(0);

    expect(rootNode.children.length).toBe(0);
    expect(rootNode.hasAttribute('role')).toBe(false);
  });

  it('is removed when a section that held rows is drawn with none', () => {
    const { rootNode, draw } = createSection();

    draw(3);
    draw(0);

    expect(rootNode.hasAttribute('role')).toBe(false);
  });

  it('comes back when an empty section gets rows again', () => {
    const { rootNode, draw } = createSection();

    draw(0);
    draw(1);

    expect(rootNode.getAttribute('role')).toBe('rowgroup');
  });

  it('leaves a role another module wrote on an empty section', () => {
    const { rootNode, draw } = createSection();

    rootNode.setAttribute('role', 'presentation');
    draw(0);

    expect(rootNode.getAttribute('role')).toBe('presentation');
  });

  it('is not set when the rows hold no cell: no column and no row header is rendered', () => {
    // The last draw of a side clone that was turned off: the master's rows, none of its columns.
    const { rootNode, draw } = createSection();

    draw(2, true, 0, 0);

    expect(rootNode.children.length).toBe(2);
    expect(rootNode.hasAttribute('role')).toBe(false);
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual([null, null]);
    expect(Array.from(rootNode.children, row => row.hasAttribute('aria-rowindex'))).toEqual([false, false]);
  });

  it('is taken off, with the rows\' own role, when the rows lose their cells', () => {
    const { rootNode, draw } = createSection();

    draw(2);
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual(['row', 'row']);

    draw(2, true, 0, 0);

    expect(rootNode.hasAttribute('role')).toBe(false);
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual([null, null]);
  });

  it('is set for rows that hold a row header and no column', () => {
    const { rootNode, draw } = createSection();

    draw(2, true, 0, 1);

    expect(rootNode.getAttribute('role')).toBe('rowgroup');
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual(['row', 'row']);
  });

  it('writes nothing when the grid writes no accessibility attributes', () => {
    const { rootNode, draw } = createSection();

    draw(2, false);

    expect(rootNode.hasAttribute('role')).toBe(false);
  });
});

describe.each([
  ['the body section (RowsRenderer)', createBody],
  ['the head section (ColumnHeaderRowsRenderer)', createHead],
])('in a grid that joins its tables into one tree, %s', (_, createSection) => {
  const layout: AriaTreeLayout = {
    totalRows: 6,
    totalColumns: 5,
    fixedRowsTop: 0,
    fixedRowsBottom: 0,
    fixedColumnsStart: 0,
    fixedColumnsEnd: 0,
    rowHeadersCount: 1,
  };

  it('is no row group in the master when the row headers lead the rows', () => {
    const { rootNode, draw } = createSection({ layout, overlay: 'master' });

    draw(2);

    expect(rootNode.hasAttribute('role')).toBe(false);
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual([null, null]);
    expect(Array.from(rootNode.children, row => row.hasAttribute('aria-rowindex'))).toEqual([false, false]);
  });

  it('takes the role off a master row that carried it before the tree joined the tables', () => {
    const tree: TreeContext = { layout: null, overlay: 'master' };
    const { rootNode, draw } = createSection(tree);

    draw(2);
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual(['row', 'row']);

    tree.layout = layout;
    draw(2);

    expect(rootNode.hasAttribute('role')).toBe(false);
    expect(Array.from(rootNode.children, row => row.hasAttribute('aria-rowindex'))).toEqual([false, false]);
  });
});

describe('in a grid that joins its tables into one tree, the body of the table that leads the rows', () => {
  it('is a row group of rows with their indexes', () => {
    const layout: AriaTreeLayout = {
      totalRows: 6,
      totalColumns: 5,
      fixedRowsTop: 0,
      fixedRowsBottom: 0,
      fixedColumnsStart: 0,
      fixedColumnsEnd: 0,
      rowHeadersCount: 1,
    };
    const { rootNode, draw } = createBody({ layout, overlay: 'inline_start' });

    draw(2, true, 0, 1);

    expect(rootNode.getAttribute('role')).toBe('rowgroup');
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual(['row', 'row']);
    expect(Array.from(rootNode.children, row => row.hasAttribute('aria-rowindex'))).toEqual([true, true]);
  });
});
