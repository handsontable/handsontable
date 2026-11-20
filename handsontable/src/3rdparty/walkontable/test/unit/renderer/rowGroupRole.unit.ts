import { RowsRenderer } from 'walkontable/render/rows';
import { ColumnHeaderRowsRenderer } from 'walkontable/render/columnHeaderRows';
import type { TableRenderer } from 'walkontable/render/tableRenderer';

interface SectionState {
  size: number;
  ariaEnabled: boolean;
}

/**
 * Builds a rows renderer over a real TBODY with the smallest table stub `render()` reads.
 *
 * @returns {{ rootNode: HTMLElement, draw: Function }}
 */
function createBody() {
  const rootNode = document.createElement('tbody');
  const renderer = new RowsRenderer(rootNode);
  const state: SectionState = { size: 0, ariaEnabled: true };

  renderer.setTable({
    rootDocument: document,
    get rowsToRender() {
      return state.size;
    },
    renderedRowToSource: (renderedRow: number) => renderedRow,
    isAriaEnabled: () => state.ariaEnabled,
    isRowRecyclingAllowed: () => false,
    renderEpoch: 0,
  } as unknown as TableRenderer);

  const draw = (size: number, ariaEnabled = true) => {
    state.size = size;
    state.ariaEnabled = ariaEnabled;
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
  const state: SectionState = { size: 0, ariaEnabled: true };

  renderer.setTable({
    rootDocument: document,
    get columnHeadersCount() {
      return state.size;
    },
    isAriaEnabled: () => state.ariaEnabled,
  } as unknown as TableRenderer);

  const draw = (size: number, ariaEnabled = true) => {
    state.size = size;
    state.ariaEnabled = ariaEnabled;
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

  it('writes nothing when the grid writes no accessibility attributes', () => {
    const { rootNode, draw } = createSection();

    draw(2, false);

    expect(rootNode.hasAttribute('role')).toBe(false);
  });
});
