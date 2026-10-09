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
    it('should resize a proper column when the table contains hidden column using mouse events', async() => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        },
        manualColumnResize: true,
      });

      expect(colWidth(spec().$container, 1)).toBe(65); // 50 + 15 (indicator)

      // Resize renderable column index `1` (within visual index term the index at 1 is hidden).
      await resizeColumn(1, 100);

      expect(colWidth(spec().$container, 1)).toBe(99); // 100 (the dragged width, the indicator included) - 1 (margin from overlay)
    });

    it('should report the indicator width of a column next to a hidden column on both sides', async() => {
      handsontable({
        data: createSpreadsheetData(2, 6),
        colHeaders: true,
        hiddenColumns: {
          columns: [2],
          indicators: true
        },
      });

      const plugin = getPlugin('hiddenColumns');

      expect(plugin.getIndicatorExtraWidth(0)).toBe(0);
      expect(plugin.getIndicatorExtraWidth(1)).toBe(15);
      expect(plugin.getIndicatorExtraWidth(3)).toBe(15);
      expect(plugin.getIndicatorExtraWidth(4)).toBe(0);
    });

    it('should report no indicator width when the indicators are off or there are no column headers', async() => {
      handsontable({
        data: createSpreadsheetData(2, 6),
        colHeaders: true,
        hiddenColumns: {
          columns: [2],
          indicators: false
        },
      });

      expect(getPlugin('hiddenColumns').getIndicatorExtraWidth(1)).toBe(0);

      await updateSettings({ colHeaders: false, hiddenColumns: { columns: [2], indicators: true } });

      expect(getPlugin('hiddenColumns').getIndicatorExtraWidth(1)).toBe(0);
    });

    it('should report no indicator width when the plugin is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(2, 6),
        colHeaders: true,
        hiddenColumns: {
          columns: [2],
          indicators: true
        },
      });

      await updateSettings({ hiddenColumns: false });

      expect(getPlugin('hiddenColumns').getIndicatorExtraWidth(1)).toBe(0);
    });

    it('should resize a proper column when the table contains hidden column using public API', async() => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
        },
        manualColumnResize: true,
      });

      expect(colWidth(spec().$container, 1)).toBe(50);

      getPlugin('manualColumnResize').setManualSize(2, 100);
      await render();

      expect(colWidth(spec().$container, 1)).toBe(100);
    });

    it('should display the resize handler in the proper position when the table contains hidden column', async() => {
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

      expect($handle.offset().left).toBe(
        $headerTH.offset().left + $headerTH.outerWidth() - ($handle.outerWidth() / 2) - 1
      );
      expect($handle.height()).toBe($headerTH.outerHeight());
    });

    it('should display the resize handler in the proper position when the table contains hidden fixed left column', async() => {
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

      expect($handle.offset().left).toBe(
        $headerTH.offset().left + $headerTH.outerWidth() - ($handle.outerWidth() / 2) - 1
      );
      expect($handle.height()).toBe($headerTH.outerHeight());
    });

    it('should resize a proper column using the resize handler when the table contains hidden column', async() => {
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

      const widthBefore = colWidth(spec().$container, 1);

      const $headerTH = getTopClone().find('thead tr:eq(0) th:eq(1)'); // Header "C"

      $headerTH.simulate('mouseover');

      const $resizer = spec().$container.find('.manualColumnResizer');
      const resizerPosition = $resizer.position();

      $resizer
        .simulate('mousedown', { clientX: resizerPosition.left })
        .simulate('mousemove', { clientX: resizerPosition.left + 30 })
        .simulate('mouseup')
      ;

      expect(colWidth(spec().$container, 1)).toBeGreaterThan(widthBefore);
    });
  });
});
