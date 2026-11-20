import { returnFocusToGrid } from 'handsontable/utils/menu/menu/utils';

/**
 * A grid stand-in with the members `returnFocusToGrid()` reads.
 *
 * @param {object} [overrides] Members to replace.
 * @returns {{hot: object, focusOnHighlightedCell: jest.Mock}} The stand-in and the call it records.
 */
function createGrid(overrides = {}) {
  const focusOnHighlightedCell = jest.fn();
  const rootElement = document.createElement('div');

  document.body.appendChild(rootElement);

  const hot = {
    isDestroyed: false,
    rootDocument: document,
    rootElement,
    getFocusManager: () => ({ focusOnHighlightedCell }),
    ...overrides,
  };

  return { hot, focusOnHighlightedCell };
}

describe('returnFocusToGrid', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should focus the highlighted cell when the focus fell to the document', () => {
    const { hot, focusOnHighlightedCell } = createGrid();

    returnFocusToGrid(hot);

    expect(focusOnHighlightedCell).toHaveBeenCalledTimes(1);
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
