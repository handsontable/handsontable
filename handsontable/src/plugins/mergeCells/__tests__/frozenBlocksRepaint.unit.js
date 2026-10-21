import Handsontable from 'handsontable';

/**
 * Under `renderMode: 'onChange'` the plugin marks the merged blocks that cross a freeze line as changed when the
 * column widths changed. With `limitFixedToViewport` the line is the one the grid DRAWS, not the configured one.
 */
describe('MergeCells blocks that cross a frozen start line', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  function createGrid(drawnStart) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(6, 10),
      licenseKey: 'non-commercial-and-evaluation',
      renderMode: 'onChange',
      fixedColumnsStart: 6,
      limitFixedToViewport: true,
      mergeCells: [
        // columns 1 to 3: crosses a drawn line at 3, and not the configured one at 6
        { row: 1, col: 1, rowspan: 1, colspan: 3 },
        // columns 4 to 6: crosses the configured line at 6, and not the drawn one at 3
        { row: 2, col: 4, rowspan: 1, colspan: 3 },
      ],
    });

    // jsdom has no layout, so the counts the grid would draw are given here
    jest.spyOn(hot.view, 'countFixedColumnsStart').mockReturnValue(drawnStart);

    return hot;
  }

  it('should mark the blocks that cross the drawn line, not the configured one', () => {
    createGrid(3);

    const markCellChanged = jest.spyOn(hot, 'markCellChanged');

    // a change of a column width advances the epoch the plugin compares with
    hot.view.invalidateColumnWidthCache();
    hot.runHooks('beforeViewRender', false);

    expect(markCellChanged).toHaveBeenCalledWith(1, 1);
    expect(markCellChanged).not.toHaveBeenCalledWith(2, 4);
  });

  it('should mark the block that crosses the configured line when it is the line that is drawn', () => {
    createGrid(6);

    const markCellChanged = jest.spyOn(hot, 'markCellChanged');

    hot.view.invalidateColumnWidthCache();
    hot.runHooks('beforeViewRender', false);

    expect(markCellChanged).toHaveBeenCalledWith(2, 4);
    expect(markCellChanged).not.toHaveBeenCalledWith(1, 1);
  });
});
