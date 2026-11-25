import { RowsRenderer } from 'walkontable/render/rows';
import { ColumnHeaderRowsRenderer } from 'walkontable/render/columnHeaderRows';
import type { TableRenderer } from 'walkontable/render/tableRenderer';

interface SectionState {
  size: number;
  ariaEnabled: boolean;
  columns: number;
  rowHeaders: number;
}

/**
 * Builds a rows renderer over a real TBODY with the smallest table stub `render()` reads.
 *
 * @returns {{ rootNode: HTMLElement, draw: Function }}
 */
function createBody() {
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
 * @returns {{ rootNode: HTMLElement, draw: Function }}
 */
function createHead() {
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
    expect(Array.from(rootNode.children, row => row.hasAttribute('aria-rowindex'))).toEqual([false, false]);

    // The row elements are reused: they get the role and the index back with their cells.
    draw(2);

    expect(rootNode.getAttribute('role')).toBe('rowgroup');
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual(['row', 'row']);
    expect(Array.from(rootNode.children, row => row.hasAttribute('aria-rowindex'))).toEqual([true, true]);
  });

  it('leaves a role another module wrote on a row that holds no cell', () => {
    const { rootNode, draw } = createSection();

    draw(2);
    rootNode.children[0].setAttribute('role', 'presentation');
    draw(2, true, 0, 0);

    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual(['presentation', null]);
    // The index goes with the `row` role only: a row with another role is not this module's to clear.
    expect(Array.from(rootNode.children, row => row.hasAttribute('aria-rowindex'))).toEqual([true, false]);
  });

  it('is set for rows that hold a row header and no column', () => {
    const { rootNode, draw } = createSection();

    draw(2, true, 0, 1);

    expect(rootNode.getAttribute('role')).toBe('rowgroup');
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual(['row', 'row']);
  });

  it('is set for rows that hold columns and no row header', () => {
    // `rowHeaders: false`: the most common shape of a grid.
    const { rootNode, draw } = createSection();

    draw(2, true, 3, 0);

    expect(rootNode.getAttribute('role')).toBe('rowgroup');
    expect(Array.from(rootNode.children, row => row.getAttribute('role'))).toEqual(['row', 'row']);
    expect(Array.from(rootNode.children, row => row.hasAttribute('aria-rowindex'))).toEqual([true, true]);
  });

  it('writes nothing when the grid writes no accessibility attributes', () => {
    const { rootNode, draw } = createSection();

    draw(2, false);

    expect(rootNode.hasAttribute('role')).toBe(false);
  });
});
