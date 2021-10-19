describe('HiddenRows', () => {
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

  describe('getCoords', () => {
    it('should return visual coords of TD when some rows are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2],
          indicators: true,
        },
      });

      expect(getCoords(getMaster().find('tbody tr:eq(1) td:eq(1)')[0])).toEqual(jasmine.objectContaining({
        row: 3,
        col: 1,
      }));
    });
  });
});
