import { returnFocusToGrid } from 'handsontable/utils/menu/menu/utils';

/**
 * A grid stand-in with the members `returnFocusToGrid()` reads.
 *
 * @param {object} [overrides] Members to replace.
 * @returns {{hot: object, cell: HTMLElement, focusOnHighlightedCell: jest.Mock}} The stand-in and the call it records.
 */
function createGrid(overrides = {}) {
  const focusOnHighlightedCell = jest.fn();
  const rootElement = document.createElement('div');
  const cell = document.createElement('td');

  document.body.appendChild(rootElement);

  const hot = {
    isDestroyed: false,
    rootDocument: document,
    rootElement,
    getSelectedRangeActive: () => ({ highlight: { row: 1, col: 2 } }),
    getCell: jest.fn(() => cell),
    getFocusManager: () => ({ focusOnHighlightedCell }),
    ...overrides,
  };

  return { hot, cell, focusOnHighlightedCell };
}

describe('returnFocusToGrid', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should focus the rendered highlighted cell when the focus fell to the document', () => {
    const { hot, cell, focusOnHighlightedCell } = createGrid();

    returnFocusToGrid(hot);

    expect(hot.getCell).toHaveBeenCalledWith(1, 2, true);
    expect(focusOnHighlightedCell).toHaveBeenCalledTimes(1);
    expect(focusOnHighlightedCell).toHaveBeenCalledWith(cell);
  });

  it('should leave the focus on the document when the highlighted cell is not rendered', () => {
    const { hot, focusOnHighlightedCell } = createGrid({ getCell: () => null });

    returnFocusToGrid(hot);

    // Without a cell the focus manager would wait for the next scroll and take the focus later.
    expect(focusOnHighlightedCell).not.toHaveBeenCalled();
  });

  it('should do nothing when the grid has no selection', () => {
    const { hot, focusOnHighlightedCell } = createGrid({ getSelectedRangeActive: () => undefined });

    returnFocusToGrid(hot);

    expect(focusOnHighlightedCell).not.toHaveBeenCalled();
  });

  it('should take the focus from the closed menu container', () => {
    const { hot, cell, focusOnHighlightedCell } = createGrid();
    const container = document.createElement('div');

    container.tabIndex = -1;
    document.body.appendChild(container);
    container.focus();

    expect(document.activeElement).toBe(container);

    returnFocusToGrid(hot, container);

    expect(focusOnHighlightedCell).toHaveBeenCalledWith(cell);
  });

  it('should leave the focus on an element outside the closed menu container', () => {
    const { hot, focusOnHighlightedCell } = createGrid();
    const container = document.createElement('div');
    const input = document.createElement('input');

    document.body.append(container, input);
    input.focus();

    returnFocusToGrid(hot, container);

    expect(focusOnHighlightedCell).not.toHaveBeenCalled();
  });

  it('should leave the focus on an element that holds it', () => {
    const { hot, focusOnHighlightedCell } = createGrid();
    const input = document.createElement('input');

    document.body.appendChild(input);
    input.focus();

    expect(document.activeElement).toBe(input);

    returnFocusToGrid(hot);

    expect(focusOnHighlightedCell).not.toHaveBeenCalled();
  });

  it('should do nothing for a destroyed grid', () => {
    const { hot, focusOnHighlightedCell } = createGrid({ isDestroyed: true });

    returnFocusToGrid(hot);

    expect(focusOnHighlightedCell).not.toHaveBeenCalled();
  });

  it('should do nothing for a grid whose root is detached from the page', () => {
    const { hot, focusOnHighlightedCell } = createGrid();

    hot.rootElement.remove();

    returnFocusToGrid(hot);

    expect(focusOnHighlightedCell).not.toHaveBeenCalled();
  });
});
