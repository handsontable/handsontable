describe('Core.getCoords', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return coords of TH (row header)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
      rowHeaders: true,
    });

    expect(getCoords(getMaster().find('tbody tr:eq(1) th:eq(0)')[0])).toEqual(jasmine.objectContaining({
      row: 1,
      col: -1,
    }));
  });

  it('should return coords of TH (column header)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
      colHeaders: true,
    });

    expect(getCoords(getMaster().find('thead tr:eq(0) th:eq(1)')[0])).toEqual(jasmine.objectContaining({
      row: -1,
      col: 1,
    }));
  });

  it('should return visual coords of TD', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
      rowHeaders: true,
      colHeaders: true,
    });

    expect(getCoords(getMaster().find('tbody tr:eq(1) td:eq(1)')[0])).toEqual(jasmine.objectContaining({
      row: 1,
      col: 1,
    }));
  });
});
