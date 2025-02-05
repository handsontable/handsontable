describe('HiddenColumns', () => {
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

  describe('manualColumnResize', () => {
    it('should resize a proper column when the table contains hidden column using mouse events', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        },
        manualColumnResize: true,
      });

      expect(colWidth(spec().$container, 1)).toBe(65); // 50 + 15 (indicator)

      // Resize renderable column index `1` (within visual index term the index at 1 is hidden).
      resizeColumn(1, 100);

      expect(colWidth(spec().$container, 1)).toBe(114); // 100 + 15 (indicator) - 1 (margin from overlay)
    });

    it('should resize a proper column when the table contains hidden column using public API', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
        },
        manualColumnResize: true,
      });

      expect(colWidth(spec().$container, 1)).toBe(50);

      getPlugin('manualColumnResize').setManualSize(2, 100);
      render();

      expect(colWidth(spec().$container, 1)).toBe(100);
    });

    it('should display the resize handler in the proper position when the table contains hidden column', () => {
      handsontable({
        data: [
          { id: 1, name: 'Ted', lastName: 'Right', addr: 'NYC' },
          { id: 2, name: 'Frank', lastName: 'Honest', addr: 'NYC' },
          { id: 3, name: 'Joan', lastName: 'Well', addr: 'NYC' },
          { id: 4, name: 'Sid', lastName: 'Strong', addr: 'NYC' },
          { id: 5, name: 'Jane', lastName: 'Neat', addr: 'NYC' }
        ],
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: false
        },
        manualColumnResize: true
      });

      const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)'); // Header "C"

      $headerTH.simulate('mouseover');

      const $handle = $('.manualColumnResizer');

      expect($handle.offset().left).forThemes(({ classic, main }) => {
        classic.toBe($headerTH.offset().left + $headerTH.outerWidth() - $handle.outerWidth() - 1);
        main.toBe($headerTH.offset().left + $headerTH.outerWidth() - ($handle.outerWidth() / 2) - 1);
      });
      expect($handle.height()).toBe($headerTH.outerHeight());
    });

    it('should display the resize handler in the proper position when the table contains hidden fixed left column', () => {
      handsontable({
        data: [
          { id: 1, name: 'Ted', lastName: 'Right', addr: 'NYC' },
          { id: 2, name: 'Frank', lastName: 'Honest', addr: 'NYC' },
          { id: 3, name: 'Joan', lastName: 'Well', addr: 'NYC' },
          { id: 4, name: 'Sid', lastName: 'Strong', addr: 'NYC' },
          { id: 5, name: 'Jane', lastName: 'Neat', addr: 'NYC' }
        ],
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true,
        },
        fixedColumnsStart: 3,
        manualColumnResize: true
      });

      // Show resize handler using the third renderable column. This column belongs to master as
      // the `fixedColumnsStart` setting is decreased to 2
      const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(2)'); // Header "D"

      $headerTH.simulate('mouseover');

      const $handle = $('.manualColumnResizer');

      expect($handle.offset().left).forThemes(({ classic, main }) => {
        classic.toBe($headerTH.offset().left + $headerTH.outerWidth() - $handle.outerWidth() - 1);
        main.toBe($headerTH.offset().left + $headerTH.outerWidth() - ($handle.outerWidth() / 2) - 1);
      });
      expect($handle.height()).toBe($headerTH.outerHeight());
    });

    it('should resize a proper column using the resize handler when the table contains hidden column', () => {
      handsontable({
        data: [
          { id: 1, name: 'Ted', lastName: 'Right', addr: 'NYC' },
          { id: 2, name: 'Frank', lastName: 'Honest', addr: 'NYC' },
          { id: 3, name: 'Joan', lastName: 'Well', addr: 'NYC' },
          { id: 4, name: 'Sid', lastName: 'Strong', addr: 'NYC' },
          { id: 5, name: 'Jane', lastName: 'Neat', addr: 'NYC' }
        ],
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: false
        },
        manualColumnResize: true
      });

      const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)'); // Header "C"

      $headerTH.simulate('mouseover');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      $resizer
        .simulate('mousedown', { clientX: resizerPosition.left })
        .simulate('mousemove', { clientX: resizerPosition.left + 30 })
        .simulate('mouseup')
      ;

      expect(colWidth(spec().$container, 1)).forThemes(({ classic, main }) => {
        classic.toBe(80); // 50 (initial column width) + 30
        main.toBe(93); // 63 (initial column width) + 30
      });
    });
  });
});
