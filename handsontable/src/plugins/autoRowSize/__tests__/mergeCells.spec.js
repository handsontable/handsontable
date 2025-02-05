describe('MergeCells', () => {
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

  it('should correctly calculate row height for merged cell (#dev-941)', () => {
    const data = createSpreadsheetData(2, 9);

    data[0][0] = 'value value';

    handsontable({
      data,
      colWidths: [30],
      autoRowSize: true,
      mergeCells: [{
        row: 0,
        col: 0,
        rowspan: 1,
        colspan: 8
      }],
    });

    expect(getRowHeight(0)).forThemes(({ classic, main }) => {
      classic.toBe(23);
      main.toBe(29);
    });
    expect(getRowHeight(1)).forThemes(({ classic, main }) => {
      classic.toBe(23);
      main.toBe(29);
    });
  });
});
