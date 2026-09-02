import Handsontable from '../../../index';

describe('NestedHeaders + suppressed column selection', () => {
  let container: HTMLElement;
  let hot: Handsontable;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(4, 6),
      colHeaders: true,
      rowHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
      nestedHeaders: [
        [{ label: 'Group AB', colspan: 2 }, 'C', 'D', 'E', 'F'],
        ['A', 'B', 'C', 'D', 'E', 'F'],
      ],
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  /**
   * Simulates the full mousedown hook pipeline for a header cell, with the
   * suppression flag optionally pre-set by an "earlier plugin" listener.
   */
  function fireHeaderMouseDown(row: number, col: number, presuppressed: boolean) {
    const event = new MouseEvent('mousedown', { bubbles: true });
    const coords = hot._createCellCoords(row, col);
    const TD = document.createElement('th');
    const controller = { row: false, column: presuppressed, cell: false };

    hot.runHooks('beforeOnCellMouseDown', event, coords, TD, controller);
    hot.runHooks('afterOnCellMouseDown', event, coords, TD);
  }

  it('applies span selection on a plain header mousedown (baseline)', () => {
    fireHeaderMouseDown(-2, 0, false);
    expect(hot.getSelectedLast()).toEqual([-2, 0, 3, 1]); // Group AB spans cols 0-1
  });

  it('skips span selection when an earlier listener suppressed column selection', () => {
    hot.selectCell(2, 4, 2, 4, false);
    fireHeaderMouseDown(-2, 0, true);
    expect(hot.getSelectedLast()).toEqual([2, 4, 2, 4]); // selection untouched
  });

  it('re-arms after a suppressed mousedown: the next plain mousedown selects', () => {
    fireHeaderMouseDown(-2, 0, true);
    fireHeaderMouseDown(-2, 0, false);
    expect(hot.getSelectedLast()).toEqual([-2, 0, 3, 1]);
  });
});
