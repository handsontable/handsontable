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

      expect(rowHeight(spec().$container, 1)).forThemes(({ classic, main }) => {
        classic.toEqual(23);
        main.toEqual(29);
      });

      // Resize renderable row index `1` (within visual index term the index at 1 is hidden).
      resizeRow(1, 100);

      expect(rowHeight(spec().$container, 1)).toEqual(100);
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

      expect(rowHeight(spec().$container, 1)).forThemes(({ classic, main }) => {
        classic.toEqual(23);
        main.toEqual(29);
      });

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

      const $headerTH = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

      $headerTH.simulate('mouseover');

      const $handle = $('.manualRowResizer');

      expect($handle.offset().top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - $handle.outerHeight() - 1, 0);
        main.toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - ($handle.outerHeight() / 2) - 1, 0);
      });
      expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
    });

    it('should display the resize handler in the proper position when the table contains hidden fixed top row', () => {
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
          indicators: true,
        },
        fixedRowsTop: 3,
        manualRowResize: true
      });

      // Show resize handler using the third renderable row. This row belongs to master as
      // the "fixedRowsTop" is decreased to 2.
      const $headerTH = getInlineStartClone().find('tbody tr:eq(2) th:eq(0)');

      $headerTH.simulate('mouseover');

      const $handle = $('.manualRowResizer');

      expect($handle.offset().top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - $handle.outerHeight() - 1, 0);
        main.toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - ($handle.outerHeight() / 2) - 1, 0);
      });
      expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
    });

    it('should display the resize handler in the proper position when the table contains hidden fixed bottom row', () => {
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
          rows: [3],
          indicators: true,
        },
        fixedRowsBottom: 3,
        manualRowResize: true
      });

      // Show resize handler using the second renderable row. This row belongs to master as
      // the "fixedRowsBottom" is decreased to 2.
      const $headerTH = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

      $headerTH.simulate('mouseover');

      const $handle = $('.manualRowResizer');

      expect($handle.offset().top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - $handle.outerHeight() - 1, 0);
        main.toBeCloseTo($headerTH.offset().top + $headerTH.outerHeight() - ($handle.outerHeight() / 2) - 1, 0);
      });
      expect($handle.width()).toBeCloseTo($headerTH.outerWidth(), 0);
    });

    it('should resize a proper row using the resize handler when the table contains hidden row', () => {
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

      const $headerTH = getInlineStartClone().find('tbody tr:eq(1) th:eq(0)');

      $headerTH.simulate('mouseover');

      const $resizer = spec().$container.find('.manualRowResizer');
      const resizerPosition = $resizer.position();

      $resizer
        .simulate('mousedown', { clientY: resizerPosition.top })
        .simulate('mousemove', { clientY: resizerPosition.top + 30 })
        .simulate('mouseup')
      ;

      expect(rowHeight(spec().$container, 1)).forThemes(({ classic, main }) => {
        classic.toEqual(53);
        main.toEqual(59);
      });
    });
  });
});
