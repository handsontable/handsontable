describe('Selection cooperation with hidden rows', () => {
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

  it('should move down throughout the table when the last row is hidden', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      autoWrapCol: true,
      autoWrapRow: true,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(2, true);
    render();

    selectCell(0, 0); // Select cell "A1"

    keyDownUp('arrowdown'); // Move selection down to the end of the table
    keyDownUp('arrowdown'); // Move selection to the next column, to the cell "B1"

    expect(getSelected()).toEqual([[0, 1, 0, 1]]);
  });
});
