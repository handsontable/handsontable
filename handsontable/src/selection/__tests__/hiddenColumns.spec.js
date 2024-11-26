describe('Selection cooperation with hidden columns', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should scroll viewport properly when selecting singe cell beyond the table boundaries (when some columns are hidden)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    render();

    selectCell(0, 15);

    expect(hot.view._wt.wtTable.getLastVisibleColumn()).toBe(12);
  });

  it('should scroll viewport properly when selecting multiple cells beyond the table boundaries (when some columns are hidden)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    render();

    selectCells([[0, 4], [0, 15]]);

    expect(hot.view._wt.wtTable.getLastVisibleColumn()).toBe(12);
  });

  it('should scroll viewport properly when selecting singe column beyond the table boundaries (when some columns are hidden)', () => {
    const hot = handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    render();

    selectColumns(15);

    expect(hot.view._wt.wtTable.getLastVisibleColumn()).toBe(12);
  });

  it('should move to the right throughout the table when the last column is hidden', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      autoWrapCol: true,
      autoWrapRow: true,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(2, true);
    render();

    selectCell(0, 0); // Select cell "A1"

    keyDownUp('arrowright'); // Move selection to the right edge of the table
    keyDownUp('arrowright'); // Move selection to first column, to the cell "A2"

    expect(getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  it('should not throw an error after hiding already selected column when visual selection is disabled (#dev-2084)', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      disableVisualSelection: true,
    });

    selectColumns(1);

    expect(() => {
      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValueAtIndex(2, true);
    }).not.toThrow();
  });
});
