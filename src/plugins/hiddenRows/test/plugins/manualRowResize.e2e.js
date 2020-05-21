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

  describe('manualRowResize', () => {
    it('should resize a proper row when the table contains hidden row using mouse events', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        rowHeaders: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        manualRowResize: true,
      });

      expect(rowHeight(spec().$container, 1)).toEqual(23);

      // Resize renderable row index `1` (within visual index term the index at 1 is hidden).
      resizeRow(1, 100);

      expect(rowHeight(spec().$container, 1)).toEqual(99);
    });

    it('should resize a proper row when the table contains hidden row using public API', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        rowHeaders: true,
        hiddenRows: {
          rows: [1],
          indicators: true
        },
        manualRowResize: true,
      });

      expect(rowHeight(spec().$container, 1)).toEqual(23);

      getPlugin('manualRowResize').setManualSize(2, 100);
      render();

      expect(rowHeight(spec().$container, 1)).toEqual(100);
    });

    it('should display the resize handler in the proper position when the table contains hidden row', () => {
      handsontable({
        data: [
          { id: 1, name: 'Ted', lastName: 'Right' },
          { id: 2, name: 'Frank', lastName: 'Honest' },
          { id: 3, name: 'Joan', lastName: 'Well' },
          { id: 4, name: 'Sid', lastName: 'Strong' },
          { id: 5, name: 'Jane', lastName: 'Neat' }
        ],
        rowHeaders: true,
        hiddenRows: {
          rows: [1],
          indicators: false
        },
        manualRowResize: true
      });

      const $headerTH = spec().$container.find('tbody tr:eq(1) th:eq(0)');

      $headerTH.simulate('mouseover');

      const $handle = $('.manualRowResizer');

      expect($handle.offset().top).toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - $handle.outerHeight() - 1, 0);
      expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
    });
  });
});
